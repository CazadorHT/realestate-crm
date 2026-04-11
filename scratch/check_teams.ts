import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  console.log('--- Fetching all teams ---');
  const { data: teams, error } = await supabase.from('teams').select('*');
  console.log('Teams count:', teams?.length);
  // console.log('Teams data:', JSON.stringify(teams, null, 2));
  
  if (teams && teams.length > 0) {
      console.log('Sample Team:', JSON.stringify(teams[0], null, 2));
  }

  console.log('\n--- Fetching teams with relations ---');
  const { data: teamsWithRel, error: relError } = await supabase
    .from('teams')
    .select(`
      *,
      manager:profiles!teams_manager_id_fkey(full_name, avatar_url),
      members:profiles(id, full_name, avatar_url)
    `);
  
  if (relError) {
    console.error('Relation query error:', relError);
  } else {
    console.log('Teams with relations count:', teamsWithRel?.length);
    // console.log('Teams with relations data:', JSON.stringify(teamsWithRel, null, 2));
  }
}

check();
