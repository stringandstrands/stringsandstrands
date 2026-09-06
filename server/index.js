// ─────────────────────────────────────────────────────────────────────────────
// Strings & Strands — Express Backend
// Handles: Razorpay orders & payment verification, Shiprocket shipping,
//          Resend email notifications, Supabase service-role operations
// ─────────────────────────────────────────────────────────────────────────────

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Supabase (service-role — server only) ────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Razorpay ─────────────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// ─────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// ─────────────────────────────────────────────────────────────────────────────
// ADMIN MIDDLEWARE — verify JWT + is_admin flag
// ─────────────────────────────────────────────────────────────────────────────
async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }
    const token = authHeader.slice(7);

    // Verify JWT with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check is_admin flag
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return res.status(403).json({ error: 'Access denied — not an admin' });
    }

    req.adminUser = user;
    next();
  } catch (err) {
    console.error('[Admin Auth]', err);
    res.status(500).json({ error: 'Auth check failed' });
  }
}

// Helper: log admin action
async function logAdminAction(adminId, action, targetType, targetId, notes = '') {
  try {
    await supabase.from('admin_activity_log').insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: String(targetId),
      notes,
    });
  } catch (e) { /* non-fatal */ }
}


// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/products  — list with search/filter/sort/pagination
app.get('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const { search, category, sortBy = 'created_at', sortDir = 'desc', page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortDir === 'asc' })
      .range(offset, offset + Number(limit) - 1);

    if (search) query = query.ilike('name', `%${search}%`);
    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ products: data, total: count });
  } catch (err) {
    console.error('[Admin] Products list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/products — create product
app.post('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const { variants, ...productData } = req.body;
    const product = productData;
    const baseId = product.id || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
    
    if (req.body.variants && req.body.variants.length > 0) {
      const inserts = req.body.variants.map((v) => {
        return {
          ...productData,
          id: `${baseId}-${v.color.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          name: `${product.name} (${v.color})`,
          color: v.color,
          images: v.images
        };
      });
      console.log('Inserting bulk variants payload keys:', inserts.map(i => Object.keys(i)));
      const { data, error } = await supabase.from('products').insert(inserts).select();
      if (error) throw error;
      await logAdminAction(req.adminUser.id, 'create_product', 'product', 'bulk', `Created ${req.body.variants.length} variants for: ${product.name}`);
      res.json({ product: data[0] }); // Return first one to satisfy frontend
    } else {
      product.id = baseId;
      console.log('Inserting single product payload keys:', Object.keys(product));
      const { data, error } = await supabase.from('products').insert(product).select().single();
      if (error) throw error;
      await logAdminAction(req.adminUser.id, 'create_product', 'product', data.id, `Created: ${data.name}`);
      res.json({ product: data });
    }
  } catch (err) {
    console.error('[Admin] Create product error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/products/:id — update product fields
app.patch('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { variants, ...updates } = req.body;
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) throw error;
    await logAdminAction(req.adminUser.id, 'edit_product', 'product', id, `Updated: ${JSON.stringify(Object.keys(updates))}`);
    res.json({ product: data });
  } catch (err) {
    console.error('[Admin] Update product error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/products/:id — delete product (order_items preserved via ON DELETE SET NULL)
app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Snapshot product name/price into order_items before deletion
    const { data: product } = await supabase.from('products').select('name, price').eq('id', id).single();
    if (product) {
      await supabase.from('order_items')
        .update({ product_name_snapshot: product.name, price_inr_snapshot: Math.round(product.price) })
        .eq('product_id', id)
        .is('product_name_snapshot', null);
    }
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    await logAdminAction(req.adminUser.id, 'delete_product', 'product', id, `Deleted: ${product?.name}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[Admin] Delete product error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/products/upload-image — upload to Supabase Storage
app.post('/api/admin/products/upload-image', requireAdmin, async (req, res) => {
  try {
    const { base64, fileName, mimeType } = req.body;
    if (!base64 || !fileName) return res.status(400).json({ error: 'Missing file data' });

    const buffer = Buffer.from(base64, 'base64');
    const path = `${Date.now()}-${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, buffer, { contentType: mimeType || 'image/jpeg', upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
    res.json({ url: publicUrl });
  } catch (err) {
    console.error('[Admin] Image upload error:', err);
    res.status(500).json({ error: err.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — USERS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/users — list with order count & total spend
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { search, page = 1, limit = 30 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: profiles, error, count } = await query;
    if (error) throw error;

    // Attach order stats
    const userIds = profiles.map(p => p.id);
    const { data: orderStats } = await supabase
      .from('orders')
      .select('user_id, total_amount, status')
      .in('user_id', userIds)
      .in('status', ['paid', 'shipped', 'delivered']);

    const statsMap = {};
    for (const o of (orderStats || [])) {
      if (!statsMap[o.user_id]) statsMap[o.user_id] = { count: 0, total: 0 };
      statsMap[o.user_id].count++;
      statsMap[o.user_id].total += o.total_amount;
    }

    const users = profiles.map(p => ({
      ...p,
      order_count: statsMap[p.id]?.count || 0,
      total_spent_paise: statsMap[p.id]?.total || 0,
    }));

    res.json({ users, total: count });
  } catch (err) {
    console.error('[Admin] Users list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users/:id — single user detail
app.get('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [{ data: profile }, { data: addresses }, { data: orders }, { data: wishlist }] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', id).single(),
      supabase.from('addresses').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('orders').select('id, status, total_amount, created_at, razorpay_payment_id, tracking_status').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('wishlist_items').select('product_id, products(name, images, price)').eq('user_id', id),
    ]);
    res.json({ profile, addresses, orders, wishlist });
  } catch (err) {
    console.error('[Admin] User detail error:', err);
    res.status(500).json({ error: err.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — ORDERS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/orders — list with filters
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    const { status, dateFrom, dateTo, page = 1, limit = 30 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('orders')
      .select(
        'id, status, total_amount, created_at, razorpay_payment_id, razorpay_order_id, tracking_status, shiprocket_order_id, user_id, order_items(id)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (status) query = query.eq('status', status);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59Z');

    const { data, error, count } = await query;
    if (error) throw error;

    // Fetch user profiles separately (avoids FK join schema cache issue)
    const userIds = [...new Set((data || []).map(o => o.user_id).filter(Boolean))];
    let profileMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, name, email')
        .in('id', userIds);
      for (const p of (profiles || [])) profileMap[p.id] = p;
    }

    const orders = (data || []).map(o => ({
      ...o,
      item_count: o.order_items?.length || 0,
      customer_name: profileMap[o.user_id]?.name || profileMap[o.user_id]?.email || 'Guest',
      customer_email: profileMap[o.user_id]?.email || '',
    }));

    res.json({ orders, total: count });
  } catch (err) {
    console.error('[Admin] Orders list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/orders/:id — full order detail
app.get('/api/admin/orders/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        addresses(*),
        order_items(
          id, quantity, price_at_purchase, product_name_snapshot, price_inr_snapshot,
          products(id, name, images, price)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Fetch user profile separately
    let userProfile = null;
    if (data?.user_id) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('name, email, phone')
        .eq('id', data.user_id)
        .single();
      userProfile = profile;
    }

    res.json({ order: { ...data, user_profiles: userProfile } });
  } catch (err) {
    console.error('[Admin] Order detail error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/orders/:id/status — manually update order status
app.patch('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single();
    if (error) throw error;
    await logAdminAction(req.adminUser.id, 'update_order_status', 'order', id, `Status → ${status}`);
    res.json({ order: data });
  } catch (err) {
    console.error('[Admin] Update order status error:', err);
    res.status(500).json({ error: err.message });
  }
});



// ─────────────────────────────────────────────────────────────────────────────
// CHECK EMAIL EXISTS
// POST /api/auth/check-email
// Body: { email }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/auth/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Use service role to check user_profiles
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profile) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  } catch (err) {
    console.error('[Check Email] Error:', err);
    // If multiple rows or no rows are found, .single() might throw.
    // In our case, if no rows are found, it will throw an error with code 'PGRST116'
    if (err.code === 'PGRST116') {
      return res.json({ exists: false });
    }
    res.status(500).json({ error: 'Failed to check email' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// RAZORPAY — Create Order
// POST /api/payment/create-order
// Body: { amount: number (in paise), currency?: string, userId, shippingAddressId, cartItems }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;
    const amountInPaise = Math.round(amount * 100);

    if (!amount || amountInPaise < 100) {
      return res.status(400).json({ error: 'Amount must be at least ₹1 (100 paise)' });
    }

    // Only Create Razorpay order - Do not store in DB yet
    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: `temp_${Date.now()}`,
    });

    res.json({ 
      orderId: rzpOrder.id, 
      amount: rzpOrder.amount, 
      currency: rzpOrder.currency 
    });
  } catch (err) {
    console.error('[Razorpay] Create order error:', err);
    res.status(500).json({ error: 'Failed to create payment order', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// USER UTILS
// GET /api/user/order-count?email=...
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/user/order-count', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.json({ count: 0 });

    // 1. Find user_profile by email
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .ilike('email', email)
      .single();

    if (!profile) return res.json({ count: 0 });

    // 2. Count orders for this user
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .not('status', 'eq', 'cancelled'); // don't count cancelled orders

    res.json({ count: count || 0 });
  } catch (err) {
    console.error('[User Utils] order-count error:', err);
    res.json({ count: 0 }); // fail safe
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// RAZORPAY — Verify Payment & Fulfil Order
// POST /api/payment/verify
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, userId, guestEmail, shippingAddress, cartItems }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/payment/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      userId,
      guestEmail,
      shippingAddress,
      cartItems
    } = req.body;

    console.log('[Verify] Step 1: Checking signature. order_id:', razorpay_order_id, 'payment_id:', razorpay_payment_id);
    // ── Step 1: Verify Razorpay signature ────────────────────────────────────
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.log('[Verify] ❌ Signature mismatch!');
      return res.status(400).json({
        error: 'Invalid payment signature',
        paymentFailed: true,
      });
    }
    console.log('[Verify] ✅ Step 1 passed: Signature valid');

    console.log('[Verify] Step 2: Resolving user. userId:', userId, 'guestEmail:', guestEmail);
    // ── Step 2: Resolve / create user ────────────────────────────────────────
    let finalUserId = userId;
    let customerEmail = guestEmail || '';
    let customerName = shippingAddress.full_name || '';

    if (!finalUserId) {
      if (!guestEmail) return res.status(400).json({ error: 'Email is required for guest checkout', paymentFailed: false });
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
      // Fetch existing user profile details for email
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('email, name')
        .eq('id', finalUserId)
        .single();
      customerEmail = profile?.email || '';
      customerName = profile?.name || shippingAddress.full_name || '';
    }

    console.log('[Verify] ✅ Step 2 passed: finalUserId=', finalUserId);
    console.log('[Verify] Step 3: Saving address...');
    // ── Step 3: Save address ──────────────────────────────────────────────────
    // Explicitly pick only the columns that exist in the addresses table
    const cleanAddress = {
      full_name:    shippingAddress.full_name    || '',
      phone:        shippingAddress.phone        || '',
      address_line1: shippingAddress.address_line1 || '',
      address_line2: shippingAddress.address_line2 || '',
      city:         shippingAddress.city         || '',
      state:        shippingAddress.state        || '',
      pincode:      String(shippingAddress.pincode || ''),
      is_default:   false,
    };
    const { data: addressData, error: addressError } = await supabase
      .from('addresses')
      .insert({ user_id: finalUserId, ...cleanAddress })
      .select()
      .single();

    if (addressError) throw new Error(`Address creation failed: ${addressError.message}`);
    console.log('[Verify] ✅ Step 3 passed: address id=', addressData?.id);

    console.log('[Verify] Step 4: Creating order in Supabase. amount:', amount);
    // ── Step 4: Create order in Supabase ─────────────────────────────────────
    const amountInPaise = Math.round(amount * 100);

    const { data: sbOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: finalUserId,
        total_amount: amountInPaise,
        shipping_address_id: addressData.id,
        status: 'paid',
        razorpay_order_id,
        razorpay_payment_id,
      })
      .select()
      .single();

    if (orderError || !sbOrder) throw new Error(`Order creation failed: ${orderError?.message}`);
    console.log('[Verify] ✅ Step 4 passed: orderId=', sbOrder?.id);

    console.log('[Verify] Step 5: Inserting order items. count:', cartItems?.length);
    // Build order items — snapshot name & price so deleted products don't break history
    const orderItemsData = cartItems.map(item => ({
      order_id: sbOrder.id,
      product_id: item.productId || item.id || null,   // null-safe: product may have been deleted
      quantity: item.quantity,
      price_at_purchase: Math.round(item.price * 100),
      product_name_snapshot: item.name || null,
      price_inr_snapshot: Math.round(item.price),
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);
    if (itemsError) throw new Error(`Order items creation failed: ${itemsError.message}`);

    // ── Decrement stock for ordered products ─────────────────────────────────
    for (const item of cartItems) {
      const pId = item.productId || item.id;
      if (pId) {
        const { data: prod } = await supabase.from('products').select('stock').eq('id', pId).single();
        if (prod && typeof prod.stock === 'number') {
          const newStock = Math.max(0, prod.stock - item.quantity);
          await supabase.from('products').update({ stock: newStock }).eq('id', pId);
        }
      }
    }

    // ── Respond immediately so Render/Vercel don't timeout ───────────────────
    // Shiprocket + email are fired as background tasks AFTER responding
    console.log('[Verify] ✅ All DB steps done. Responding to client immediately.');
    res.json({
      success: true,
      orderId: sbOrder.id,
      shiprocketOrderId: null, // will be updated in background
      razorpayPaymentId: razorpay_payment_id,
    });

    // ── Background: Create Shiprocket order ──────────────────────────────────
    let shiprocketOrderId = null;
    try {
      shiprocketOrderId = await createShiprocketOrder(sbOrder.id);
      console.log('[Verify] ✅ Shiprocket order created in background:', shiprocketOrderId);
    } catch (srErr) {
      console.error('[Shiprocket] Background order creation failed:', srErr.message);
    }

    // ── Background: Send confirmation emails ─────────────────────────────────
    try {
      await sendOrderConfirmationEmail({
        orderId: sbOrder.id,
        userEmail: customerEmail,
        userName: customerName,
        shiprocketOrderId,
      });
      console.log('[Email] ✅ Confirmation email sent in background.');
    } catch (emailErr) {
      console.error('[Email] Background email failed (non-fatal):', emailErr.message);
    }

  } catch (err) {
    console.error('[Razorpay] Verify error:', err);
    // Only send error response if we haven't already responded
    if (!res.headersSent) {
      res.status(500).json({ error: 'Payment verification failed', detail: err.message, paymentFailed: true });
    }
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// SHIPROCKET HELPER — extracted so verify can call it directly (no localhost)
// Returns the shiprocketOrderId string on success, throws on failure
// ─────────────────────────────────────────────────────────────────────────────
async function createShiprocketOrder(orderId) {
  // Fetch order details from Supabase
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      addresses(*),
      order_items(quantity, price_at_purchase, product_id, products(name))
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !order) throw new Error(`Order not found: ${orderError?.message}`);

  // Authenticate with Shiprocket
  console.log('[Shiprocket] Authenticating...');
  const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });
  const authData = await authRes.json();
  console.log('[Shiprocket] Auth response status:', authRes.status, '| has token:', !!authData.token);
  if (!authData.token) throw new Error(`Shiprocket auth failed: ${authData.message || JSON.stringify(authData)}`);

  const srToken = authData.token;
  const addr = order.addresses;

  // Amounts: Razorpay stores in paise, Shiprocket expects rupees
  const totalInRupees = Math.round(order.total_amount / 100);

  // Shiprocket requires first + last name separately
  const nameParts = (addr.full_name || 'Customer').trim().split(/\s+/);
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '.';

  const payload = {
    order_id: orderId,
    order_date: new Date().toISOString().split('T')[0],
    pickup_location: 'Kaj Organics',
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: addr.address_line1,
    billing_address_2: addr.address_line2 || '',
    billing_city: addr.city,
    billing_pincode: String(addr.pincode),
    billing_state: addr.state,
    billing_country: 'India',
    billing_email: '',
    billing_phone: String(addr.phone),
    shipping_is_billing: true,
    order_items: order.order_items.map((item) => ({
      name: item.products?.name || 'Jewellery Item',
      sku: item.product_id || 'SKU001',
      units: item.quantity,
      selling_price: Math.round(item.price_at_purchase / 100), // convert paise → rupees
      weight: '0.5',
    })),
    payment_method: 'Prepaid',
    sub_total: totalInRupees,  // rupees, not paise
    length: 10,
    breadth: 10,
    height: 5,
    weight: 0.5,
  };

  console.log('[Shiprocket] Creating order with payload:', JSON.stringify(payload, null, 2));

  const srOrderRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${srToken}`,
    },
    body: JSON.stringify(payload),
  });

  const srOrder = await srOrderRes.json();
  console.log('[Shiprocket] Create order response status:', srOrderRes.status);
  console.log('[Shiprocket] Create order response body:', JSON.stringify(srOrder, null, 2));

  if (!srOrder.order_id) {
    throw new Error(`Shiprocket order creation failed: ${srOrder.message || JSON.stringify(srOrder)}`);
  }

  // Save Shiprocket order ID back to Supabase
  await supabase
    .from('orders')
    .update({
      shiprocket_order_id: String(srOrder.order_id),
      status: 'shipped',
    })
    .eq('id', orderId);

  return String(srOrder.order_id);
}

// ─────────────────────────────────────────────────────────────────────────────
// SHIPROCKET — Create Shipment (public endpoint, delegates to helper)
// POST /api/shipping/create
// Body: { orderId }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/shipping/create', async (req, res) => {
  try {
    const { orderId } = req.body;
    const shiprocketOrderId = await createShiprocketOrder(orderId);
    res.json({ success: true, shiprocketOrderId });
  } catch (err) {
    console.error('[Shiprocket] Error:', err.message);
    res.status(500).json({ error: 'Shipping creation failed', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SHIPROCKET — Track Shipment
// GET /api/shipping/track/:orderId
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/shipping/track/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data: order } = await supabase
      .from('orders')
      .select('shiprocket_order_id, awb_number')
      .eq('id', orderId)
      .single();

    if (!order?.shiprocket_order_id) {
      return res.status(404).json({ error: 'Shipment not found or not yet dispatched' });
    }

    // Re-authenticate
    const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }),
    });
    const { token } = await authRes.json();

    const trackRes = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/track/order/${order.shiprocket_order_id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const trackData = await trackRes.json();

    res.json({ tracking: trackData });
  } catch (err) {
    console.error('[Shiprocket] Track error:', err);
    res.status(500).json({ error: 'Tracking failed' });
  }
});

// SHIPROCKET — Webhook to receive automatic tracking updates
app.post('/api/shiprocket/webhook', async (req, res) => {
  try {
    // Shiprocket sends a POST request whenever an order status changes
    // It contains fields like order_id (their ID), channel_order_id (our DB ID), and current_status
    
    // Some headers from Shiprocket contain auth tokens, but for now we'll accept the payload directly
    const payload = req.body;
    console.log('[Shiprocket Webhook] Received status update:', payload.current_status, 'for order', payload.order_id);

    if (!payload.current_status) {
      return res.status(400).json({ error: 'No status provided' });
    }

    // Determine the identifier to update the order
    // "order_id" in the payload is the Shiprocket order ID.
    // "channel_order_id" in the payload is our database's order ID (sbOrder.id).
    
    let query = supabase.from('orders').update({ tracking_status: payload.current_status });
    
    if (payload.channel_order_id) {
      query = query.eq('id', payload.channel_order_id);
    } else if (payload.order_id) {
      query = query.eq('shiprocket_order_id', String(payload.order_id));
    } else {
      return res.status(400).json({ error: 'No order identifier found in payload' });
    }

    const { data: updatedOrder, error } = await query.select('id').single();
    if (error) {
      console.error('[Shiprocket Webhook] DB update failed:', error.message);
      return res.status(500).json({ error: 'Failed to update status in DB' });
    }

    console.log('[Shiprocket Webhook] Successfully updated order status to', payload.current_status);
    
    // Fire tracking update email
    if (updatedOrder && updatedOrder.id) {
      try {
        await sendTrackingUpdateEmail({
          orderId: updatedOrder.id,
          currentStatus: payload.current_status,
          shiprocketOrderId: payload.order_id
        });
      } catch (emailErr) {
        console.error('[Shiprocket Webhook] Failed to send update email:', emailErr);
      }
    }

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (err) {
    console.error('[Shiprocket Webhook] Error processing webhook:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TRACKING EMAIL HELPER
// ─────────────────────────────────────────────────────────────────────────────
async function sendTrackingUpdateEmail({ orderId, currentStatus, shiprocketOrderId }) {
  // Query Supabase for order user_id
  const { data: order } = await supabase.from('orders').select('user_id').eq('id', orderId).single();
  if (!order || !order.user_id) return;
  
  // Query user profile for email
  const { data: profile } = await supabase.from('user_profiles').select('email, name').eq('id', order.user_id).single();
  if (!profile || !profile.email) return;

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const shortId = orderId.slice(0, 8).toUpperCase();
  const customerHtml = `
    <div style="font-family:'Georgia',serif;max-width:600px;margin:auto;background:#fff;border:1px solid #FFD1E3;border-radius:16px;overflow:hidden;">
      <div style="background:#B3184F;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:1px;">Tracking Update</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#B3184F;margin-top:0;">Hi ${profile.name || 'Customer'},</h2>
        <p style="color:#444;line-height:1.6;font-size:15px;">
          Your order <strong>#${shortId}</strong> has a new tracking update!
        </p>
        <div style="background:#fff5f8;border:1px solid #FFD1E3;padding:16px;border-radius:8px;margin:24px 0;text-align:center;">
          <p style="margin:0;color:#B3184F;font-weight:bold;font-size:18px;">Status: ${currentStatus}</p>
        </div>
        ${shiprocketOrderId ? `<p style="color:#444;font-size:14px;text-align:center;">Shiprocket Tracking ID: <span style="font-family:monospace;font-weight:600;">${shiprocketOrderId}</span></p>` : ''}
        <p style="color:#666;font-size:14px;margin-top:32px;border-top:1px solid #eee;padding-top:16px;text-align:center;">
          With love,<br/><strong>Strings & Strands</strong>
        </p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: 'Strings & Strands <orders@stringsandstrands.in>',
    to: profile.email,
    subject: `Order Update: Your package is ${currentStatus}!`,
    html: customerHtml,
  });
}
// ─────────────────────────────────────────────────────────────────────────────
// EMAIL HELPER — reusable, called directly by verify (no localhost)
// ─────────────────────────────────────────────────────────────────────────────
async function sendOrderConfirmationEmail({ orderId, userEmail, userName, shiprocketOrderId }) {
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data: order } = await supabase
    .from('orders')
    .select('total_amount, created_at, razorpay_payment_id, order_items(quantity, price_at_purchase, products(name))')
    .eq('id', orderId)
    .single();

  const itemsList = order?.order_items
    ?.map((i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #FFD1E3;">${i.products?.name || 'Jewellery Item'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #FFD1E3;text-align:center;">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #FFD1E3;text-align:right;font-weight:600;">&#8377;${(Math.round(i.price_at_purchase / 100) * i.quantity).toLocaleString('en-IN')}</td>
      </tr>`)
    .join('') || '<tr><td colspan="3" style="padding:8px 12px;">No items</td></tr>';

  const orderShortId = String(orderId).slice(0, 8).toUpperCase();
  const totalInr = order?.total_amount ? (order.total_amount / 100).toLocaleString('en-IN') : '-';
  const orderDate = order?.created_at
    ? new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN');

  const customerHtml = `
    <div style="font-family:'Georgia',serif;max-width:600px;margin:auto;background:#fff;border:1px solid #FFD1E3;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#FF2D74,#B3184F);padding:32px;text-align:center;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border:2px solid rgba(255,255,255,0.5);border-radius:50%;margin-bottom:16px;background:rgba(255,255,255,0.1);color:#fff;font-size:32px;">
          &#10003;
        </div>
        <h1 style="margin:0;color:#fff;font-size:28px;letter-spacing:1px;">Order Confirmed!</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">Thank you, ${userName}!</p>
      </div>
      <div style="padding:28px 32px;">
        <p style="color:#B3184F;font-size:15px;margin-top:0;">Your order has been placed and handed to our shipping partner. You will receive tracking updates soon.</p>
        <div style="background:#fff5f8;border-radius:10px;padding:16px 20px;margin:20px 0;border:1px solid #FFD1E3;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:#888;font-size:13px;">Order ID</span>
            <span style="color:#B3184F;font-weight:700;font-size:13px;font-family:monospace;">#${orderShortId}</span>
          </div>
          ${shiprocketOrderId ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:#888;font-size:13px;">Shiprocket ID</span>
            <span style="color:#B3184F;font-weight:700;font-size:13px;font-family:monospace;">${shiprocketOrderId}</span>
          </div>` : ''}
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#888;font-size:13px;">Order Date</span>
            <span style="color:#B3184F;font-size:13px;">${orderDate}</span>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <thead>
            <tr style="background:#FFD1E3;">
              <th style="padding:10px 12px;text-align:left;color:#B3184F;font-size:12px;text-transform:uppercase;">Item</th>
              <th style="padding:10px 12px;text-align:center;color:#B3184F;font-size:12px;text-transform:uppercase;">Qty</th>
              <th style="padding:10px 12px;text-align:right;color:#B3184F;font-size:12px;text-transform:uppercase;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsList}</tbody>
        </table>
        <div style="text-align:right;padding:12px 0;border-top:2px solid #FFD1E3;">
          <span style="color:#B3184F;font-size:18px;font-weight:700;">Total: &#8377;${totalInr}</span>
        </div>
      </div>
      <div style="background:#fff5f8;padding:20px 32px;text-align:center;border-top:1px solid #FFD1E3;">
        <p style="margin:0;font-size:12px;color:#aaa;">Strings &amp; Strands &mdash; Timeless jewellery for every chapter.</p>
      </div>
    </div>
  `;

  const ownerHtml = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <h2 style="color:#B3184F;">New Order Received</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#888;width:160px;">Order ID</td><td style="font-weight:600;font-family:monospace;">#${orderShortId} (${orderId})</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Customer</td><td>${userName} (${userEmail})</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Total</td><td style="font-weight:700;color:#B3184F;">&#8377;${totalInr}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Date</td><td>${orderDate}</td></tr>
        ${shiprocketOrderId ? `<tr><td style="padding:6px 0;color:#888;">Shiprocket ID</td><td style="font-family:monospace;font-weight:600;">${shiprocketOrderId}</td></tr>` : ''}
        ${order?.razorpay_payment_id ? `<tr><td style="padding:6px 0;color:#888;">Razorpay Pymt</td><td style="font-family:monospace;font-size:12px;">${order.razorpay_payment_id}</td></tr>` : ''}
      </table>
      <h3 style="color:#B3184F;margin-top:20px;">Items</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#FFD1E3;"><th style="padding:8px;text-align:left;">Item</th><th style="padding:8px;text-align:center;">Qty</th><th style="padding:8px;text-align:right;">Price</th></tr></thead>
        <tbody>${itemsList}</tbody>
      </table>
    </div>
  `;

  const fromAddress = 'Strings & Strands <orders@stringsandstrands.in>';

  if (userEmail) {
    try {
      await resend.emails.send({
        from: fromAddress,
        to: userEmail,
        subject: `Order Confirmed #${orderShortId} - Strings & Strands`,
        html: customerHtml,
      });
      console.log('[Email] Confirmation sent to customer:', userEmail);
    } catch (e) {
      console.log('[Email] Failed to send customer email (likely Resend Sandbox restriction):', e.message);
    }
  }

  try {
    await resend.emails.send({
      from: fromAddress,
      to: process.env.OWNER_EMAIL || 'stringandstrands26@gmail.com',
      subject: `New Order #${orderShortId} - Rs.${totalInr} from ${userName}`,
      html: ownerHtml,
    });
    console.log('[Email] Notification sent to owner:', process.env.OWNER_EMAIL);
  } catch (e) {
    console.log('[Email] Failed to send owner email:', e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL — Send Order Confirmation (public route, delegates to helper)
// POST /api/email/order-confirmation
// Body: { orderId, userEmail, userName, shiprocketOrderId }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/email/order-confirmation', async (req, res) => {
  try {
    const { orderId, userEmail, userName, shiprocketOrderId } = req.body;
    await sendOrderConfirmationEmail({ orderId, userEmail, userName, shiprocketOrderId });
    res.json({ success: true });
  } catch (err) {
    console.error('[Email/Gmail] Error:', err);
    res.status(500).json({ error: 'Email sending failed' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL — Test endpoint for debugging Render SMTP
// GET /api/test-email
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/test-email', async (req, res) => {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const info = await resend.emails.send({
      from: 'Strings & Strands Test <orders@stringsandstrands.in>',
      to: process.env.OWNER_EMAIL || 'stringandstrands26@gmail.com',
      subject: 'Render Test Email - Resend API',
      text: 'If you see this, Resend works perfectly and bypassed Render firewall!',
    });
    
    res.json({ 
      success: true, 
      message: 'Email sent successfully via Resend API!',
      info 
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to send email via Resend', 
      detail: err.message, 
      stack: err.stack,
    });
  }
});

// START SERVER
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Strings & Strands API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});
