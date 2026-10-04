// Admin handlers (all require a Supabase admin JWT) — ported from the Express backend.
import { waitUntil } from '@vercel/functions';
import { getSupabase, getCloudinary, send, readJson, requireAdmin, logAdminAction } from './core.js';
import { generateFakeReviews } from './reviewGenerator.js';

const supabase = () => getSupabase();

export async function listProducts(req, res, { query }) {
  try {
    const { search, category, sortBy = 'created_at', sortDir = 'desc', page = 1, limit = 20 } = query;
    const offset = (Number(page) - 1) * Number(limit);
    let q = supabase()
      .from('products')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortDir === 'asc' })
      .range(offset, offset + Number(limit) - 1);
    if (search) q = q.ilike('name', `%${search}%`);
    if (category) q = q.eq('category', category);
    const { data, error, count } = await q;
    if (error) throw error;
    send(res, 200, { products: data, total: count });
  } catch (err) {
    console.error('[Admin] Products list error:', err);
    send(res, 500, { error: err.message });
  }
}

export async function createProduct(req, res, _ctx, admin) {
  try {
    const body = await readJson(req);
    const { variants, ...productData } = body;
    const product = productData;
    const baseId = product.id || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

    if (variants && variants.length > 0) {
      const inserts = variants.map((v) => ({
        ...productData,
        id: `${baseId}-${v.color.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: `${product.name} (${v.color})`,
        color: v.color,
        images: v.images,
      }));
      const { data, error } = await supabase().from('products').insert(inserts).select();
      if (error) throw error;
      await logAdminAction(admin.id, 'create_product', 'product', 'bulk', `Created ${variants.length} variants for: ${product.name}`);
      waitUntil(Promise.all(inserts.map((v) => generateFakeReviews(v.id, v.rating || 5.0, supabase()).catch(() => {}))));
      send(res, 200, { product: data[0] });
    } else {
      product.id = baseId;
      const { data, error } = await supabase().from('products').insert(product).select().single();
      if (error) throw error;
      await logAdminAction(admin.id, 'create_product', 'product', data.id, `Created: ${data.name}`);
      waitUntil(generateFakeReviews(data.id, data.rating || 5.0, supabase()).catch(() => {}));
      send(res, 200, { product: data });
    }
  } catch (err) {
    console.error('[Admin] Create product error:', err);
    send(res, 500, { error: err.message });
  }
}

export async function updateProduct(req, res, { params }, admin) {
  try {
    const { id } = params;
    const { variants, ...updates } = await readJson(req);
    const { data, error } = await supabase().from('products').update(updates).eq('id', id).select().single();
    if (error) throw error;
    await logAdminAction(admin.id, 'edit_product', 'product', id, `Updated: ${JSON.stringify(Object.keys(updates))}`);
    send(res, 200, { product: data });
  } catch (err) {
    console.error('[Admin] Update product error:', err);
    send(res, 500, { error: err.message });
  }
}

export async function generateReviews(req, res, { params }, admin) {
  try {
    const { id } = params;
    const { data: product, error: fetchError } = await supabase().from('products').select('rating').eq('id', id).single();
    if (fetchError || !product) throw new Error('Product not found');
    await generateFakeReviews(id, product.rating || 5.0, supabase());
    await logAdminAction(admin.id, 'generate_reviews', 'product', id, 'Generated reviews manually');
    send(res, 200, { success: true, message: 'Reviews generated successfully' });
  } catch (err) {
    console.error('[Admin] Manual generate reviews error:', err);
    send(res, 500, { error: err.message });
  }
}

export async function deleteProduct(req, res, { params }, admin) {
  try {
    const { id } = params;
    const { data: product } = await supabase().from('products').select('name, price').eq('id', id).single();
    if (product) {
      await supabase().from('order_items')
        .update({ product_name_snapshot: product.name, price_inr_snapshot: Math.round(product.price) })
        .eq('product_id', id)
        .is('product_name_snapshot', null);
    }
    const { error } = await supabase().from('products').delete().eq('id', id);
    if (error) throw error;
    await logAdminAction(admin.id, 'delete_product', 'product', id, `Deleted: ${product?.name}`);
    send(res, 200, { success: true });
  } catch (err) {
    console.error('[Admin] Delete product error:', err);
    send(res, 500, { error: err.message });
  }
}

// Legacy path: base64 through the function (limited to ~4.5MB by Vercel). Kept for compatibility.
export async function uploadImage(req, res) {
  try {
    const { base64, fileName, mimeType } = await readJson(req);
    if (!base64 || !fileName) return send(res, 400, { error: 'Missing file data' });
    const result = await getCloudinary().uploader.upload(`data:${mimeType || 'image/jpeg'};base64,${base64}`, {
      folder: 'product-images',
      public_id: `${Date.now()}-${fileName.replace(/\.[^/.]+$/, '')}`,
    });
    send(res, 200, { url: result.secure_url });
  } catch (err) {
    console.error('[Admin] Image upload error:', err);
    send(res, 500, { error: err.message });
  }
}

// POST /api/admin/products/upload-signature — lets the browser upload straight to Cloudinary
// (bypasses Vercel's 4.5MB body limit). The API secret never leaves the server.
export async function uploadSignature(req, res) {
  try {
    const { fileName } = await readJson(req);
    const cld = getCloudinary();
    const timestamp = Math.round(Date.now() / 1000);
    const params = {
      folder: 'product-images',
      public_id: `${Date.now()}-${String(fileName || 'image').replace(/\.[^/.]+$/, '')}`,
      timestamp,
    };
    const signature = cld.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
    send(res, 200, {
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder: params.folder,
      publicId: params.public_id,
    });
  } catch (err) {
    console.error('[Admin] Upload signature error:', err);
    send(res, 500, { error: err.message });
  }
}

export async function listUsers(req, res, { query }) {
  try {
    const { search, page = 1, limit = 30 } = query;
    const offset = (Number(page) - 1) * Number(limit);
    let q = supabase()
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);
    if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data: profiles, error, count } = await q;
    if (error) throw error;

    const userIds = profiles.map((p) => p.id);
    const { data: orderStats } = await supabase()
      .from('orders')
      .select('user_id, total_amount, status')
      .in('user_id', userIds)
      .in('status', ['paid', 'shipped', 'delivered']);

    const statsMap = {};
    for (const o of orderStats || []) {
      if (!statsMap[o.user_id]) statsMap[o.user_id] = { count: 0, total: 0 };
      statsMap[o.user_id].count++;
      statsMap[o.user_id].total += o.total_amount;
    }
    const users = profiles.map((p) => ({
      ...p,
      order_count: statsMap[p.id]?.count || 0,
      total_spent_paise: statsMap[p.id]?.total || 0,
    }));
    send(res, 200, { users, total: count });
  } catch (err) {
    console.error('[Admin] Users list error:', err);
    send(res, 500, { error: err.message });
  }
}

export async function userDetail(req, res, { params }) {
  try {
    const { id } = params;
    const [{ data: profile }, { data: addresses }, { data: orders }, { data: wishlist }] = await Promise.all([
      supabase().from('user_profiles').select('*').eq('id', id).single(),
      supabase().from('addresses').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase().from('orders').select('id, status, total_amount, created_at, razorpay_payment_id, tracking_status').eq('user_id', id).order('created_at', { ascending: false }),
      supabase().from('wishlist_items').select('product_id, products(name, images, price)').eq('user_id', id),
    ]);
    send(res, 200, { profile, addresses, orders, wishlist });
  } catch (err) {
    console.error('[Admin] User detail error:', err);
    send(res, 500, { error: err.message });
  }
}

export async function listOrders(req, res, { query }) {
  try {
    const { status, dateFrom, dateTo, page = 1, limit = 30 } = query;
    const offset = (Number(page) - 1) * Number(limit);
    let q = supabase()
      .from('orders')
      .select(
        'id, status, total_amount, created_at, razorpay_payment_id, razorpay_order_id, tracking_status, shiprocket_order_id, user_id, order_items(id)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);
    if (status) q = q.eq('status', status);
    if (dateFrom) q = q.gte('created_at', dateFrom);
    if (dateTo) q = q.lte('created_at', dateTo + 'T23:59:59Z');

    const { data, error, count } = await q;
    if (error) throw error;

    const userIds = [...new Set((data || []).map((o) => o.user_id).filter(Boolean))];
    const profileMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase().from('user_profiles').select('id, name, email').in('id', userIds);
      for (const p of profiles || []) profileMap[p.id] = p;
    }
    const orders = (data || []).map((o) => ({
      ...o,
      item_count: o.order_items?.length || 0,
      customer_name: profileMap[o.user_id]?.name || profileMap[o.user_id]?.email || 'Guest',
      customer_email: profileMap[o.user_id]?.email || '',
    }));
    send(res, 200, { orders, total: count });
  } catch (err) {
    console.error('[Admin] Orders list error:', err);
    send(res, 500, { error: err.message });
  }
}

export async function orderDetail(req, res, { params }) {
  try {
    const { id } = params;
    const { data, error } = await supabase()
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

    let userProfile = null;
    if (data?.user_id) {
      const { data: profile } = await supabase().from('user_profiles').select('name, email, phone').eq('id', data.user_id).single();
      userProfile = profile;
    }
    send(res, 200, { order: { ...data, user_profiles: userProfile } });
  } catch (err) {
    console.error('[Admin] Order detail error:', err);
    send(res, 500, { error: err.message });
  }
}

export async function updateOrderStatus(req, res, { params }, admin) {
  try {
    const { id } = params;
    const { status } = await readJson(req);
    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) return send(res, 400, { error: 'Invalid status value' });
    const { data, error } = await supabase().from('orders').update({ status }).eq('id', id).select().single();
    if (error) throw error;
    await logAdminAction(admin.id, 'update_order_status', 'order', id, `Status → ${status}`);
    send(res, 200, { order: data });
  } catch (err) {
    console.error('[Admin] Update order status error:', err);
    send(res, 500, { error: err.message });
  }
}

export { requireAdmin };
