import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// โหลด Environment Variables จากไฟล์ .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env file.");
  process.exit(1);
}

// สร้าง Supabase Client ด้วยสิทธิ์ Admin (Service Role) เพื่อข้าม RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function runCleanup() {
  console.log("Starting final lead and identity cleanup process...");

  // ดึงข้อมูล Identities และลีดทั้งหมด
  const { data: identities, error: fetchErr } = await supabase
    .from("identities_v3")
    .select("id, social_links")
    .eq("role", "LEAD");

  if (fetchErr || !identities) {
    console.error("Failed to fetch identities:", fetchErr);
    return;
  }

  // ค้นหาลีดหลักที่เหลืออยู่ใน crm_leads_v3
  const { data: activeLeads, error: leadsFetchErr } = await supabase
    .from("crm_leads_v3")
    .select("id, identity_id");

  if (leadsFetchErr || !activeLeads) {
    console.error("Failed to fetch active leads:", leadsFetchErr);
    return;
  }

  const activeIdentityIds = new Set(activeLeads.map(l => l.identity_id).filter(Boolean));

  // แยกกลุ่ม Identity กำพร้า (Orphans) ที่ไม่มีลีดผูกอยู่
  const orphans = identities.filter(i => !activeIdentityIds.has(i.id));

  if (orphans.length === 0) {
    console.log("All clean! No orphaned identities found.");
    return;
  }

  console.log(`Found ${orphans.length} orphaned identities to resolve.`);

  // สร้างแผนผังจับคู่ Orphan ไปหา Identity ตัวจริง (โดยอาศัย Social Hashes ที่สอดคล้องกัน)
  const activeFacebookMap: Record<string, string> = {};
  const activeInstagramMap: Record<string, string> = {};

  // วนลูปสร้าง Map ของ Identities ที่ยังใช้งานอยู่
  identities.forEach(ident => {
    if (activeIdentityIds.has(ident.id)) {
      const links = (ident.social_links as Record<string, any>) || {};
      if (links.facebook_psid_hash) activeFacebookMap[links.facebook_psid_hash] = ident.id;
      if (links.instagram_sid_hash) activeInstagramMap[links.instagram_sid_hash] = ident.id;
    }
  });

  const orphanIdsToDelete: string[] = [];

  for (const orphan of orphans) {
    const links = (orphan.social_links as Record<string, any>) || {};
    const fbHash = links.facebook_psid_hash;
    const igHash = links.instagram_sid_hash;

    // หา Identity ตัวจริงที่ควรย้ายข้อความไปหา
    const targetPrimaryId = (fbHash && activeFacebookMap[fbHash]) || (igHash && activeInstagramMap[igHash]) || null;

    if (targetPrimaryId) {
      console.log(`Migrating orphaned messages from ${orphan.id} to primary ID ${targetPrimaryId}...`);
      // ย้ายแชทค้างคาของ Orphan ไปหาตัวจริง
      const { error: updateErr } = await supabase
        .from("communications_hub_v3")
        .update({ identity_id: targetPrimaryId })
        .eq("identity_id", orphan.id);

      if (updateErr) {
        console.error(`Error migrating messages for orphan ${orphan.id}:`, updateErr);
      }
    } else {
      console.log(`Orphan ${orphan.id} has no matching active profile. Clearing messages relations...`);
      // ถ้าไม่มีโปรไฟล์หลักเลย (เป็นขยะตกค้างจริงๆ) ให้ปลด link ในตารางแชททิ้งก่อนลบ
      const { error: clearErr } = await supabase
        .from("communications_hub_v3")
        .delete()
        .eq("identity_id", orphan.id);

      if (clearErr) {
        console.error(`Error clearing messages for orphan ${orphan.id}:`, clearErr);
      }
    }
    orphanIdsToDelete.push(orphan.id);
  }

  // ลบ Orphaned Identities ออกจากฐานข้อมูลทั้งหมด
  if (orphanIdsToDelete.length > 0) {
    console.log(`Deleting ${orphanIdsToDelete.length} orphaned identities...`);
    const { error: deleteErr } = await supabase
      .from("identities_v3")
      .delete()
      .in("id", orphanIdsToDelete);

    if (deleteErr) {
      console.error("Failed to delete orphaned identities:", deleteErr);
    } else {
      console.log("Successfully cleared all duplicate and orphaned identities without foreign key errors!");
    }
  }

  console.log("Database clean up fully completed!");
}

runCleanup().catch(err => {
  console.error("Fatal error during cleanup execution:", err);
});
