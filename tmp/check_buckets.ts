import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
  console.log(`Checking buckets using storage API...`);

  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('Error fetching buckets:', error);
    return;
  }

  console.log('Buckets:', JSON.stringify(buckets, null, 2));
}

checkBuckets();
