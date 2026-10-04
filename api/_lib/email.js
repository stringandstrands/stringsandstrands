// Transactional emails via Resend. Templates preserved from the Express backend.
import { Resend } from 'resend';
import { getSupabase } from './core.js';

const FROM = 'Strings & Strands <orders@stringsandstrands.in>';
const ownerEmail = () => process.env.OWNER_EMAIL || 'stringandstrands26@gmail.com';

function resend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Resend v3 returns { data, error } instead of throwing on API errors.
async function sendMail(payload) {
  const { error } = await resend().emails.send(payload);
  if (error) throw new Error(error.message || JSON.stringify(error));
}

// ── Shipping / tracking update (customer) ────────────────────────────────────
export async function sendTrackingUpdateEmail({ orderId, currentStatus, shiprocketOrderId }) {
  const supabase = getSupabase();
  const { data: order } = await supabase.from('orders').select('user_id').eq('id', orderId).single();
  if (!order || !order.user_id) return;

  const { data: profile } = await supabase.from('user_profiles').select('email, name').eq('id', order.user_id).single();
  if (!profile || !profile.email) return;

  const shortId = orderId.slice(0, 8).toUpperCase();
  const customerHtml = `
    <div style="font-family:'Georgia',serif;max-width:600px;margin:auto;background:#fff;border:1px solid #FFD1E3;border-radius:16px;overflow:hidden;">
      <div style="background:#B3184F;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:1px;">Tracking Update</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#B3184F;margin-top:0;">Hi ${esc(profile.name || 'Customer')},</h2>
        <p style="color:#444;line-height:1.6;font-size:15px;">
          Your order <strong>#${shortId}</strong> has a new tracking update!
        </p>
        <div style="background:#fff5f8;border:1px solid #FFD1E3;padding:16px;border-radius:8px;margin:24px 0;text-align:center;">
          <p style="margin:0;color:#B3184F;font-weight:bold;font-size:18px;">Status: ${esc(currentStatus)}</p>
        </div>
        ${shiprocketOrderId ? `<p style="color:#444;font-size:14px;text-align:center;">Shiprocket Tracking ID: <span style="font-family:monospace;font-weight:600;">${esc(shiprocketOrderId)}</span></p>` : ''}
        <p style="color:#666;font-size:14px;margin-top:32px;border-top:1px solid #eee;padding-top:16px;text-align:center;">
          With love,<br/><strong>Strings &amp; Strands</strong>
        </p>
      </div>
    </div>
  `;

  await sendMail({
    from: FROM,
    to: profile.email,
    subject: `Order Update: Your package is ${currentStatus}!`,
    html: customerHtml,
  });
}

