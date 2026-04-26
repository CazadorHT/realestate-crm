
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { count, error } = await supabase
    .from('property_views_log')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error('Error fetching count:', error);
  } else {
    console.log('Total views in log:', count);
  }

  const { data: latest, error: latestError } = await supabase
    .from('property_views_log')
    .select('*, properties(title, property_type)')
    .limit(5)
    .order('created_at', { ascending: false });

  if (latestError) {
    console.error('Error fetching latest views:', latestError);
  } else {
    console.log('Latest 5 views:', JSON.stringify(latest, null, 2));
  }
}

checkData();
