import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
  console.log("Adding province column to popular_areas table...");

  const { error: alterError } = await supabase.rpc("exec_sql", {
    sql: "ALTER TABLE popular_areas ADD COLUMN IF NOT EXISTS province TEXT DEFAULT 'กรุงเทพมหานคร';"
  });

  if (alterError) {
    if (alterError.message.includes("function exec_sql") || alterError.message.includes("could not find function")) {
      console.log("No exec_sql RPC found. Please run this manually in Supabase SQL Editor:");
      console.log("ALTER TABLE popular_areas ADD COLUMN IF NOT EXISTS province TEXT DEFAULT 'กรุงเทพมหานคร';");
    } else {
      console.error("Error adding column:", alterError);
    }
  } else {
    console.log("Province column added successfully (or already exists).");
  }

  // Seed some Phuket areas for testing
  const phuketAreas = [
    { name: "กะทู้", name_en: "Kathu", name_cn: "卡图", province: "Phuket" },
    { name: "ป่าตอง", name_en: "Patong", name_cn: "芭东", province: "Phuket" },
    { name: "ฉลอง", name_en: "Chalong", name_cn: "查龙", province: "Phuket" },
  ];

  for (const area of phuketAreas) {
    const { error: insertError } = await supabase.from("popular_areas").upsert(
      area,
      { onConflict: "name" }
    );
    if (insertError) {
      console.error(`Error seeding ${area.name}:`, insertError);
    } else {
      console.log(`Seeded/Updated ${area.name} in Phuket.`);
    }
  }

  // Ensure Bangkok areas are marked as Bangkok
  const bangkokAreas = ["ทองหล่อ", "สุขุมวิท", "บางนา", "เอกมัย", "อารีย์"];
  await supabase.from("popular_areas").update({ province: "Bangkok" }).in("name", bangkokAreas);

  console.log("Migration finished.");
}

migrate();
