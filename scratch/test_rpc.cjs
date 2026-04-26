
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
  // Test with a real tenant ID from the logs we saw
  const tenantId = "24c1eda5-2f6c-48c2-8dfa-3286fa1cbbdf";
  
  console.log('Testing RPC with tenantId:', tenantId);
  const { data, error } = await supabase.rpc("get_analytics_summary_v3", {
    p_tenant_id: tenantId,
    p_days: 30,
    p_listing_type: null,
    p_property_type: null,
    p_area: null
  });

  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('RPC Result:', JSON.stringify(data, null, 2));
  }

  console.log('\nTesting RPC with NULL tenantId:');
  const { data: dataAll, error: errorAll } = await supabase.rpc("get_analytics_summary_v3", {
    p_tenant_id: null,
    p_days: 30,
    p_listing_type: null,
    p_property_type: null,
    p_area: null
  });

  if (errorAll) {
    console.error('RPC Error (ALL):', errorAll);
  } else {
    console.log('RPC Result (ALL) - property_type_distribution:', JSON.stringify(dataAll.property_type_distribution, null, 2));
  }
}

testRpc();
