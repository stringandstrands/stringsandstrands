// Shared clients + HTTP helpers for the Vercel Function backend.
// Secrets are read ONLY from process.env (server-side). Nothing here is bundled to the client.
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import { v2 as cloudinary } from 'cloudinary';

let _supabase, _razorpay;

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return _supabase;
}

export function getRazorpay() {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
}

export function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────

/** Read the raw request body as a Buffer (bodyParser is disabled so webhooks can verify signatures). */
export async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

/** Parse JSON body, caching the raw buffer on req.rawBody. Returns {} for empty bodies. */
export async function readJson(req) {
  const raw = await readRawBody(req);
  req.rawBody = raw;
  if (!raw.length) return {};
  try {
    return JSON.parse(raw.toString('utf8'));
  } catch {
    const err = new Error('Invalid JSON body');
    err.status = 400;
    throw err;
  }
}

export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export function sendHtml(res, status, html) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
}

/** Constant-time string comparison. */
export function safeEqual(a, b) {
  const ba = Buffer.from(String(a ?? ''));
  const bb = Buffer.from(String(b ?? ''));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// ── Auth ─────────────────────────────────────────────────────────────────────

/** Returns the Supabase user for the Bearer token, or null. */
export async function getUserFromRequest(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const { data: { user }, error } = await getSupabase().auth.getUser(token);
  if (error || !user) return null;
  return user;
}

/**
 * Same checks and error responses as the old Express requireAdmin middleware.
 * Returns the admin user, or null after sending the error response.
 */
export async function requireAdmin(req, res) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      send(res, 401, { error: 'Missing authorization header' });
      return null;
    }
    const token = authHeader.slice(7);
    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      send(res, 401, { error: 'Invalid or expired token' });
      return null;
    }
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    if (!profile?.is_admin) {
      send(res, 403, { error: 'Access denied — not an admin' });
      return null;
    }
    return user;
  } catch (err) {
    console.error('[Admin Auth]', err);
    send(res, 500, { error: 'Auth check failed' });
    return null;
  }
}

export async function logAdminAction(adminId, action, targetType, targetId, notes = '') {
  try {
    await getSupabase().from('admin_activity_log').insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: String(targetId),
      notes,
    });
  } catch (e) { /* non-fatal */ }
}
