"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendLineNotification } from "@/lib/line";
import { getTemplateConfig } from "@/features/line/utils";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  lineId: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().optional(),
});

export type ContactFormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  fields?: Record<string, string>;
};

export async function submitContactFormAction(
  prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const validatedFields = contactSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    lineId: formData.get("lineId"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "⚠️ กรุณากรอกหัวเรื่อง ชื่อ และเบอร์โทรศัพท์ให้ครบถ้วน",
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

  const { name, phone, email, lineId, subject, message } = validatedFields.data;

  try {
    const supabase = createAdminClient();

    // Insert into leads table
    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        full_name: name,
        phone: phone,
        email: email,
        source: "WEBSITE", // Generic website source
        stage: "NEW", // Initial stage
        note: `Contact Form Subject: ${subject || "N/A"}\nLine ID: ${lineId || "N/A"}\nMessage: ${message}`,
        lead_type: "INDIVIDUAL",
      })
      .select()
      .single();

    if (error) {
      console.error("Database Error:", error);
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

    // Get Template Config
    const templateConfig = await getTemplateConfig("CONTACT");

    // Clean data for URIs
    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    const cleanLineId = lineId?.replace(/^@/, "").trim();

    // Build Footer Rows (2 Columns)
    const footerRows: any[] = [];
    const topButtons: any[] = [];

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

    // LINE Button
    if (cleanLineId) {
      topButtons.push({
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📱 ทัก LINE",
            size: "sm",
            color: "#ffffff",
            align: "center",
            weight: "bold",
          },
        ],
        backgroundColor: "#00B900",
        cornerRadius: "lg",
        paddingAll: "lg",
        action: {
          type: "uri",
          label: "LINE",
          uri: `https://line.me/ti/p/~${cleanLineId}`,
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
    if (lead?.id) {
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
          uri: `https://oma-asset.com/protected/leads/${lead.id}`,
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
          backgroundColor: templateConfig.config.headerColor || "#7B1FA2",
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
                  text: "📱 Line ID",
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

    revalidatePath("/protected/leads");
    return {
      success: true,
      message: "ขอบคุณที่สนใจครับ เราจะติดต่อกลับโดยเร็วที่สุด",
    };
  } catch (error) {
    console.error("Server Error:", error);
    return {
      success: false,
      message: "ระบบเกิดข้อผิดพลาด กรุณาลองใหม่ภายหลัง",
    };
  }
}
