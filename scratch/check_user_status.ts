import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const supabase = createAdminClient();
  const userId = "2504d7ce-1d15-4cc4-b079-db6378cb2f2d";

  console.log("Checking User:", userId);

  // 1. Check Auth User
  const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(userId);
  if (authErr) {
    console.error("Auth User Error:", authErr);
  } else {
    console.log("Auth User app_metadata:", authUser?.user?.app_metadata);
    console.log("Auth User user_metadata:", authUser?.user?.user_metadata);
  }

  // 2. Check identities_v3
  const { data: identity, error: identErr } = await supabase
    .from("identities_v3")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (identErr) {
    console.error("identities_v3 Error:", identErr);
  } else {
    console.log("identities_v3 record:", identity);
  }

  // 3. Check profiles
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (profErr) {
    console.error("profiles Error:", profErr);
  } else {
    console.log("profiles record:", profile);
  }

  // 4. Check tenant_members_v3
  const { data: members, error: memErr } = await supabase
    .from("tenant_members_v3")
    .select("*")
    .eq("identity_id", userId);
  if (memErr) {
    console.error("tenant_members_v3 Error:", memErr);
  } else {
    console.log("tenant_members_v3 records:", members);
  }
}

main().catch(console.error);