// ── Order confirmation (customer) + new order alert (owner) ──────────────────
export async function sendOrderConfirmationEmail({ orderId, userEmail, userName, shiprocketOrderId }) {
  const { data: order } = await getSupabase()
    .from('orders')
    .select('total_amount, created_at, razorpay_payment_id, order_items(quantity, price_at_purchase, products(name))')
    .eq('id', orderId)
    .single();

  const itemsList = order?.order_items
    ?.map((i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #FFD1E3;">${esc(i.products?.name || 'Jewellery Item')}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #FFD1E3;text-align:center;">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #FFD1E3;text-align:right;font-weight:600;">&#8377;${(Math.round(i.price_at_purchase / 100) * i.quantity).toLocaleString('en-IN')}</td>
      </tr>`)
    .join('') || '<tr><td colspan="3" style="padding:8px 12px;">No items</td></tr>';

  const orderShortId = String(orderId).slice(0, 8).toUpperCase();
  const totalInr = order?.total_amount ? (order.total_amount / 100).toLocaleString('en-IN') : '-';
  const dateOpts = { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata' };
  const orderDate = order?.created_at
    ? new Date(order.created_at).toLocaleString('en-IN', dateOpts)
    : new Date().toLocaleString('en-IN', dateOpts);

  const customerHtml = `
    <div style="font-family:'Georgia',serif;max-width:600px;margin:auto;background:#fff;border:1px solid #FFD1E3;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#FF2D74,#B3184F);padding:32px;text-align:center;">
        <div style="display:inline-block;width:64px;height:64px;line-height:64px;text-align:center;border:2px solid rgba(255,255,255,0.5);border-radius:50%;margin-bottom:16px;background:rgba(255,255,255,0.1);color:#fff;font-size:32px;">
          &#10003;
        </div>
        <h1 style="margin:0;color:#fff;font-size:28px;letter-spacing:1px;">Order Confirmed!</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">Thank you, ${esc(userName)}!</p>
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
            <span style="color:#B3184F;font-weight:700;font-size:13px;font-family:monospace;">${esc(shiprocketOrderId)}</span>
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
        <tr><td style="padding:6px 0;color:#888;width:160px;">Order ID</td><td style="font-weight:600;font-family:monospace;">#${orderShortId} (${esc(orderId)})</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Customer</td><td>${esc(userName)} (${esc(userEmail)})</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Total</td><td style="font-weight:700;color:#B3184F;">&#8377;${totalInr}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Date</td><td>${orderDate}</td></tr>
        ${shiprocketOrderId ? `<tr><td style="padding:6px 0;color:#888;">Shiprocket ID</td><td style="font-family:monospace;font-weight:600;">${esc(shiprocketOrderId)}</td></tr>` : ''}
        ${order?.razorpay_payment_id ? `<tr><td style="padding:6px 0;color:#888;">Razorpay Pymt</td><td style="font-family:monospace;font-size:12px;">${esc(order.razorpay_payment_id)}</td></tr>` : ''}
      </table>
      <h3 style="color:#B3184F;margin-top:20px;">Items</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#FFD1E3;"><th style="padding:8px;text-align:left;">Item</th><th style="padding:8px;text-align:center;">Qty</th><th style="padding:8px;text-align:right;">Price</th></tr></thead>
        <tbody>${itemsList}</tbody>
      </table>
    </div>
  `;

  if (userEmail) {
    try {
      await sendMail({
        from: FROM,
        to: userEmail,
        subject: `Order Confirmed #${orderShortId} - Strings & Strands`,
        html: customerHtml,
      });
      console.log('[Email] Confirmation sent to customer:', userEmail);
    } catch (e) {
      console.log('[Email] Failed to send customer email:', e.message);
    }
  }

  try {
    await sendMail({
      from: FROM,
      to: ownerEmail(),
      subject: `New Order #${orderShortId} - Rs.${totalInr} from ${userName}`,
      html: ownerHtml,
    });
    console.log('[Email] Notification sent to owner');
  } catch (e) {
    console.log('[Email] Failed to send owner email:', e.message);
  }
}

// ── Owner alert: new product review ──────────────────────────────────────────
export async function sendReviewAlertEmail({ review, productName }) {
  const stars = '&#9733;'.repeat(review.rating) + '&#9734;'.repeat(Math.max(0, 5 - review.rating));
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <h2 style="color:#B3184F;">New Product Review</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#888;width:140px;">Product</td><td style="font-weight:600;">${esc(productName || review.product_id)}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Reviewer</td><td>${esc(review.reviewer_name)}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Rating</td><td style="color:#f5a623;font-size:18px;">${stars}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Title</td><td>${esc(review.title)}</td></tr>
      </table>
      <p style="background:#fff5f8;border:1px solid #FFD1E3;border-radius:8px;padding:12px 16px;color:#444;white-space:pre-wrap;">${esc(review.review_text)}</p>
    </div>
  `;
  await sendMail({
    from: FROM,
    to: ownerEmail(),
    subject: `New ${review.rating}★ review on ${productName || review.product_id}`,
    html,
  });
}

// ── Owner alert: operational problem (e.g. paid but no order recorded) ───────
export async function sendOwnerAlertEmail(subject, bodyHtml) {
  await sendMail({
    from: FROM,
    to: ownerEmail(),
    subject,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;">${bodyHtml}</div>`,
  });
}

// ── Test-email HTML preview (GET /api/test-email) ────────────────────────────
export function testEmailPreviewHtml() {
  return `
      <div style="font-family:'Georgia',serif;max-width:600px;margin:auto;background:#fff;border:1px solid #FFD1E3;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#FF2D74,#B3184F);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:28px;letter-spacing:1px;">Order Confirmed!</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">Thank you, Test User!</p>
        </div>
        <div style="padding:28px 32px;">
          <p style="color:#B3184F;font-size:15px;margin-top:0;">Email template preview. Nothing was sent.</p>
          <p style="color:#888;font-size:13px;">Order #TEST-123 &middot; ${new Date().toLocaleString('en-IN')}</p>
        </div>
      </div>`;
}
