import { createAdminClient } from "../lib/supabase/admin";
import { encryptValue } from "../features/site-settings/actions";

const USER_TOKEN = "EAARjjRnZAnksBRkzlW8shBSPRrV7Qdc35889pJEKa40lUFIec7er2vi6Lu7tmZByUZBXIE2NTdULZARKQTazAV1u0OTh63BTJ6jN4NUQZCZBPj9sZBXRTkjeV05FrOBrtZCfZBZBzUKYsFzZBKoOnQWwSwA8AFPF8mGnwFvM7pldK9ZAELPzvK2xWOFsYazYQ8FzgzydW0VW4NrL9UfY";

async function main() {
  console.log("Fetching accounts with User Token...");
  const url = `https://graph.facebook.com/v19.0/me/accounts?access_token=${USER_TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    console.error("Graph API Error:", data);
    return;
  }

  const pages = data.data || [];
  if (pages.length === 0) {
    console.error("No pages returned from Graph API for this token.");
    return;
  }

  const page = pages.find((p: any) => p.id === "111608617234370") || pages[0];
  const pageToken = page.access_token;
  const pageId = page.id;
  const pageName = page.name;

  console.log(`\nSelected Page: ${pageName} (${pageId})`);
  console.log(`Page Token: ${pageToken.substring(0, 15)}...`);

  const supabase = await createAdminClient();

  // Find existing settings row to check tenant_id
  const { data: existing } = await supabase
    .from("site_settings")
    .select("tenant_id, category")
    .eq("key", "meta_page_access_token")
    .limit(1)
    .maybeSingle();

  const tenantId = existing?.tenant_id || null;
  const category = existing?.category || "general";
  console.log(`Tenant ID: ${tenantId}`);

  const updates = [
    { key: "meta_page_access_token", value: pageToken },
    { key: "meta_page_id", value: pageId },
    { key: "meta_page_name", value: pageName },
    { key: "meta_user_access_token", value: USER_TOKEN },
  ];

  for (const update of updates) {
    const encrypted = await encryptValue(update.key, update.value);
    const { error } = await supabase.from("system_settings_v3").upsert({
      tenant_id: tenantId,
      category,
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

  console.log("Revalidating Next.js cache tags...");
  // Clear site settings cache
  // Since we are running outside next context, we log it.
  console.log("Done! Token has been manually updated.");
}

main().catch(console.error);
