import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBranches() {
  console.log('--- Fetching branches_v3 ---');
  const { data: branchesV3, error: errV3 } = await supabase.from('branches_v3').select('*');
  console.log('branches_v3 count:', branchesV3?.length, 'error:', errV3);
  if (branchesV3 && branchesV3.length > 0) {
    console.log('Sample branches_v3:', JSON.stringify(branchesV3, null, 2));
  }

  console.log('\n--- Fetching branches (legacy) ---');
  const { data: branchesLegacy, error: errLegacy } = await supabase.from('branches').select('*');
  console.log('branches count:', branchesLegacy?.length, 'error:', errLegacy);
  if (branchesLegacy && branchesLegacy.length > 0) {
    console.log('Sample branches:', JSON.stringify(branchesLegacy, null, 2));
  }
}

checkBranches();
