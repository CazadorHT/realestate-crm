import { inngest, leadCreatedEvent, authLoginEvent } from "./client";
import { createAdminClient } from "../supabase/admin";
import { sendAdminNotification } from "../telegram";

/**
 * 🤖 AI Smart Match Infrastructure
 */
export const onLeadCreated = inngest.createFunction(
  {
    id: "on-lead-created-match",
    name: "AI Lead-Property Matcher",
    triggers: [{ event: leadCreatedEvent }],
  },
  async ({ event, step }) => {
    const { leadId } = event.data;
    const supabase = createAdminClient();

    // 🕵️ Step 1: Fetch Lead requirements
    const lead = await step.run("fetch-lead-details", async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, full_name, email, phone, line_id, assigned_to, tenant_id")
        .eq("id", leadId)
        .single();

      if (error) throw error;
      return data;
    });

    // 🧠 Step 2: Generate Lead Embedding & Perform Vector Search
    const matches = await step.run("generate-lead-embedding-and-match", async () => {
      const { constructLeadRequirementText, generateEmbedding } = await import("@/lib/ai/gemini");
      
      // 1. Re-fetch full lead data to get preferences for embedding
      const { data: fullLead } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();
        
      if (!fullLead) return [];

      // 2. Generate text description of requirements (Decrypt sensitive fields first)
      const { decrypt } = await import("@/lib/crypto");
      const requirementsText = constructLeadRequirementText({
        budget_max: fullLead.budget_max,
        preferred_property_types: fullLead.preferred_property_types,
        preferred_locations: fullLead.preferred_locations,
        min_bedrooms: fullLead.min_bedrooms,
        note: fullLead.note ? decrypt(fullLead.note) : null
      });

      // 3. Generate Vector
      const embedding = await generateEmbedding(requirementsText);
      if (!embedding) return [];

      // 4. Save embedding to lead record for future use
      const vectorString = JSON.stringify(embedding);
      await supabase.from("leads").update({ embedding: vectorString }).eq("id", leadId);

      // 5. Find matches using RPC
      const { data: matchedProperties } = await supabase.rpc("match_properties", {
        query_embedding: vectorString,
        match_threshold: 0.75, // Only high confidence matches
        match_count: 5,
        p_tenant_id: lead.tenant_id ?? undefined
      });

      return matchedProperties || [];
    });

    // 📢 Step 3: Notify Agent with specific matches
    if (lead.assigned_to && matches.length > 0) {
      await step.run("notify-agent-with-matches", async () => {
        const { data: agent } = await supabase
          .from("profiles")
          .select("telegram_id, full_name")
          .eq("id", lead.assigned_to!)
          .single();

        if (agent?.telegram_id) {
          interface PropertyMatch {
            id: string;
            title: string;
            price: number | null;
            rental_price: number | null;
            similarity: number;
          }

          const matchList = (matches as PropertyMatch[])
            .map((m) => `• <b>${m.title}</b> (${Math.round(m.similarity * 100)}% match)\n  💰 ${m.price ? m.price.toLocaleString() : m.rental_price?.toLocaleString()} THB\n  🔗 <a href="${process.env.NEXT_PUBLIC_SITE_URL}/protected/properties/${m.id}">ดูรายละเอียด</a>`)
            .join("\n\n");

          await sendAdminNotification(
            `🎯 <b>AI Smart Match พบคู่แท้!</b>\n━━━━━━━━━━━━━━━━━━\n\nพบคู่ที่เหมาะสมที่สุด <b>${matches.length} รายการ</b> สำหรับลีด <b>${lead.full_name}</b>:\n\n${matchList}`,
            { chatId: agent.telegram_id },
          );
        }
      });
    }

    return { status: "matching_complete", leadId, matchCount: matches.length };
  },
);

/**
 * 🛡️ Security Watchdog: Login Notification (Hybrid Model)
 */
export const onUserLogin = inngest.createFunction(
  {
    id: "on-user-login-alert",
    name: "Security Login Watcher",
    triggers: [{ event: authLoginEvent }],
  },
  async ({ event, step }) => {
    const { userId, email, role, metadata } = event.data;
    const supabase = createAdminClient();

    // 🕵️ Step 1: Notify User (Private)
    await step.run("notify-user-private", async () => {
      let effectiveProfileId = userId;
      if (!effectiveProfileId && email) {
        const { data: p } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .single();
        if (p) effectiveProfileId = p.id;
      }

      if (!effectiveProfileId) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("telegram_id")
        .eq("id", effectiveProfileId)
        .single();

      if (profile?.telegram_id) {
        const time = new Date().toLocaleTimeString("th-TH");
        await sendAdminNotification(
          `🛡️ <b>แจ้งเตือนการเข้าสู่ระบบ</b>\n\nพบบัญชีของคุณเข้าใช้งานระบบ CRM เมื่อเวลา <code>${time}</code>\n\n<b>อุปกรณ์:</b> ${metadata?.userAgent || "Unknown"}\n<b>พิกัด:</b> ${metadata?.location || "Unknown"}\n\n<i>หากไม่ใช่คุณ กรุณาเปลี่ยนรหัสผ่านทันทีครับ</i>`,
          { chatId: profile.telegram_id },
        );
      }
    });

    return { status: "security_logged" };
  },
);
