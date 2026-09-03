import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { error } = await supabase.from('addresses').delete().eq('id', 'non-existent-id');
  console.log('Delete error:', error);
}

test();
