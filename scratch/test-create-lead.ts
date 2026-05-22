import { createAdminClient } from "../lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const adminClient = createAdminClient();
  const email = "vcconnect.asset@gmail.com";

  console.log(`1. Generating OTP for ${email}...`);
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error || !data?.properties?.email_otp) {
    console.error("OTP generation failed:", error);
    return;
  }
  const otp = data.properties.email_otp;

  console.log("2. Authenticating user client...");
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data: verifyData, error: verifyErr } = await userClient.auth.verifyOtp({
    email,
    token: otp,
    type: "magiclink",
  });

  if (verifyErr || !verifyData.session) {
    console.error("Verification failed:", verifyErr);
    return;
  }
  const userId = verifyData.user!.id;

  console.log("3. Simulating tenant resolution logic inside createLeadAction...");
  // Simulate the context passed to the handler
  // Since active_tenant_id cookie is read by safe-action, it would pass tenantId context.
  // Let's assume tenantId passed from safe-action is null (which is what we got since lead's tenant_id is null).
  let tenantId: string | null = null;
  let targetTenantId: string | null = tenantId;

  console.log(`Initial tenantId: ${tenantId}`);
  if (!targetTenantId) {
    console.log("tenantId is falsy, attempting to resolve fallback...");
    
    // Check membership
    const { data: firstMember, error: memberErr } = await userClient
      .from("tenant_members_v3")
      .select("tenant_id")
      .eq("identity_id", userId)
      .limit(1)
      .maybeSingle();

    console.log("Querying tenant_members_v3...");
    if (memberErr) {
      console.error("- Error querying tenant_members_v3:", memberErr);
    } else {
      console.log("- firstMember:", firstMember);
    }

    if (firstMember?.tenant_id) {
      targetTenantId = firstMember.tenant_id;
    } else {
      console.log("No tenant membership found, checking default_tenant_id from config...");
      const { getSystemConfig } = await import("../lib/actions/system-config");
      const config = await getSystemConfig();
      console.log("- System config:", config);
      
      if (config.default_tenant_id) {
        targetTenantId = config.default_tenant_id;
      } else {
        console.log("No default_tenant_id, querying tenants_v3 for first tenant...");
        const { data: firstTenant, error: tenantErr } = await userClient
          .from("tenants_v3")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (tenantErr) {
          console.error("- Error querying tenants_v3:", tenantErr);
        } else {
          console.log("- firstTenant query returned:", firstTenant);
        }

        if (firstTenant?.id) {
          targetTenantId = firstTenant.id;
        }
      }
    }
  }

  console.log(`\nFinal resolved targetTenantId: ${targetTenantId}`);
}

run().catch(console.error);
