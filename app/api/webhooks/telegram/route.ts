import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("[TELEGRAM_WEBHOOK] Payload:", JSON.stringify(payload));

    const message = payload.message;
    if (!message || !message.reply_to_message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const replyText = message.text.toLowerCase();
    const originalText = message.reply_to_message.text || message.reply_to_message.caption || "";
    
    console.log("[TELEGRAM_WEBHOOK] Reply Text:", replyText);
    console.log("[TELEGRAM_WEBHOOK] Original Text Found:", originalText);

    // Check if the reply is "agent" or "อนุมัติ"
    const isApproval = replyText.includes("agent") || replyText.includes("อนุมัติ");
    if (!isApproval) {
      console.log("[TELEGRAM_WEBHOOK] Not an approval command");
      return NextResponse.json({ ok: true });
    }

    // 🕵️ Extract UUID from the original message
    const uuidRegex = /ID:\s*([0-9a-fA-F-]{36})/;
    const match = originalText.match(uuidRegex);
    const userId = match ? match[1] : null;

    console.log("[TELEGRAM_WEBHOOK] Extracted userId:", userId);

    if (!userId) {
      console.warn("[TELEGRAM_WEBHOOK] No userId found in original message structure");
      return NextResponse.json({ ok: true });
    }

    // 🛡️ Security Check
    const adminGroupId = process.env.TELEGRAM_ADMIN_GROUP_ID;
    console.log("[TELEGRAM_WEBHOOK] Chat ID:", message.chat.id, "Expected Admin Group:", adminGroupId);

    if (adminGroupId && String(message.chat.id) !== String(adminGroupId)) {
      console.warn("[TELEGRAM_WEBHOOK] Unauthorized chat ID mismatch");
      return NextResponse.json({ ok: true });
    }

    // 🚀 Execute Approval
    const supabase = createAdminClient("public");
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (fetchError || !profile) {
      throw new Error("User profile not found");
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        role: "AGENT",
        is_active: true
      })
      .eq("id", userId);

    if (updateError) throw updateError;

    // 2. Update identities_v3 table (System Master Record)
    const { error: identityUpdateError } = await supabase
      .from("identities_v3")
      .update({
        role: "AGENT",
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (identityUpdateError) {
      console.error("[TELEGRAM_WEBHOOK] Failed to update identities_v3 role:", identityUpdateError);
    }

    // 3. Sync role: "AGENT" to auth.users metadata
    try {
      await supabase.auth.admin.updateUserById(userId, {
        app_metadata: {
          role: "AGENT"
        }
      });
      console.log(`✅ [Telegram Webhook] Auth metadata role: AGENT synced for user ${userId}`);
    } catch (syncErr) {
      console.error("❌ [Telegram Webhook] Auth metadata sync error:", syncErr);
    }
    
    // 🛡️ [AUTO-TENANT ASSIGNMENT]
    let autoBranchText = "";
    try {
      const { data: membership } = await supabase
        .from("tenant_members_v3")
        .select("id")
        .eq("identity_id", userId)
        .maybeSingle();

      if (!membership) {
        // Find default or first branch
        const { data: settings } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "system_config")
          .single();
        
        let targetTenantId = (settings?.value as any)?.default_tenant_id;

        if (!targetTenantId) {
          const { data: firstTenant } = await supabase
            .from("tenants_v3")
            .select("id, name")
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();
          if (firstTenant) targetTenantId = firstTenant.id;
        }

        if (targetTenantId) {
          // 🏢 ค้นหา default team/branch ของ tenant
          const { data: firstTeam } = await supabase
            .from("teams_v3")
            .select("id, name, branch_id")
            .eq("tenant_id", targetTenantId)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

          await supabase.from("tenant_members_v3").insert({
            tenant_id: targetTenantId,
            identity_id: userId,
            role: "AGENT",
            team_id: firstTeam?.id || null
          });
          
          const { data: tenant } = await supabase.from("tenants_v3").select("name").eq("id", targetTenantId).single();
          autoBranchText = `\n🏢 เข้าสาขาอัตโนมัติ: <b>${tenant?.name || "สาขาหลัก"}</b>`;
          console.log(`✅ [Telegram-Auto-Tenant] User ${userId} assigned to tenant ${targetTenantId} and team ${firstTeam?.id || "none"}`);
        }
      }
    } catch (atErr) {
      console.error("[TELEGRAM_WEBHOOK] Auto-Tenant Error:", atErr);
    }

    // 🔔 Send Push Notification inside the CRM to the agent
    try {
      await supabase.from("notifications_v3").insert({
        user_id: userId,
        type: "SYSTEM",
        title: "✅ บัญชีของคุณได้รับการอนุมัติแล้ว!",
        message: "ยินดีต้อนรับเข้าสู่ระบบ! บัญชีของคุณได้รับการปรับเป็น AGENT และพร้อมทำงานแล้วครับ 🚀",
        link: "/protected",
      });
      console.log(`✅ [Telegram Webhook] Push notification sent to user ${userId}`);
    } catch (notifErr) {
      console.error("❌ [Telegram Webhook] Failed to send push notification to agent:", notifErr);
    }

    // 📝 Log Audit
    await supabase.from("system_audit_logs_v3").insert({
      action: "TELEGRAM_REPLY_APPROVE",
      entity_table: "user",
      entity_id: userId,
      new_data: {
        role: "AGENT",
        admin_telegram_user: message.from?.username || message.from?.id,
        auto_branch: autoBranchText.includes("🏢")
      },
    });

    // 💬 Reply back to Telegram to confirm
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const confirmationText = `✅ อนุมัติสำเร็จ!\n\n👤 <b>${profile.full_name || profile.email}</b>\n🎭 ปรับบทบาทเป็น: <b>AGENT</b>${autoBranchText}\n\n<i>ดำเนินการโดย: @${message.from?.username || message.from?.first_name}</i>`;
    
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: message.chat.id,
        text: confirmationText,
        parse_mode: "HTML",
        reply_to_message_id: message.message_id,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[TELEGRAM_WEBHOOK_ERROR]", error);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
