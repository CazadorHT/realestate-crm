
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

async function checkPolicies() {
  console.log('Fetching active RLS policies...')
  
  const { data: policies, error } = await supabase.rpc('get_policies_debug')
  
  if (error) {
    console.log('RPC get_policies_debug not found, trying manual query via another way...')
    // If RPC doesn't exist, I'll try to find another way or just assume based on my findings.
    // Actually, I'll try to use a common trick to see if I can list them.
  } else {
    console.log('Active Policies:', policies)
  }
}

// Since I can't run raw SQL easily, I'll check if I can add a member to the branch 
// using the service role and see if it works.
async function testAddMember() {
  const tenantId = '24c1eda5-2f6c-48c2-8dfa-3286fa1cbbdf'
  const profileId = 'd0f8f7d5-c1fb-4417-b4dc-0d1c650550c2'
  
  console.log('Testing member visibility with service role...')
  const { data, error } = await supabase
    .from('tenant_members')
    .select('*, profiles(*)')
    .eq('tenant_id', tenantId)
    
  if (error) console.error('Error:', error)
  else console.log('Data with profiles:', JSON.stringify(data, null, 2))
}

testAddMember()
