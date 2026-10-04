// Payment handlers: Razorpay create-order, verify (fulfilment), and webhook safety net.
import crypto from 'crypto';
import { waitUntil } from '@vercel/functions';
import { getSupabase, getRazorpay, send, readJson, safeEqual } from './core.js';
import { createShiprocketOrder } from './shiprocket.js';
import { sendOrderConfirmationEmail, sendOwnerAlertEmail } from './email.js';

// POST /api/payment/create-order — Body: { amount (rupees), currency? }
export async function createOrder(req, res) {
  try {
    const { amount, currency = 'INR' } = await readJson(req);
    const amountInPaise = Math.round(amount * 100);

    if (!amount || amountInPaise < 100) {
      return send(res, 400, { error: 'Amount must be at least ₹1 (100 paise)' });
    }

    const rzpOrder = await getRazorpay().orders.create({
      amount: amountInPaise,
      currency,
      receipt: `temp_${Date.now()}`,
    });

    send(res, 200, { orderId: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency });
  } catch (err) {
    if (err.status === 400 && err.message === 'Invalid JSON body') return send(res, 400, { error: err.message });
    console.error('[Razorpay] Create order error:', err);
    send(res, 500, { error: 'Failed to create payment order', detail: err.message });
  }
}

// POST /api/payment/verify
export async function verifyPayment(req, res) {
  const supabase = getSupabase();
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      userId,
      guestEmail,
      shippingAddress,
      cartItems,
    } = await readJson(req);

    // ── Step 1: Verify Razorpay signature ──
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (!safeEqual(expectedSignature, razorpay_signature)) {
      console.log('[Verify] Signature mismatch');
      return send(res, 400, { error: 'Invalid payment signature', paymentFailed: true });
    }

    if (!shippingAddress || !Array.isArray(cartItems) || cartItems.length === 0) {
      return send(res, 400, { error: 'Missing shipping address or cart items', paymentFailed: false });
    }

    // ── Idempotency: a retry for the same payment returns the existing order ──
    const { data: existing } = await supabase
      .from('orders')
      .select('id, shiprocket_order_id')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .maybeSingle();
    if (existing) {
      return send(res, 200, {
        success: true,
        orderId: existing.id,
        shiprocketOrderId: existing.shiprocket_order_id || null,
        razorpayPaymentId: razorpay_payment_id,
      });
    }

    // ── Amount integrity: trust Razorpay's record of what was charged, not the client ──
    const rzpOrder = await getRazorpay().orders.fetch(razorpay_order_id);
    const paidPaise = Number(rzpOrder.amount);
    if (Math.round(Number(amount) * 100) !== paidPaise) {
      console.error('[Verify] Amount mismatch. client:', amount, 'razorpay(paise):', paidPaise);
      waitUntil(sendOwnerAlertEmail(
        'ACTION NEEDED: payment amount mismatch',
        `<p>Payment <b>${razorpay_payment_id}</b> (order ${razorpay_order_id}) was rejected: client claimed ₹${amount} but Razorpay charged ₹${paidPaise / 100}. Check/refund in the Razorpay dashboard.</p>`
      ).catch(() => {}));
      return send(res, 400, { error: 'Payment amount mismatch. Please contact support.', paymentFailed: false });
    }

    // Charged amount must cover the catalogue price of the cart (guards against paying ₹1 for a big cart)
    const ids = cartItems.map((i) => i.productId || i.id).filter(Boolean);
    if (ids.length) {
      const { data: prods } = await supabase.from('products').select('id, price, discounted_price').in('id', ids);
      const priceMap = new Map((prods || []).map((p) => [p.id, Math.min(Number(p.price) || Infinity, Number(p.discounted_price) || Infinity)]));
      const catalogueTotal = cartItems.reduce((sum, i) => {
        const p = priceMap.get(i.productId || i.id);
        return sum + (Number.isFinite(p) ? p * (Number(i.quantity) || 1) : 0);
      }, 0);
      if (paidPaise < Math.floor(catalogueTotal * 100 * 0.98)) {
        console.error('[Verify] Underpayment. paid(paise):', paidPaise, 'catalogue(₹):', catalogueTotal);
        waitUntil(sendOwnerAlertEmail(
          'ACTION NEEDED: possible underpayment',
          `<p>Payment <b>${razorpay_payment_id}</b> charged ₹${paidPaise / 100} but the cart's catalogue total is ₹${catalogueTotal}. No order was created. Review/refund in Razorpay.</p>`
        ).catch(() => {}));
        return send(res, 400, { error: 'Payment amount does not match cart. Please contact support.', paymentFailed: false });
      }
    }

    // ── Step 2: Resolve / create user ──
    let finalUserId = userId;
    let customerEmail = guestEmail || '';
    let customerName = shippingAddress.full_name || '';

    if (!finalUserId) {
      if (!guestEmail) return send(res, 400, { error: 'Email is required for guest checkout', paymentFailed: false });
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, email, name')
        .ilike('email', guestEmail)
        .single();

      if (profile) {
        finalUserId = profile.id;
        customerEmail = profile.email || guestEmail;
        customerName = profile.name || shippingAddress.full_name;
      } else {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: guestEmail,
          password: crypto.randomBytes(16).toString('hex'),
          email_confirm: true,
          user_metadata: { name: shippingAddress.full_name },
        });
        if (createError) throw new Error(`Shadow user creation failed: ${createError.message}`);
        finalUserId = newUser.user.id;
      }
    } else {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('email, name')
        .eq('id', finalUserId)
        .single();
      customerEmail = profile?.email || '';
      customerName = profile?.name || shippingAddress.full_name || '';
    }

    // ── Step 3: Save address ──
    const cleanAddress = {
      full_name: shippingAddress.full_name || '',
      phone: shippingAddress.phone || '',
      address_line1: shippingAddress.address_line1 || '',
      address_line2: shippingAddress.address_line2 || '',
      city: shippingAddress.city || '',
      state: shippingAddress.state || '',
      pincode: String(shippingAddress.pincode || ''),
      is_default: false,
    };
    const { data: addressData, error: addressError } = await supabase
      .from('addresses')
      .insert({ user_id: finalUserId, ...cleanAddress })
      .select()
      .single();
    if (addressError) throw new Error(`Address creation failed: ${addressError.message}`);

    // ── Step 4: Create order ──
    const { data: sbOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: finalUserId,
        total_amount: paidPaise,
        shipping_address_id: addressData.id,
        status: 'paid',
        razorpay_order_id,
        razorpay_payment_id,
      })
      .select()
      .single();
    if (orderError || !sbOrder) throw new Error(`Order creation failed: ${orderError?.message}`);

    // ── Step 5: Order items ──
    const orderItemsData = cartItems.map((item) => ({
      order_id: sbOrder.id,
      product_id: item.productId || item.id || null,
      quantity: item.quantity,
      price_at_purchase: Math.round(item.price * 100),
      product_name_snapshot: item.name || null,
      price_inr_snapshot: Math.round(item.price),
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);
    if (itemsError) throw new Error(`Order items creation failed: ${itemsError.message}`);

    // ── Decrement stock ──
    for (const item of cartItems) {
      const pId = item.productId || item.id;
      if (pId) {
        const { data: prod } = await supabase.from('products').select('stock').eq('id', pId).single();
        if (prod && typeof prod.stock === 'number') {
          await supabase.from('products').update({ stock: Math.max(0, prod.stock - item.quantity) }).eq('id', pId);
        }
      }
    }

    // Respond right away; Shiprocket + email continue via waitUntil (a bare promise
    // would be frozen when a Vercel Function returns).
    send(res, 200, {
      success: true,
      orderId: sbOrder.id,
      shiprocketOrderId: null,
      razorpayPaymentId: razorpay_payment_id,
    });

    waitUntil((async () => {
      let shiprocketOrderId = null;
      try {
        shiprocketOrderId = await createShiprocketOrder(sbOrder.id);
        console.log('[Verify] Shiprocket order created:', shiprocketOrderId);
      } catch (srErr) {
        console.error('[Shiprocket] Order creation failed:', srErr.message);
      }
      try {
        await sendOrderConfirmationEmail({
          orderId: sbOrder.id,
          userEmail: customerEmail,
          userName: customerName,
          shiprocketOrderId,
        });
      } catch (emailErr) {
        console.error('[Email] Failed (non-fatal):', emailErr.message);
      }
    })());
  } catch (err) {
    console.error('[Razorpay] Verify error:', err);
    if (!res.headersSent) {
      send(res, 500, { error: 'Payment verification failed', detail: err.message, paymentFailed: true });
    }
  }
}

