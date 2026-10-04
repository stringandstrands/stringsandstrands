// Shiprocket integration — ported 1:1 from the Express backend.
import { getSupabase } from './core.js';

export async function shiprocketLogin() {
  const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });
  const authData = await authRes.json();
  return { status: authRes.status, token: authData.token, raw: authData };
}

/** Returns the shiprocketOrderId string on success, throws on failure. */
export async function createShiprocketOrder(orderId) {
  const supabase = getSupabase();
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

  const auth = await shiprocketLogin();
  console.log('[Shiprocket] Auth status:', auth.status, '| has token:', !!auth.token);
  if (!auth.token) throw new Error(`Shiprocket auth failed: ${auth.raw.message || JSON.stringify(auth.raw)}`);

  const addr = order.addresses;
  const totalInRupees = Math.round(order.total_amount / 100);

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
      selling_price: Math.round(item.price_at_purchase / 100),
      weight: '0.5',
    })),
    payment_method: 'Prepaid',
    sub_total: totalInRupees,
    length: 10,
    breadth: 10,
    height: 5,
    weight: 0.5,
  };

  const srOrderRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify(payload),
  });
  const srOrder = await srOrderRes.json();
  console.log('[Shiprocket] Create order response status:', srOrderRes.status, '| order_id:', srOrder.order_id);

  if (!srOrder.order_id) {
    throw new Error(`Shiprocket order creation failed: ${srOrder.message || JSON.stringify(srOrder)}`);
  }

  await supabase
    .from('orders')
    .update({ shiprocket_order_id: String(srOrder.order_id), status: 'shipped' })
    .eq('id', orderId);

  return String(srOrder.order_id);
}

export async function trackShipment(orderId) {
  const { data: order } = await getSupabase()
    .from('orders')
    .select('shiprocket_order_id, awb_number')
    .eq('id', orderId)
    .single();

  if (!order?.shiprocket_order_id) return null;

  const { token } = await shiprocketLogin();
  const trackRes = await fetch(
    `https://apiv2.shiprocket.in/v1/external/courier/track/order/${order.shiprocket_order_id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return trackRes.json();
}
