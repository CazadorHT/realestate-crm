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
      .update({ role: "AGENT" as any })
      .eq("id", userId);

    if (updateError) throw updateError;

    // 📝 Log Audit
    await supabase.from("audit_logs").insert({
      action: "TELEGRAM_REPLY_APPROVE",
      entity: "user",
      entity_id: userId,
      metadata: {
        role: "AGENT",
        admin_telegram_user: message.from?.username || message.from?.id,
      },
    });

    // 💬 Reply back to Telegram to confirm
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const confirmationText = `✅ อนุมัติสำเร็จ!\n\n👤 <b>${profile.full_name || profile.email}</b>\n🎭 ปรับบทบาทเป็น: <b>AGENT</b>\n\n<i>ดำเนินการโดย: @${message.from?.username || message.from?.first_name}</i>`;
    
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
