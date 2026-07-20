import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const supabase = createAdminClient();
  
  // Query communications hub including outgoing messages
  const { data: messages, error: msgError } = await supabase
    .from("communications_hub_v3")
    .select("created_at, platform, content, direction, external_message_id")
    .order("created_at", { ascending: false })
    .limit(10);
  
  if (msgError) {
    console.error("Error fetching messages:", msgError);
    return;
  }
  
  console.log("--- Latest Communications Hub Messages ---");
  console.log(JSON.stringify(messages, null, 2));
}

main().catch(console.error);
