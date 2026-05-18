import { createAdminClient } from "../lib/supabase/admin";
import { encrypt, decrypt, generateBlindIndex, isEncrypted } from "../lib/crypto";

/**
 * 🛠️ Phase 4 Data Migration Script
 * Objective: Populate Blind Index (hash) columns for existing Leads, Owners, and Properties.
 * This restores searchability after PII encryption.
 */

async function migrate() {
  const supabase = createAdminClient();
  console.log("🚀 Starting Blind Index Migration...");

  // 1. Migrate LEADS
  console.log("\nMigrating LEADS...");
  const { data: leads } = await supabase.from("leads").select("id, full_name, phone, email, line_id");
  
  if (leads) {
    for (const lead of leads) {
      if (!lead.id) continue;
      const decryptedName = decrypt(lead.full_name);
      const decryptedPhone = decrypt(lead.phone);
      const decryptedEmail = decrypt(lead.email);
      const decryptedLineId = decrypt(lead.line_id);

      await supabase.from("leads").update({
        full_name_hash: generateBlindIndex(decryptedName),
        phone_hash: generateBlindIndex(decryptedPhone),
        email_hash: generateBlindIndex(decryptedEmail),
        line_id_hash: generateBlindIndex(decryptedLineId)
      }).eq("id", lead.id);
    }
    console.log(`✅ Migrated ${leads.length} leads.`);
  }

  // 2. Migrate OWNERS
  console.log("\nMigrating OWNERS...");
  const { data: owners } = await supabase.from("owners").select("id, full_name, phone");
  
  if (owners) {
    for (const owner of owners) {
      if (!owner.id) continue;
      const decryptedName = decrypt(owner.full_name);
      const decryptedPhone = decrypt(owner.phone);

      await supabase.from("owners").update({
        full_name_hash: generateBlindIndex(decryptedName),
        phone_hash: generateBlindIndex(decryptedPhone)
      }).eq("id", owner.id);
    }
    console.log(`✅ Migrated ${owners.length} owners.`);
  }

  // 3. Migrate PROPERTIES (Co-Agents)
  console.log("\nMigrating PROPERTIES (Co-Agents)...");
  const { data: properties } = await supabase.from("properties").select("id, co_agent_name, co_agent_phone");
  
  if (properties) {
    for (const p of properties) {
      if (!p.id) continue;
      const decryptedName = decrypt(p.co_agent_name);
      const decryptedPhone = decrypt(p.co_agent_phone);

      await supabase.from("properties").update({
        co_agent_name_hash: generateBlindIndex(decryptedName),
        co_agent_phone_hash: generateBlindIndex(decryptedPhone)
      }).eq("id", p.id);
    }
    console.log(`✅ Migrated ${properties.length} properties.`);
  }

  console.log("\n✨ Blind Index Migration Completed!");
}

migrate().catch(console.error);
