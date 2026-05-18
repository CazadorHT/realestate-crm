const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qaihjhvdwfafawezxivb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhaWhqaHZkd2ZhZmF3ZXp4aXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU1NjQ5NywiZXhwIjoyMDk0MTMyNDk3fQ.8X9pzr_J5RElnUkQ3l6I8OaTZc4mSSxe53sMj1qme8I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser() {
  const email = 'rocktergamer@gmail.com';
  
  console.log(`Checking user: ${email}`);

  // 1. Check profiles
  const { data: profile, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (pError) {
    console.log('Profile Check Error:', pError.message);
  } else {
    console.log('Profile found:', JSON.stringify(profile, null, 2));
  }

  // 2. Check identities_v3
  const { data: identity, error: iError } = await supabase
    .from('identities_v3')
    .select('*')
    .eq('email', email)
    .single();

  if (iError) {
    console.log('Identity V3 Check Error:', iError.message);
  } else {
    console.log('Identity V3 found:', JSON.stringify(identity, null, 2));
  }
  
  // 3. Check auth users (if possible via admin API)
  const { data: authUsers, error: aError } = await supabase.auth.admin.listUsers();
  if (aError) {
     console.log('Auth Users List Error:', aError.message);
  } else {
     const target = authUsers.users.find(u => u.email === email);
     if (target) {
         console.log('Auth User found:', JSON.stringify({
             id: target.id,
             email: target.email,
             last_sign_in_at: target.last_sign_in_at,
             confirmed_at: target.confirmed_at
         }, null, 2));
     } else {
         console.log('Auth User NOT found for email:', email);
     }
  }
}

checkUser();
