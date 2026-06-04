import { createAdminClient } from "../lib/supabase/admin";
import { encryptValue } from "../features/site-settings/actions";

const USER_TOKEN = "EAARjjRnZAnksBRkzlW8shBSPRrV7Qdc35889pJEKa40lUFIec7er2vi6Lu7tmZByUZBXIE2NTdULZARKQTazAV1u0OTh63BTJ6jN4NUQZCZBPj9sZBXRTkjeV05FrOBrtZCfZBZBzUKYsFzZBKoOnQWwSwA8AFPF8mGnwFvM7pldK9ZAELPzvK2xWOFsYazYQ8FzgzydW0VW4NrL9UfY";
const PAGE_TOKEN = "EAARjjRnZAnksBRuoy9xqVtU1ZA7S7htetNNIIPkAeeWyoEjSx5AyNATU4i1SZBbv4ouA1s7RfBAaMkI9rLw58quyqZBczB81Aq807dCPNnDAMHQlKUeBntclrtZAuv9jJPxRoKARwEokvGhG9vKdOzRZCdCjtWww6uP9rjHmkXz8maSzZBEgzZB1LPw8TIVrZBYBX21MCdQwERPLwB4CUl5sZD";
const PAGE_ID = "111608617234370";
const PAGE_NAME = "VC Connect Asset";

async function main() {
  console.log(`Setting Page: ${PAGE_NAME} (${PAGE_ID})`);
  console.log(`Page Token: ${PAGE_TOKEN.substring(0, 15)}...`);
  console.log(`User Token: ${USER_TOKEN.substring(0, 15)}...`);

  const supabase = await createAdminClient();

  const updates = [
    { key: "meta_page_access_token", value: PAGE_TOKEN },
    { key: "meta_page_id", value: PAGE_ID },
    { key: "meta_page_name", value: PAGE_NAME },
    { key: "meta_user_access_token", value: USER_TOKEN },
  ];

  for (const update of updates) {
    const encrypted = await encryptValue(update.key, update.value);
    const { error } = await supabase.from("system_settings_v3").upsert({
      tenant_id: null,
      category: "general",
      key: update.key,
      value: encrypted as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: "tenant_id,category,key" });

    if (error) {
      console.error(`Failed to update ${update.key}:`, error);
    } else {
      console.log(`Successfully updated ${update.key}`);
    }
  }

  console.log("Done!");
}

main().catch(console.error);
