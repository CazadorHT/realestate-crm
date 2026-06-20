 "use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { sendLineNotification } from "@/lib/line";
import { getTemplateConfig } from "@/features/line/utils";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  lineId: z.string().optional(),
  wechatId: z.string().optional(),
  whatsapp: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().optional(),
  // Attribution & AI Score
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  referral_url: z.string().optional(),
  ai_score: z.string().optional(),
  ai_status_label: z.string().optional(),
});

export type ContactFormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  fields?: Record<string, string>;
  data?: {
    id: string;
    aiScore: number;
    isHotLead: boolean;
    utmSource: string;
  };
};

import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

import { siteConfig } from "@/lib/site-config";
import { getSiteSettings } from "@/features/site-settings/actions";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";

export async function submitContactFormAction(
  prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const ip = (await headers()).get("x-forwarded-for") ?? "127.0.0.1";

  try {
    // 3 requests per minute per IP
    await limiter.check(3, ip);
  } catch {
    return {
      success: false,
      message: "⏳ คุณส่งข้อความเร็วเกินไป กรุณารอสักครู่",
    };
  }

  const rawPhone = formData.get("phone")?.toString() || "";
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const locale = formData.get("locale")?.toString() || "th";

  const getOptionalString = (val: any) => {
    if (val === null || val === undefined) return undefined;
    const str = val.toString().trim();
    return str === "" ? undefined : str;
  };

  const getRequiredString = (val: any) => {
    if (val === null || val === undefined) return "";
    return val.toString().trim();
  };

  const validatedFields = contactSchema.safeParse({
    name: getRequiredString(formData.get("name")),
    phone: cleanPhone,
    email: getOptionalString(formData.get("email")),
    lineId: getOptionalString(formData.get("lineId")),
    wechatId: getOptionalString(formData.get("wechatId")),
    whatsapp: getOptionalString(formData.get("whatsapp")),
    subject: getRequiredString(formData.get("subject")),
    message: getOptionalString(formData.get("message")),
    utm_source: getOptionalString(formData.get("utm_source")),
    utm_medium: getOptionalString(formData.get("utm_medium")),
    utm_campaign: getOptionalString(formData.get("utm_campaign")),
    utm_content: getOptionalString(formData.get("utm_content")),
    utm_term: getOptionalString(formData.get("utm_term")),
    referral_url: getOptionalString(formData.get("referral_url")),
    ai_score: getOptionalString(formData.get("ai_score")),
    ai_status_label: getOptionalString(formData.get("ai_status_label")),
  });

  if (!validatedFields.success) {
    const errorMessages: Record<string, string> = {
      th: "⚠️ กรุณากรอกหัวเรื่อง ชื่อ และเบอร์โทรศัพท์ให้ครบถ้วน",
      en: "⚠️ Please fill in the subject, name, and phone number correctly.",
      cn: "⚠️ 请正确填写主题、姓名和电话号码。",
      ru: "⚠️ Пожалуйста, заполните тему, имя и номер телефона правильно.",
    };
    return {
      success: false,
      message: errorMessages[locale] || errorMessages.th,
      errors: validatedFields.error.flatten().fieldErrors,
      fields: {
        name: (formData.get("name") as string) || "",
        phone: (formData.get("phone") as string) || "",
        email: (formData.get("email") as string) || "",
        lineId: (formData.get("lineId") as string) || "",
        subject: (formData.get("subject") as string) || "",
        message: (formData.get("message") as string) || "",
      },
    };
  }

  const { name, phone, email, lineId, wechatId, whatsapp, subject, message } = validatedFields.data;

  const { encrypt, generateBlindIndex } = await import("@/lib/crypto");
  const { createClient } = await import("@/lib/supabase/server");

  try {
    const supabase = await createClient();

    // 🛡️ [PHASE 1 & 4] Secure Lead Submission (Zero-Admin + Encryption)
    // We use the Security Definer RPC to handle the insert without adminClient
    const { data: leadId, error: rpcError } = await supabase.rpc(
      "submit_public_lead",
      {
        p_full_name: encrypt(name) || "Unknown",
        p_full_name_hash: generateBlindIndex(name),
        p_phone: encrypt(phone),
        p_phone_hash: generateBlindIndex(phone),
        p_email: encrypt(email),
        p_email_hash: generateBlindIndex(email),
        p_line_id: encrypt(lineId),
        p_line_id_hash: generateBlindIndex(lineId),
        p_wechat_id: wechatId,
        p_whatsapp: whatsapp,
        p_source: "WEBSITE",
        p_note: `Contact Form Subject: ${subject || "N/A"}\nMessage: ${message}`,
        p_utm_source: validatedFields.data.utm_source,
        p_utm_medium: validatedFields.data.utm_medium,
        p_utm_campaign: validatedFields.data.utm_campaign,
        p_utm_content: validatedFields.data.utm_content,
        p_utm_term: validatedFields.data.utm_term,
        p_referral_url: validatedFields.data.referral_url,
        p_ai_score: Math.min(
          validatedFields.data.ai_score ? parseInt(validatedFields.data.ai_score) : 0,
          100
        ),
        p_ai_status_label: validatedFields.data.ai_status_label,
      },
    );

    if (rpcError || !leadId) {
      console.error("RPC Submission Error:", rpcError);
      return {
        success: false,
        message: "ระบบเกิดข้อผิดพลาด กรุณาลองใหม่ภายหลัง",
        fields: {
          name,
          phone,
          email: email || "",
          lineId: lineId || "",
          subject: subject || "",
          message: message || "",
        },
      };
    }

    // 🤖 Trigger AI Smart Match Infrastructure
    const { inngest } = await import("@/lib/inngest/client");
    await inngest.send({
      name: "lead.created",
      data: { leadId: leadId } // tenant_id will be resolved in background if needed
    }).catch(e => console.warn("Inngest lead.created contact skip:", e.message));

    // Intelligence: Get Hot Lead Threshold
    const settings = await getSiteSettings();
    const threshold = settings.hot_lead_threshold || 80;
    const aiScoreInt = validatedFields.data.ai_score
      ? parseInt(validatedFields.data.ai_score)
      : 0;
    const isHotLead = aiScoreInt >= threshold;

    // Get Template Config
    const templateConfig = await getTemplateConfig("CONTACT");

    // Clean data for URIs
    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    const cleanLineId = lineId?.replace(/^@/, "").trim();

    // Build Footer Rows (2 Columns)
    const footerRows: Record<string, unknown>[] = [];
    const topButtons: Record<string, unknown>[] = [];

    // Call Button
    if (phone) {
      topButtons.push({
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📞 โทรออก",
            size: "sm",
            color: "#ffffff",
            align: "center",
            weight: "bold",
          },
        ],
        backgroundColor: "#1E88E5",
        cornerRadius: "lg",
        paddingAll: "lg",
        action: {
          type: "uri",
          label: "Call",
          uri: `tel:${cleanPhone}`,
        },
      });
    }

    // WhatsApp Button
    if (whatsapp) {
      topButtons.push({
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🟢 WhatsApp",
            size: "sm",
            color: "#ffffff",
            align: "center",
            weight: "bold",
          },
        ],
        backgroundColor: "#25D366",
        cornerRadius: "lg",
        paddingAll: "lg",
        action: {
          type: "uri",
          label: "WhatsApp",
          uri: `https://wa.me/${whatsapp.replace(/\D/g, "")}`,
        },
      });
    }

    if (topButtons.length > 0) {
      footerRows.push({
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: topButtons,
      });
    }

    // CRM Button
    if (leadId) {
      footerRows.push({
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📂 ดูใน CRM",
            size: "sm",
            color: "#ffffff",
            align: "center",
            weight: "bold",
          },
        ],
        backgroundColor: templateConfig.config.headerColor || "#7B1FA2",
        cornerRadius: "lg",
        paddingAll: "lg",
        margin: "sm",
        action: {
          type: "uri",
          label: "CRM",
          uri: `${siteConfig.url}/protected/leads/${leadId}`,
        },
      });
    }

    const headerIcon = "📧";

    // Send Line Notification (Flex Message)
    await sendLineNotification({
      type: "flex",
      altText: "📧 มีคนติดต่อผ่านเว็บไซต์ใหม่ครับ",
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: headerIcon,
              size: "xxl",
              flex: 1,
              align: "center",
              gravity: "center",
            },
            {
              type: "text",
              text:
                templateConfig.config.headerText ||
                "ติดต่อผ่านเว็บไซต์ (Contact)",
              weight: "bold",
              color: "#FFFFFF",
              size: "md",
              flex: 8,
              gravity: "center",
              wrap: true,
            },
          ],
          backgroundColor: isHotLead
            ? "#D32F2F"
            : templateConfig.config.headerColor || "#7B1FA2",
          paddingAll: "lg",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "👤 ชื่อ",
                  size: "sm",
                  color: "#555555",
                  flex: 3,
                },
                {
                  type: "text",
                  text: name,
                  size: "sm",
                  color: "#111111",
                  weight: "bold",
                  flex: 7,
                  wrap: true,
                },
              ],
              margin: "md",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "📞 เบอร์โทร",
                  size: "sm",
                  color: "#555555",
                  flex: 3,
                },
                {
                  type: "text",
                  text: phone,
                  size: "sm",
                  color: "#111111",
                  flex: 7,
                  action: {
                    type: "uri",
                    label: "Call",
                    uri: `tel:${cleanPhone}`,
                  },
                },
              ],
              margin: "md",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "📧 Email",
                  size: "sm",
                  color: "#555555",
                  flex: 3,
                },
                {
                  type: "text",
                  text: email || "-",
                  size: "sm",
                  color: "#111111",
                  flex: 7,
                  wrap: true,
                },
              ],
              margin: "md",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "💬 Line",
                  size: "sm",
                  color: "#555555",
                  flex: 3,
                },
                {
                  type: "text",
                  text: lineId || "-",
                  size: "sm",
                  color: "#111111",
                  flex: 7,
                },
              ],
              margin: "md",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "💬 WeChat",
                  size: "sm",
                  color: "#555555",
                  flex: 3,
                },
                {
                  type: "text",
                  text: wechatId || "-",
                  size: "sm",
                  color: "#111111",
                  flex: 7,
                },
              ],
              margin: "md",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "🟢 WhatsApp",
                  size: "sm",
                  color: "#555555",
                  flex: 3,
                },
                {
                  type: "text",
                  text: whatsapp || "-",
                  size: "sm",
                  color: "#111111",
                  flex: 7,
                },
              ],
              margin: "md",
            },
            {
              type: "separator",
              margin: "lg",
            },
            {
              type: "text",
              text: "📝 เรื่อง: " + (subject || "-"),
              size: "sm",
              weight: "bold",
              color: "#111111",
              margin: "lg",
            },
            {
              type: "text",
              text: message || "-",
              size: "sm",
              color: "#555555",
              wrap: true,
              margin: "sm",
            },
          ],
          paddingAll: "lg",
        },
        footer:
          footerRows.length > 0
            ? {
                type: "box",
                layout: "vertical",
                contents: footerRows,
                spacing: "sm",
                paddingAll: "lg",
              }
            : undefined,
      },
    });

    // 🛡️ Enterprise Telegram Notification (Admin Hub)
    try {
      const { sendAdminNotification } = await import("@/lib/telegram");
      const alertPrefix = isHotLead ? "🔥 <b>HOT LEAD ALERT</b> 🔥\n" : "📧 <b>แจ้งเตือนคนติดต่อใหม่</b>\n";
      const messageText = `
${alertPrefix}━━━━━━━━━━━━━━━━━━
<b>👤 ผู้ติดต่อ:</b> <code>${name}</code>
<b>📞 เบอร์โทร:</b> <code>${phone}</code>
<b>📧 อีเมล:</b> <code>${email || "-"}</code>
<b>📱 Line ID:</b> <code>${lineId || "-"}</code>
<b>📝 เรื่อง:</b> ${subject}
<b>🤖 AI Score:</b> <code>${aiScoreInt}/100</code>

<b>💬 ข้อความ:</b>
${message || "-"}
━━━━━━━━━━━━━━━━━━
<a href="${siteConfig.url}/protected/leads/${leadId}">📂 เปิดดูในระบบ CRM</a>
      `.trim();

      await sendAdminNotification(messageText);
    } catch (tgErr) {
      console.error("[CONTACT] Telegram Notification failed:", tgErr);
    }

    // 🔔 Create In-App Notifications for all Admins (Using secure RPC)
    try {
      const supabase = await createClient();
      
      // 🛡️ [TYPE-SAFE HARDENING] Use extended type to call RPC not in generated types without 'any'
      type ExtendedRpc = typeof supabase.rpc & ((name: "notify_admins_of_lead", args: { 
        p_name: string; 
        p_subject: string; 
        p_lead_id: string; 
        p_is_hot: boolean;
      }) => Promise<{ data: string | null; error: { message: string } | null }>);

      await (supabase.rpc as ExtendedRpc)("notify_admins_of_lead", {
        p_name: name,
        p_subject: subject,
        p_lead_id: leadId,
        p_is_hot: isHotLead,
      });
    } catch (notifErr) {
      console.error("[CONTACT] In-app Notification failed:", notifErr);
    }

    revalidatePath("/protected/leads");
    return {
      success: true,
      message: "ขอบคุณที่สนใจครับ เราจะติดต่อกลับโดยเร็วที่สุด",
      data: {
        id: leadId,
        aiScore: aiScoreInt,
        isHotLead: isHotLead,
        utmSource: validatedFields.data.utm_source || "Direct",
      },
    };
  } catch (error) {
    console.error("Server Error:", error);
    return {
      success: false,
      message: "ระบบเกิดข้อผิดพลาด กรุณาลองใหม่ภายหลัง",
    };
  }
}
