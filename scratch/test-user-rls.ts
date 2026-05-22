import { createAdminClient } from "../lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const adminClient = createAdminClient();
  const email = `temp_admin_${Date.now()}@domain.com`;
  const password = "TempPassword123!";
  const leadId = "95a9681b-0f77-4abb-bbcd-555afdcdf5d6";

  console.log(`1. Creating temporary auth user: ${email}...`);
  const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authErr || !authData.user) {
    console.error("Failed to create temporary user:", authErr);
    return;
  }
  const userId = authData.user.id;
  console.log(`Temporary user created with ID: ${userId}`);

  try {
    console.log("2. Inserting profile record with role ADMIN...");
    const { error: profileErr } = await adminClient
      .from("profiles")
      .insert({
        id: userId,
        full_name: "Temp Admin",
        email,
        role: "ADMIN",
        is_active: true,
      });

    if (profileErr) {
      console.error("Failed to insert profile:", profileErr);
      return;
    }
    console.log("Profile created successfully!");

    console.log("3. Signing in with the temporary user...");
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    const { data: signInData, error: signInErr } = await userClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInErr || !signInData.session) {
      console.error("Sign in failed:", signInErr);
      return;
    }
    console.log("Sign in successful!");

    console.log("4. Executing the query using user-scoped client...");
    const { data: leadData, error: queryErr } = await userClient
      .from("crm_leads_v3")
      .select("id, stage, source, budget_min, budget_max, preferred_locations, ai_summary, created_at, updated_at, tenant_id, assigned_to, identity:identities_v3!crm_leads_v3_identity_id_fkey!inner(display_name, email, phone, line_id, social_links)")
      .eq("id", leadId)
      .single();

    if (queryErr) {
      console.error("Query failed for user client:", queryErr);
    } else {
      console.log("Query succeeded! Result:", JSON.stringify(leadData, null, 2));
    }
    
    // Also test querying without the inner join
    console.log("5. Querying crm_leads_v3 without join...");
    const { data: leadNoJoin, error: queryNoJoinErr } = await userClient
      .from("crm_leads_v3")
      .select("*")
      .eq("id", leadId)
      .single();

    if (queryNoJoinErr) {
      console.error("Query without join failed:", queryNoJoinErr);
    } else {
      console.log("Query without join succeeded:", JSON.stringify(leadNoJoin, null, 2));
    }

    if (leadNoJoin?.identity_id) {
      const identityId = leadNoJoin.identity_id;
      console.log(`6. Querying identities_v3 directly for id ${identityId}...`);
      const { data: identData, error: identErr } = await userClient
        .from("identities_v3")
        .select("*")
        .eq("id", identityId)
        .single();
      if (identErr) {
        console.error("Querying identities_v3 directly failed:", identErr);
      } else {
        console.log("Querying identities_v3 directly succeeded:", JSON.stringify(identData, null, 2));
      }
    }

  } finally {
    console.log("Cleaning up temporary user and profile...");
    await adminClient.from("profiles").delete().eq("id", userId);
    await adminClient.auth.admin.deleteUser(userId);
    console.log("Cleanup complete!");
  }
}

run().catch(console.error);
