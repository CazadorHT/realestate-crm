import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("communications_hub_v3")
    .select("created_at, platform, content, payload")
    .eq("platform", "FACEBOOK")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching message:", error);
    return;
  }

  console.log("Latest Facebook Webhook Payload:");
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
