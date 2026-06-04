import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: row, error: fetchError } = await supabase
    .from("system_settings_v3")
    .select("*")
    .eq("key", "social_automation_keywords")
    .maybeSingle();

  if (fetchError || !row) {
    console.error("Error or no row:", fetchError);
    return;
  }

  const rawKeywords = row.value;
  if (!Array.isArray(rawKeywords)) {
    console.log("Value is not an array");
    return;
  }

  // Clean up any index keys like "0", "1" etc.
  const cleanedKeywords = rawKeywords.map((k: any) => {
    const cleaned: any = {};
    if (k.keyword !== undefined) cleaned.keyword = k.keyword;
    if (k.dm_content !== undefined) cleaned.dm_content = k.dm_content;
    if (k.public_reply !== undefined) cleaned.public_reply = k.public_reply;
    if (k.enabled !== undefined) cleaned.enabled = k.enabled;
    return cleaned;
  });

  console.log("Cleaned keywords:", JSON.stringify(cleanedKeywords, null, 2));

  const { error: updateError } = await supabase
    .from("system_settings_v3")
    .update({ value: cleanedKeywords })
    .eq("id", row.id);

  if (updateError) {
    console.error("Update error:", updateError);
  } else {
    console.log("Successfully cleaned up system_settings_v3 keywords data!");
  }
}

run();
