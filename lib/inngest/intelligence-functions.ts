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
        .select("*")
        .eq("id", leadId)
        .single();

      if (error) throw error;
      return data;
    });

    // 🧠 Step 2: [Future] Perform Vector Search
    // For now, we set up the architecture to notify the agent that we are matching
    if (lead.assigned_to) {
      await step.run("notify-agent-matching-start", async () => {
        const { data: agent } = await supabase
          .from("profiles")
          .select("telegram_id, full_name")
          .eq("id", lead.assigned_to!)
          .single();

        if (agent?.telegram_id) {
          await sendAdminNotification(
            `🤖 <b>AI Smart Match กำลังทำงาน...</b>\n━━━━━━━━━━━━━━━━━━\n\nเรากำลังค้นหาทรัพย์ที่แมตช์กับลีดใหม่: <b>${lead.full_name}</b>\n\n<i>ระบบจะแจ้งเตือนคุณอีกครั้งหากเจอทรัพย์ที่คะแนนแมตช์ > 80%</i>`,
            { chatId: agent.telegram_id },
          );
        }
      });
    }

    return { status: "infrastructure_ready", leadId };
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
      const { data: profile } = await supabase
        .from("profiles")
        .select("telegram_id")
        .eq("id", userId)
        .single();

      if (profile?.telegram_id) {
        const time = new Date().toLocaleTimeString("th-TH");
        await sendAdminNotification(
          `🛡️ <b>แจ้งเตือนการเข้าสู่ระบบ</b>\n\nพบบัญชีของคุณเข้าใช้งานระบบ CRM เมื่อเวลา <code>${time}</code>\n\n<b>อุปกรณ์:</b> ${metadata?.userAgent || "Unknown"}\n<b>พิกัด:</b> ${metadata?.location || "Unknown"}\n\n<i>หากไม่ใช่คุณ กรุณาเปลี่ยนรหัสผ่านทันทีครับ</i>`,
          { chatId: profile.telegram_id },
        );
      }
    });

    // 🕵️ Step 2: Notify Admin Hub (Global Audit)
    await step.run("notify-admin-summary", async () => {
      const ip = metadata?.ip || "unknown";
      const userAgent = metadata?.userAgent || "unknown";

      const message = `
🔐 <b>Security Alert: User Login</b>
━━━━━━━━━━━━━━━━━━
<b>📧 User:</b> <code>${email}</code>
<b>👤 Role:</b> <code>${role}</code>
<b>🌐 IP:</b> <code>${ip}</code>
<b>📱 Device:</b> <code>${userAgent}</code>

<b>⏰ Time:</b> ${new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
━━━━━━━━━━━━━━━━━━
<i>VC Connect SRE Infrastructure</i>
      `.trim();

      await sendAdminNotification(message, { parseMode: "HTML" });
    });

    return { status: "security_logged" };
  },
);
