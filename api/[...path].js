// Single Vercel Function that serves every /api/* route (replaces the Render Express server).
// Request/response shapes and paths are unchanged, so the frontend keeps calling /api/... as before.
import { getSupabase, send, sendHtml, readJson, requireAdmin, getUserFromRequest, safeEqual } from './_lib/core.js';
import * as admin from './_lib/admin.js';
import { createOrder, verifyPayment, razorpayWebhook } from './_lib/payment.js';
import { createShiprocketOrder, trackShipment } from './_lib/shiprocket.js';
import { sendOrderConfirmationEmail, sendTrackingUpdateEmail, sendReviewAlertEmail, testEmailPreviewHtml } from './_lib/email.js';

// Body parsing is done manually so webhooks can verify signatures over the raw bytes.
export const config = { api: { bodyParser: false }, maxDuration: 30 };

// ── Public / semi-public handlers ────────────────────────────────────────────

async function health(_req, res) {
  send(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
}

async function checkEmail(req, res) {
  try {
    const { email } = await readJson(req);
    if (!email) return send(res, 400, { error: 'Email is required' });
    const { data: profile } = await getSupabase().from('user_profiles').select('id').eq('email', email).limit(1);
    send(res, 200, { exists: !!(profile && profile.length) });
  } catch (err) {
    console.error('[Check Email] Error:', err);
    send(res, 500, { error: 'Failed to check email' });
  }
}

async function orderCount(_req, res, { query }) {
  try {
    const { email } = query;
    if (!email) return send(res, 200, { count: 0 });
    const supabase = getSupabase();
    const { data: profile } = await supabase.from('user_profiles').select('id').ilike('email', email).limit(1).maybeSingle();
    if (!profile) return send(res, 200, { count: 0 });
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .not('status', 'eq', 'cancelled');
    send(res, 200, { count: count || 0 });
  } catch (err) {
    console.error('[User Utils] order-count error:', err);
    send(res, 200, { count: 0 });
  }
}

// POST /api/shipping/create — now admin-only (was open to anyone on Render)
async function shippingCreate(req, res, _ctx, _admin) {
  try {
    const { orderId } = await readJson(req);
    const shiprocketOrderId = await createShiprocketOrder(orderId);
    send(res, 200, { success: true, shiprocketOrderId });
  } catch (err) {
    console.error('[Shiprocket] Error:', err.message);
    send(res, 500, { error: 'Shipping creation failed', detail: err.message });
  }
}

// GET /api/shipping/track/:orderId — now admin-only
async function shippingTrack(_req, res, { params }) {
  try {
    const tracking = await trackShipment(params.orderId);
    if (!tracking) return send(res, 404, { error: 'Shipment not found or not yet dispatched' });
    send(res, 200, { tracking });
  } catch (err) {
    console.error('[Shiprocket] Track error:', err);
    send(res, 500, { error: 'Tracking failed' });
  }
}

// POST /api/shiprocket/webhook — requires header  x-api-key: <SHIPROCKET_WEBHOOK_TOKEN>
async function shiprocketWebhook(req, res) {
  try {
    const token = process.env.SHIPROCKET_WEBHOOK_TOKEN;
    if (!token) {
      console.error('[Shiprocket Webhook] SHIPROCKET_WEBHOOK_TOKEN not configured');
      return send(res, 500, { error: 'Webhook not configured' });
    }
    if (!safeEqual(req.headers['x-api-key'], token)) {
      return send(res, 401, { error: 'Unauthorized' });
    }

    const payload = await readJson(req);
    console.log('[Shiprocket Webhook] status:', payload.current_status, 'order:', payload.order_id);
    if (!payload.current_status) return send(res, 400, { error: 'No status provided' });

    let query = getSupabase().from('orders').update({ tracking_status: payload.current_status });
    if (payload.channel_order_id) query = query.eq('id', payload.channel_order_id);
    else if (payload.order_id) query = query.eq('shiprocket_order_id', String(payload.order_id));
    else return send(res, 400, { error: 'No order identifier found in payload' });

    const { data: updatedOrder, error } = await query.select('id').single();
    if (error) {
      console.error('[Shiprocket Webhook] DB update failed:', error.message);
      return send(res, 500, { error: 'Failed to update status in DB' });
    }

    if (updatedOrder?.id) {
      try {
        await sendTrackingUpdateEmail({
          orderId: updatedOrder.id,
          currentStatus: payload.current_status,
          shiprocketOrderId: payload.order_id,
        });
      } catch (emailErr) {
        console.error('[Shiprocket Webhook] Failed to send update email:', emailErr);
      }
    }
    send(res, 200, { success: true, message: 'Status updated successfully' });
  } catch (err) {
    console.error('[Shiprocket Webhook] Error processing webhook:', err);
    send(res, 500, { error: 'Webhook processing failed' });
  }
}

// POST /api/email/order-confirmation — now admin-only
async function emailOrderConfirmation(req, res) {
  try {
    const { orderId, userEmail, userName, shiprocketOrderId } = await readJson(req);
    await sendOrderConfirmationEmail({ orderId, userEmail, userName, shiprocketOrderId });
    send(res, 200, { success: true });
  } catch (err) {
    console.error('[Email] Error:', err);
    send(res, 500, { error: 'Email sending failed' });
  }
}

// POST /api/reviews/notify  { reviewId } — owner alert for a freshly submitted review.
// Caller must be the review's author (Supabase JWT) and the review must be recent.
async function reviewNotify(req, res) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return send(res, 401, { error: 'Unauthorized' });
    const { reviewId } = await readJson(req);
    if (!reviewId) return send(res, 400, { error: 'reviewId is required' });

    const supabase = getSupabase();
    const { data: review } = await supabase.from('reviews').select('*').eq('id', reviewId).single();
    if (!review || review.user_id !== user.id) return send(res, 404, { error: 'Review not found' });
    if (Date.now() - new Date(review.created_at).getTime() > 10 * 60 * 1000) {
      return send(res, 400, { error: 'Review too old to notify' });
    }
    const { data: product } = await supabase.from('products').select('name').eq('id', review.product_id).maybeSingle();
    await sendReviewAlertEmail({ review, productName: product?.name });
    send(res, 200, { success: true });
  } catch (err) {
    console.error('[Review Notify] Error:', err);
    send(res, 500, { error: 'Failed to send review alert' });
  }
}

