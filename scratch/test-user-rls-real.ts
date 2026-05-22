import { createAdminClient } from "../lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const adminClient = createAdminClient();
  const email = "vcconnect.asset@gmail.com";

  console.log(`1. Generating OTP magic link for ${email}...`);
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error || !data?.properties?.email_otp) {
    console.error("Failed to generate link / OTP:", error);
    return;
  }
  const otp = data.properties.email_otp;

  console.log("2. Signing in via OTP using user-scoped client...");
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
    console.error("Failed to verify OTP / sign in:", verifyErr);
    return;
  }

  console.log("3. Testing query to tenants_v3 with user-scoped client...");
  const { data: firstTenant, error: tenantErr } = await userClient
    .from("tenants_v3")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (tenantErr) {
    console.error("Querying tenants_v3 failed with error:", tenantErr);
  } else {
    console.log("Querying tenants_v3 succeeded! Result:", firstTenant);
  }
}

run().catch(console.error);
