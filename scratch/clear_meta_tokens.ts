import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const supabase = await createAdminClient();
  const keys = ["meta_page_access_token", "meta_user_access_token", "meta_page_id", "meta_page_name"];

  console.log("Deleting encrypted Meta tokens from system_settings_v3 to avoid decryption secret mismatch...");
  const { error } = await supabase
    .from("system_settings_v3")
    .delete()
    .in("key", keys);

  if (error) {
    console.error("Failed to delete keys:", error);
  } else {
    console.log("Successfully cleared encrypted Meta tokens from DB.");
  }
}

main().catch(console.error);