// POST /api/payment/webhook — Razorpay webhook (safety net).
// Verifies x-razorpay-signature against the RAW body using RAZORPAY_WEBHOOK_SECRET.
export async function razorpayWebhook(req, res) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET not configured');
      return send(res, 500, { error: 'Webhook not configured' });
    }
    await readJson(req); // populates req.rawBody
    const signature = req.headers['x-razorpay-signature'];
    const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
    if (!safeEqual(expected, signature)) {
      return send(res, 400, { error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(req.rawBody.toString('utf8'));
    const payment = event?.payload?.payment?.entity;
    console.log('[Razorpay Webhook] event:', event.event, 'payment:', payment?.id);

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const rzpPaymentId = payment?.id;
      const rzpOrderId = payment?.order_id || event?.payload?.order?.entity?.id;
      const supabase = getSupabase();

      // verify() normally wins the race; give it a few seconds before deciding the order is missing.
      let order = null;
      for (let i = 0; i < 4 && !order; i++) {
        const { data } = await supabase
          .from('orders')
          .select('id')
          .eq('razorpay_payment_id', rzpPaymentId)
          .maybeSingle();
        order = data;
        if (!order) await new Promise((r) => setTimeout(r, 2000));
      }

      if (!order) {
        console.error('[Razorpay Webhook] Captured payment with NO order record:', rzpPaymentId);
        await sendOwnerAlertEmail(
          'ACTION NEEDED: payment captured but no order recorded',
          `<p>Razorpay payment <b>${rzpPaymentId}</b> (order ${rzpOrderId}, ₹${(payment?.amount || 0) / 100}, ${payment?.email || 'no email'}, ${payment?.contact || ''}) was captured but no order exists in the database. The customer likely closed the page before verification finished. Create the order manually or refund.</p>`
        ).catch((e) => console.error('[Razorpay Webhook] alert email failed:', e.message));
      }
    }

    // Always 200 for authentic events so Razorpay doesn't retry indefinitely.
    send(res, 200, { received: true });
  } catch (err) {
    console.error('[Razorpay Webhook] Error:', err);
    send(res, 500, { error: 'Webhook processing failed' });
  }
}
