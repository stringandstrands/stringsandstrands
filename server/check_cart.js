import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase
  .from('products')
  .update({ discounted_price: 1 })
  .eq('id', 'floral-bows-1788449803333')
  .select('id, name, discounted_price');

console.log(error || '✅ Set back to ₹1:', data);