async function testEmail(_req, res) {
  sendHtml(res, 200, testEmailPreviewHtml());
}

// ── Route table ──────────────────────────────────────────────────────────────
// [method, path pattern, handler, needsAdmin]
const routes = [
  ['GET', '/api/health', health],
  ['POST', '/api/auth/check-email', checkEmail],
  ['GET', '/api/user/order-count', orderCount],
  ['POST', '/api/payment/create-order', createOrder],
  ['POST', '/api/payment/verify', verifyPayment],
  ['POST', '/api/payment/webhook', razorpayWebhook],
  ['POST', '/api/shipping/create', shippingCreate, true],
  ['GET', '/api/shipping/track/:orderId', shippingTrack, true],
  ['POST', '/api/shiprocket/webhook', shiprocketWebhook],
  ['POST', '/api/email/order-confirmation', emailOrderConfirmation, true],
  ['POST', '/api/reviews/notify', reviewNotify],
  ['GET', '/api/test-email', testEmail],

  ['GET', '/api/admin/products', admin.listProducts, true],
  ['POST', '/api/admin/products', admin.createProduct, true],
  ['POST', '/api/admin/products/upload-image', admin.uploadImage, true],
  ['POST', '/api/admin/products/upload-signature', admin.uploadSignature, true],
  ['PATCH', '/api/admin/products/:id', admin.updateProduct, true],
  ['DELETE', '/api/admin/products/:id', admin.deleteProduct, true],
  ['POST', '/api/admin/products/:id/generate-reviews', admin.generateReviews, true],
  ['GET', '/api/admin/users', admin.listUsers, true],
  ['GET', '/api/admin/users/:id', admin.userDetail, true],
  ['GET', '/api/admin/orders', admin.listOrders, true],
  ['GET', '/api/admin/orders/:id', admin.orderDetail, true],
  ['PATCH', '/api/admin/orders/:id/status', admin.updateOrderStatus, true],
].map(([method, pattern, handler, needsAdmin]) => ({
  method,
  handler,
  needsAdmin: !!needsAdmin,
  keys: [...pattern.matchAll(/:(\w+)/g)].map((m) => m[1]),
  regex: new RegExp('^' + pattern.replace(/:\w+/g, '([^/]+)') + '/?$'),
}));

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    const query = Object.fromEntries(url.searchParams);
    delete query.path; // injected by Vercel for catch-all routes

    let pathMatched = false;
    for (const r of routes) {
      const m = pathname.match(r.regex);
      if (!m) continue;
      pathMatched = true;
      if (r.method !== req.method) continue;

      const params = {};
      r.keys.forEach((k, i) => { params[k] = m[i + 1]; });
      const ctx = { query, params };

      let adminUser = null;
      if (r.needsAdmin) {
        adminUser = await requireAdmin(req, res);
        if (!adminUser) return; // response already sent
      }
      return await r.handler(req, res, ctx, adminUser);
    }

    if (pathMatched) return send(res, 405, { error: 'Method not allowed' });
    send(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error('[API] Unhandled error:', err);
    if (!res.headersSent) send(res, err.status || 500, { error: err.status ? err.message : 'Internal server error' });
  }
}
