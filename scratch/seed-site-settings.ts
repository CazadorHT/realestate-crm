import { createAdminClient } from "../lib/supabase/admin";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function run() {
  const supabase = createAdminClient();

  // Get tenant id
  const { data: tenantData, error: tenantErr } = await supabase
    .from("tenants_v3")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (tenantErr) {
    console.error("Error fetching tenant:", tenantErr);
    return;
  }

  const tenantId = tenantData?.id || null;
  console.log("Using Tenant ID:", tenantId);

  const defaultSettings = [
    { key: "site_name", value: "VC Connect Asset" },
    { key: "company_name", value: "VC Connect Asset Co., Ltd." },
    { key: "site_description", value: "ระบบจัดการอสังหาริมทรัพย์และพอร์ทัลประกาศขาย-เช่า" },
    { key: "contact_phone", value: "02-096-2588" },
    { key: "contact_email", value: "vcconnect.asset@gmail.com" },
    { key: "contact_address", value: "20th Floor, G Tower, Ratchadaphisek Road, Huai Khwang Subdistrict, Huai Khwang District, Bangkok 10310" },
    { key: "google_maps_url", value: "https://maps.app.goo.gl/xxxx" },
    { key: "facebook_url", value: "https://facebook.com/vcconnectasset" },
    { key: "instagram_url", value: "https://instagram.com/vcconnectasset" },
    { key: "line_url", value: "https://line.me/ti/p/@811slazm" },
    { key: "tiktok_url", value: "https://tiktok.com/@vcconnectasset" },
    { key: "line_id", value: "@vcconnectasset" },
    { key: "logo_light", value: "/images/branding/vcc-asset/logo-dark.svg" },
    { key: "logo_dark", value: "/images/branding/vcc-asset/logo-light.svg" },
    { key: "brand_card", value: "/images/branding/vcc-asset/favicon-animated-light.svg" },
    { key: "favicon", value: "/favicon.png" }
  ];

  console.log("Upserting default system settings...");

  const updates = defaultSettings.map((setting) => ({
    tenant_id: tenantId,
    category: "general",
    key: setting.key,
    value: setting.value,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from("system_settings_v3")
    .upsert(updates, { onConflict: "tenant_id,category,key" });

  if (error) {
    console.error("Error upserting settings:", error);
  } else {
    console.log("Upserted successfully!");
  }
}

run().catch(console.error);
