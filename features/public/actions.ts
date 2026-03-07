"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DepositLeadInput, LeadState } from "./types";
import { depositLeadSchema, inquiryLeadSchema } from "./schema";
import { sendLineNotification } from "@/lib/line";
import { getTemplateConfig } from "@/features/line/utils";
import { siteConfig } from "@/lib/site-config";
import {
  getPublicImageUrl,
  getCoverImageUrl,
} from "@/features/properties/image-utils";

export async function createDepositLeadAction(data: DepositLeadInput) {
  // Server-side validation
  const parsed = depositLeadSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: "ข้อมูลไม่ถูกต้อง" };
  }

  const supabase = createAdminClient();

  // Clean data for URIs
  const cleanPhone = data.phone.replace(/[^0-9+]/g, "");
  const cleanLineId = data.lineId?.replace(/^@/, "").trim();

  // Create Lead
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      full_name: data.fullName,
      phone: data.phone,
      lead_type: "INDIVIDUAL",
      source: "WEBSITE",
      stage: "NEW",
      note: `[ฝากทรัพย์] Line: ${data.lineId || "-"}
Type: ${data.propertyType}
Details: ${data.details || "-"}`,
    })
    .select()
    .single();

  if (leadError) {
    console.error("Deposited Lead Error:", leadError);
    return { success: false, message: "เกิดข้อผิดพลาด กรุณาลองใหม่" };
  }

  // Create Initial Activity
  await supabase.from("lead_activities").insert({
    lead_id: lead.id,
    activity_type: "SYSTEM",
    note: "ลูกค้าแจ้งฝากทรัพย์ผ่านหน้าเว็บไซต์",
  });

  const PROPERTY_TYPE_MAP: Record<string, string> = {
    CONDO: "คอนโด",
    HOUSE: "บ้านเดี่ยว",
    TOWNHOME: "ทาวน์โฮม",
    LAND: "ที่ดิน",
    COMMERCIAL: "อาคารพาณิชย์",
    APARTMENT: "อพาร์ทเมนท์",
    HOTEL: "โรงแรม",
    OFFICE: "สำนักงาน/ออฟฟิศ",
    WAREHOUSE: "โกดัง",
    FACTORY: "โรงงาน",
  };

  const propertyTypeTh =
    PROPERTY_TYPE_MAP[data.propertyType] || data.propertyType;

  // Notify Admin (Flex Message)
  const templateConfig = await getTemplateConfig("DEPOSIT");
  const headerIcon = "🏠 ";

  // Build Footer Rows (2 Columns)
  const footerRows: any[] = [];
  const topButtons: any[] = [];

  if (data.phone) {
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
      action: { type: "uri", label: "Call", uri: `tel:${cleanPhone}` },
    });
  }

  if (data.lineId) {
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

  if (lead?.id) {
    footerRows.push({
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "📂 ดูในระบบ",
          size: "sm",
          color: "#ffffff",
          align: "center",
          weight: "bold",
        },
      ],
      backgroundColor: templateConfig.config.headerColor || "#0D47A1",
      cornerRadius: "lg",
      paddingAll: "lg",
      margin: "sm",
      action: {
        type: "uri",
        label: "CRM",
        uri: `${siteConfig.url}/protected/leads/${lead.id}`,
      },
    });
  }
  await sendLineNotification({
    type: "flex",
    altText: "🏠 มีคนฝากทรัพย์ใหม่ระครับ!",
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
            text: templateConfig.config.headerText || "ฝากทรัพย์ใหม่ (Deposit)",
            weight: "bold",
            color: "#FFFFFF",
            size: "md",
            flex: 8,
            gravity: "center",
            wrap: true,
          },
        ],
        backgroundColor: templateConfig.config.headerColor || "#0D47A1", // Dark Blue
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
                text: "🏠 ประเภท",
                size: "sm",
                color: "#555555",
                flex: 4,
              },
              {
                type: "text",
                text: propertyTypeTh,
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
                text: "👤 ชื่อผู้ติดต่อ",
                size: "sm",
                color: "#555555",
                flex: 4,
              },
              {
                type: "text",
                text: data.fullName,
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
                text: "📞 เบอร์โทร",
                size: "sm",
                color: "#555555",
                flex: 4,
              },
              {
                type: "text",
                text: data.phone,
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
                text: "📱 Line ID",
                size: "sm",
                color: "#555555",
                flex: 4,
              },
              {
                type: "text",
                text: data.lineId || "-",
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
            text: "📝 รายละเอียด:",
            size: "sm",
            color: "#555555",
            margin: "lg",
          },
          {
            type: "text",
            text: data.details || "-",
            size: "sm",
            color: "#111111",
            wrap: true,
            margin: "sm",
          },
        ],
      },
      footer:
        footerRows.length > 0
          ? {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              contents: footerRows,
              paddingAll: "lg",
            }
          : undefined,
    },
  });

  return { success: true, leadId: lead.id };
}

