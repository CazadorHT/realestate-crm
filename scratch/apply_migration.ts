import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20260422_proactive_ai_tracking.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Applying migration...');
  const { error } = await supabase.rpc('execute_sql_internal_unstable', { sql_query: sql });

  if (error) {
    console.error('Migration failed:', error);
    // If RPC doesn't exist, we might need another way or tell user to run in dashboard
    console.log('\n--- PLEASE RUN THIS SQL IN SUPABASE DASHBOARD ---');
    console.log(sql);
    console.log('-------------------------------------------------');
  } else {
    console.log('Migration applied successfully!');
  }
}

migrate();
