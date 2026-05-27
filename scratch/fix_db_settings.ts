import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const newDesc = "VC Connect Asset นายหน้าอสังหาริมทรัพย์มืออาชีพ บริการรับฝากขาย ฝากเช่า บ้าน คอนโด และที่ดิน ครบวงจร ดูแลและให้คำปรึกษาอย่างใกล้ชิดในทุกขั้นตอน เพื่อให้คุณได้ข้อเสนอที่ดีที่สุด";

  // 1. Update the description for the active tenant (7a22837c-2f21-4475-bc58-ce46476816d8)
  const { data: updateRes, error: updateErr } = await supabase
    .from("system_settings_v3")
    .update({ value: newDesc })
    .eq("tenant_id", "7a22837c-2f21-4475-bc58-ce46476816d8")
    .eq("key", "site_description");

  console.log("Updated tenant-specific site_description:", updateRes);
  if (updateErr) console.error("Update Error:", updateErr);

  // 2. Clean up duplicate null tenant rows for site_description
  // Keep only the most recent one or delete them all if we want to rely on the tenant-specific row
  const { data: deleteRes, error: deleteErr } = await supabase
    .from("system_settings_v3")
    .delete()
    .is("tenant_id", null)
    .eq("key", "site_description");

  console.log("Deleted null tenant site_description rows:", deleteRes);
  if (deleteErr) console.error("Delete Error:", deleteErr);

  // 3. Re-insert a single default null tenant row with the new description
  const { data: insertRes, error: insertErr } = await supabase
    .from("system_settings_v3")
    .insert({
      tenant_id: null,
      category: "general",
      key: "site_description",
      value: newDesc
    });

  console.log("Inserted clean default site_description:", insertRes);
  if (insertErr) console.error("Insert Error:", insertErr);
}

run();