export async function submitInquiryAction(
  prevState: LeadState,
  formData: FormData,
): Promise<LeadState> {
  const supabase = createAdminClient();

  const validatedFields = inquiryLeadSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    lineId: formData.get("lineId"),
    message: formData.get("message"),
    propertyId: formData.get("propertyId"),
    source: "WEBSITE",
    marketing_attribution: formData.get("marketing_attribution")?.toString(),
    ai_lead_score: formData.get("ai_lead_score")
      ? Number(formData.get("ai_lead_score"))
      : undefined,
  });

  if (!validatedFields.success) {
    return {
      error: "ข้อมูลไม่ถูกต้อง",
      errors: validatedFields.error.flatten().fieldErrors as any,
    };
  }

  const { data } = validatedFields;

  // Clean data for URIs
  const cleanPhone = data.phone.replace(/[^0-9+]/g, "");
  const cleanLineId = data.lineId?.replace(/^@/, "").trim();

  try {
    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        full_name: data.fullName,
        phone: data.phone,
        line_id: data.lineId || null,
        note: data.message || null,
        property_id: data.propertyId || null,
        source: "WEBSITE",
        stage: "NEW",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error);
      return { error: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง" };
    }

    // Verify Property Data
    let propertyData = null;
    let coverImage = null;

    if (data.propertyId) {
      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select(
          `title, rental_price, bedrooms, bathrooms, size_sqm, district, province, listing_type, price, original_price, original_rental_price,
            property_images (
              image_url,
              is_cover,
              sort_order
            )`,
        )
        .eq("id", data.propertyId)
        .single();

      if (property && !propertyError) {
        propertyData = property;
        // Use the helper to extract the cover image from the relation data
        if (
          property.property_images &&
          Array.isArray(property.property_images)
        ) {
          // Map to match the interface expected by getCoverImageUrl
          const formattedImages = property.property_images.map((img: any) => ({
            image_url: img.image_url,
            is_cover: img.is_cover || false,
            sort_order: img.sort_order || 0,
          }));
          const coverUrl = getCoverImageUrl(formattedImages);
          if (coverUrl) {
            coverImage = coverUrl;
          }
        }
      }
    }

    const templateConfig = await getTemplateConfig("INQUIRY");

    // Prepare Image URL
    let imageUrl = null;
    if (coverImage) {
      if (coverImage.startsWith("http")) {
        imageUrl = coverImage;
      } else {
        imageUrl = getPublicImageUrl(coverImage);
      }
    }

    // Prepare Price Display
    let priceDisplay = "ติดต่อสอบถาม";
    if (propertyData) {
      if (propertyData.listing_type === "RENT" && propertyData.rental_price) {
        priceDisplay = `฿${propertyData.rental_price.toLocaleString()}/ด.`;
      } else if (propertyData.price) {
        priceDisplay = `฿${propertyData.price.toLocaleString()}`;
      } else if (propertyData.rental_price) {
        priceDisplay = `฿${propertyData.rental_price.toLocaleString()}/ด.`;
      }
    }

    // Construct Flex Message
    const headerIcon = "💬"; // Icon for Inquiry
    const flexContents: any = {
      type: "bubble",
      header: {
        type: "box",
        layout: "horizontal", // Change to horizontal to put icon next to text
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
            text: templateConfig.config.headerText || "สนใจทรัพย์ / สอบถาม",
            weight: "bold",
            color: "#FFFFFF",
            size: "md",
            flex: 8,
            gravity: "center",
            wrap: true,
          },
        ],
        backgroundColor: templateConfig.config.headerColor || "#2E7D32",
        paddingAll: "lg",
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "none",
        contents: [],
      },
    };

    // Add Image if available
    if (imageUrl) {
      flexContents.body.contents.push({
        type: "image",
        url: imageUrl,
        size: "full",
        aspectRatio: "4:3",
        aspectMode: "cover",
        gravity: "top",
        action: {
          type: "uri",
          label: "View Property",
          uri: `${siteConfig.url}/properties/${data.propertyId}`,
        },
      });
    }

    const bodyContentBox = {
      type: "box",
      layout: "vertical",
      paddingAll: "md",
      contents: [] as any[],
    };

    if (propertyData) {
      // Title & Location
      bodyContentBox.contents.push(
        {
          type: "text",
          text: propertyData.title,
          weight: "bold",
          size: "sm",
          wrap: true,
          color: "#333333",
        },
        {
          type: "text",
          text: `📍 ${propertyData.district}, ${propertyData.province}`,
          size: "xs",
          color: "#888888",
          margin: "xs",
        },
      );

      // Specs Row
      bodyContentBox.contents.push({
        type: "box",
        layout: "horizontal",
        margin: "md",
        contents: [
          {
            type: "text",
            text: `🛏️ ${propertyData.bedrooms || "-"}`,
            size: "xs",
            color: "#666666",
            flex: 1,
          },
          { type: "separator", color: "#E0E0E0" },
          {
            type: "text",
            text: `🚿 ${propertyData.bathrooms || "-"}`,
            size: "xs",
            color: "#666666",
            flex: 1,
            align: "center",
          },
          { type: "separator", color: "#E0E0E0" },
          {
            type: "text",
            text: `📏 ${propertyData.size_sqm || "-"} ตร.ม.`,
            size: "xs",
            color: "#666666",
            flex: 2,
            align: "center",
          },
        ],
      });

      // Price & Discount Logic
      let priceSectionContents: any[] = [];

      const createPriceBlock = (
        current: number | null | undefined,
        original: number | null | undefined,
        unit: string = "",
      ) => {
        const blocks: any[] = [];
        const priceToDisplay = current || original;

        if (!priceToDisplay) return [];

        if (original && current && original > current) {
          const discount = Math.round(((original - current) / original) * 100);
          blocks.push({
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: `฿${original.toLocaleString()}`,
                    size: "xs",
                    color: "#888888",
                    decoration: "line-through",
                  },
                  {
                    type: "text",
                    text: `฿${current.toLocaleString()}${unit}`,
                    weight: "bold",
                    size: "lg",
                    color: "#E53935",
                  },
                ],
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: `-${discount}%`,
                    size: "xs",
                    color: "#E53935",
                    weight: "bold",
                    align: "center",
                    gravity: "center",
                  },
                ],
                backgroundColor: "#FFEBEE",
                paddingAll: "xs",
                cornerRadius: "sm",
                margin: "sm",
                flex: 0,
              },
            ],
            alignItems: "center",
          });
        } else {
          blocks.push({
            type: "text",
            text: `฿${priceToDisplay.toLocaleString()}${unit}`,
            weight: "bold",
            size: "lg",
            color: "#E53935",
          });
        }
        return blocks;
      };

      const hasRent =
        (propertyData.rental_price && propertyData.rental_price > 0) ||
        (propertyData.original_rental_price &&
          propertyData.original_rental_price > 0);
      const hasSale =
        (propertyData.price && propertyData.price > 0) ||
        (propertyData.original_price && propertyData.original_price > 0);

      if (hasRent) {
        const rentBlocks = createPriceBlock(
          propertyData.rental_price,
          propertyData.original_rental_price,
          "/ด.",
        );
        if (hasSale) {
          // Add label if showing both
          priceSectionContents.push({
            type: "text",
            text: "ราคาเช่า:",
            size: "xs",
            color: "#888888",
          });
        }
        priceSectionContents.push(...rentBlocks);
      }

      if (hasSale) {
        if (hasRent) {
          priceSectionContents.push({ type: "separator", margin: "sm" });
          priceSectionContents.push({
            type: "text",
            text: "ราคาขาย:",
            size: "xs",
            color: "#888888",
            margin: "sm",
          });
        }
        const saleBlocks = createPriceBlock(
          propertyData.price,
          propertyData.original_price,
          "",
        );
        priceSectionContents.push(...saleBlocks);
      }

      if (!hasRent && !hasSale) {
        // Fallback
        priceSectionContents = [
          {
            type: "text",
            text: "ติดต่อสอบถาม",
            weight: "bold",
            size: "lg",
            color: "#E53935",
          },
        ];
      }

      bodyContentBox.contents.push({
        type: "box",
        layout: "vertical",
        margin: "md",
        contents: priceSectionContents,
      });

      bodyContentBox.contents.push({ type: "separator", margin: "md" });
    }

    // Contact Info Section
    bodyContentBox.contents.push({
      type: "box",
      layout: "vertical",
      margin: "md",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "👤 ลูกค้า:",
              size: "xs",
              color: "#888888",
              flex: 3,
            },
            {
              type: "text",
              text: data.fullName,
              size: "xs",
              color: "#333333",
              flex: 7,
            },
          ],
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "📞 โทร:",
              size: "xs",
              color: "#888888",
              flex: 3,
            },
            {
              type: "text",
              text: data.phone,
              size: "xs",
              color: "#333333",
              flex: 7,
              action: { type: "uri", label: "Call", uri: `tel:${cleanPhone}` },
            },
          ],
          margin: "sm",
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "📱 Line:",
              size: "xs",
              color: "#888888",
              flex: 3,
            },
            {
              type: "text",
              text: data.lineId || "-",
              size: "xs",
              color: "#333333",
              flex: 7,
            },
          ],
          margin: "sm",
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "📝 ข้อความ:",
              size: "xs",
              color: "#888888",
              flex: 3,
            },
            {
              type: "text",
              text: data.message || "-",
              size: "xs",
              color: "#333333",
              flex: 7,
              wrap: true,
            },
          ],
          margin: "sm",
        },
      ],
    });

    flexContents.body.contents.push(bodyContentBox);

    // Build Footer Rows (2 Columns)
    const footerRows: any[] = [];
    const firstRow: any[] = [];
    const secondRow: any[] = [];

    // View Property Button
    if (data.propertyId) {
      firstRow.push({
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🏠 ดูทรัพย์",
            size: "sm",
            color: "#ffffff",
            align: "center",
            weight: "bold",
          },
        ],
        backgroundColor: "#666666",
        cornerRadius: "lg",
        paddingAll: "lg",
        action: {
          type: "uri",
          label: "Property",
          uri: `${siteConfig.url}/properties/${data.propertyId}`,
        },
      });
    }

    // Call Button
    if (data.phone) {
      firstRow.push({
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
        action: { type: "uri", label: "Call", uri: `tel:${cleanPhone}` },
      });
    }

    // LINE Button
    if (data.lineId) {
      secondRow.push({
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

    // CRM Button
    if (lead?.id) {
      secondRow.push({
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📂 ดูในระบบ",
            size: "sm",
            color: "#ffffff",
            align: "center",
            weight: "bold",
          },
        ],
        backgroundColor: templateConfig.config.headerColor || "#2E7D32",
        cornerRadius: "lg",
        paddingAll: "lg",
        action: {
          type: "uri",
          label: "CRM",
          uri: `${siteConfig.url}/protected/leads/${lead.id}`,
        },
      });
    }

    if (firstRow.length > 0) {
      footerRows.push({
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: firstRow,
      });
    }

    if (secondRow.length > 0) {
      footerRows.push({
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: secondRow,
        margin: "sm",
      });
    }

    if (footerRows.length > 0) {
      flexContents.footer = {
        type: "box",
        layout: "vertical",
        contents: footerRows,
        spacing: "sm",
        paddingAll: "lg",
      };
    }

    // Notify Admin (Flex Message)
    if (templateConfig.isActive) {
      await sendLineNotification({
        type: "flex",
        altText: `💬 ใหม่! ลูกค้าสนใจ: ${propertyData?.title || "ทรัพย์"}`,
        contents: flexContents,
      });
      console.log("Inquiry notification sent successfully");
    } else {
      console.log("Inquiry notification skipped: Template is inactive");
    }

    // Final success return with GTM data
    const isHotLead = (data.ai_lead_score || 0) >= 80;
    const utmSource = data.marketing_attribution || "direct";

    return {
      success: true,
      data: {
        id: lead.id,
        aiScore: data.ai_lead_score || 0,
        isHotLead,
        utmSource,
      },
    };
  } catch (err) {
    console.error("Action Error:", err);
    return { error: "เกิดข้อผิดพลาดในการส่งข้อมูล" };
  }
}
