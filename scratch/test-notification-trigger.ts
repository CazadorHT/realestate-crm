import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config({ path: resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Ensure .env has SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking profiles with role = 'ADMIN'...");
  const { data: admins, error } = await supabase
    .from("profiles")
    .select("id, email, role, line_user_id, line_id, telegram_id, full_name");

  if (error) {
    console.error("Error querying profiles:", error);
    return;
  }

  console.log("All Profiles:");
  console.log(JSON.stringify(admins, null, 2));

  // Try importing and executing notifyAdminsAction
  console.log("\nAttempting to import and run sendAdminNotification/sendLineNotification directly...");
  const { sendAdminNotification } = await import("../lib/telegram");
  const { sendLineNotification } = await import("../lib/line");

  console.log("Running sendAdminNotification...");
  await sendAdminNotification("🧪 Test Notification from Admin script");

  console.log("Running sendLineNotification...");
  await sendLineNotification("🧪 Test Line Notification from Admin script");
}

check();
