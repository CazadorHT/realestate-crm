import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log("Seeding transit types EXPRESSWAY and MAIN_ROAD into ref_master_data...");

  const items = [
    {
      type: "TRANSIT_TYPE",
      code: "EXPRESSWAY",
      label: { th: "จุดขึ้นลงทางด่วน", en: "Expressway Connection", cn: "高速公路", ru: "Шоссе" },
      is_active: true,
      sort_order: 100,
      metadata: { color: "#f97316" }
    },
    {
      type: "TRANSIT_TYPE",
      code: "MAIN_ROAD",
      label: { th: "ถนนหลัก", en: "Main Road", cn: "主干道", ru: "Главная дорога" },
      is_active: true,
      sort_order: 110,
      metadata: { color: "#8b5cf6" }
    }
  ];

  for (const item of items) {
    const { data, error } = await supabase
      .from("ref_master_data")
      .upsert(item, { onConflict: "type,code" });

    if (error) {
      console.error(`Error seeding ${item.code}:`, error);
    } else {
      console.log(`Successfully seeded: ${item.code}`);
    }
  }
}

seed();
