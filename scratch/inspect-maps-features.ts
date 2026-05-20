import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(url, key);

async function main(){
  const id = '1c477f40-d03d-41c4-818c-f276043f3b01';
  const { data, error } = await supabase
    .from('properties_core')
    .select('id, details:properties_details!property_id(address_info), property_features (features (id,name,icon_key,category))')
    .eq('id', id)
    .maybeSingle();

  console.log('error:', error);
  console.log('data:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
