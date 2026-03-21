import { config } from "dotenv";
import { resolve } from "path";
import { createAdminClient } from "../lib/supabase/admin";

// Load environment variables
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  console.log("🚀 Setting up E2E test user...");
  
  const admin = createAdminClient();
  const email = "playwright-test@vcc-crm.com";
  const password = "Password123!";

  // 1. Check if user exists
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers();
  
  if (listError) {
    console.error("❌ Error listing users:", listError.message);
    process.exit(1);
  }

  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    console.log("✅ User already exists:", existingUser.id);
    
    // Ensure it's confirmed
    if (!existingUser.email_confirmed_at) {
        console.log("🔄 Confirming existing user...");
        await admin.auth.admin.updateUserById(existingUser.id, { email_confirm: true });
    }
    process.exit(0);
  }

  // 2. Create user
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Playwright Test User" }
  });

  if (error) {
    console.error("❌ Error creating user:", error.message);
    process.exit(1);
  } else {
    console.log("🎉 User created successfully:", data.user.id);
    process.exit(0);
  }
}

main().catch(err => {
    console.error("💥 Fatal error:", err);
    process.exit(1);
});
