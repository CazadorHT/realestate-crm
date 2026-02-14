import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { LINE_MESSAGING_API, lineConfig } from "../../../../lib/line-config";
import { searchPropertiesForBot } from "@/features/properties/queries.public";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLineProfile, saveOmniMessage } from "@/lib/line";

type LineEvent = {
  type: string;
  replyToken: string;
  source: {
    userId: string;
    type: string;
  };
  message?: {
    type: string;
    text: string;
    id: string;
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-line-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const hash = crypto
      .createHmac("sha256", lineConfig.channelSecret)
      .update(body)
      .digest("base64");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const events: LineEvent[] = JSON.parse(body).events;

    for (const event of events) {
      if (event.type === "message" && event.message?.type === "text") {
        await handleIncomingChannelMessage(event);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

async function handleIncomingChannelMessage(event: LineEvent) {
  const userId = event.source.userId;
  const text = event.message?.text || "";

  if (!userId || !text) return;

  const supabase = createAdminClient();

  // 1. Find or Create Lead
  let { data: lead } = await supabase
    .from("leads")
    .select("id")
    .eq("line_id", userId)
    .single();

  if (!lead) {
    // Fetch profile from LINE
    const profile = await getLineProfile(userId);
    const { data: newLead, error: createError } = await supabase
      .from("leads")
      .insert({
        full_name: profile?.displayName || "LINE Contact",
        line_id: userId,
        source: "LINE",
        stage: "NEW",
        note: `Auto-captured from LINE. Profile: ${JSON.stringify(profile)}`,
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Error creating auto-lead:", createError);
      return;
    }
    lead = newLead;
  }

  // 2. Log Message to Omni-channel
  if (lead) {
    await saveOmniMessage({
      lead_id: lead.id,
      source: "LINE",
      external_message_id: event.message?.id,
      content: text,
      payload: event,
      direction: "INCOMING",
    });
  }

  // 3. Fallback to existing search logic (AI Search)
  await handleTextMessage(event);
}

async function handleTextMessage(event: LineEvent) {
  const { replyToken, message } = event;
  const text = message?.text?.trim() || "";

  if (!text) return;

  // 1. Search Logic
  // If text starts with specific commands or just general search
  // For MVP: Treat everything as a search query
  console.log(`Searching for: ${text}`);

  const properties = await searchPropertiesForBot(text);

  if (properties.length === 0) {
    await replyText(
      replyToken,
      `ขออภัยครับ ไม่พบทรัพย์ที่ตรงกับ "${text}" ลองระบุทำเล หรือประเภททรัพย์ เช่น "คอนโด บางนา" ดูนะครับ`,
    );
    return;
  }

  // 2. Build Flex Message Carousel
  const bubbles = properties.map((prop) => {
    const imageUrl =
      prop.property_images?.[0]?.image_url ||
      "https://placehold.co/600x400?text=No+Image";
    const priceText =
      prop.listing_type === "RENT"
        ? `฿${prop.rental_price?.toLocaleString()}/เดือน`
        : `฿${prop.price?.toLocaleString()}`;

    return {
      type: "bubble",
      hero: {
        type: "image",
        url: imageUrl,
        size: "full",
        aspectRatio: "4:3",
        aspectMode: "cover",
        gravity: "top", // Requested alignment
        action: {
          type: "uri",
          uri: `https://oma-asset.com/properties/${prop.id}`, // Should use ENV for base URL
        },
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: prop.title,
            weight: "bold",
            size: "md",
            wrap: true,
          },
          {
            type: "box",
            layout: "baseline",
            margin: "md",
            contents: [
              {
                type: "text",
                text: priceText,
                weight: "bold",
                size: "lg",
                color: "#E53935", // Red accent
              },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: `📍 ${prop.popular_area || "ทำเลเยี่ยม"}`,
                size: "xs",
                color: "#666666",
              },
              {
                type: "text",
                text: `🛏️ ${prop.bedrooms || "-"} นอน 🚿 ${prop.bathrooms || "-"} น้ำ`,
                size: "xs",
                color: "#666666",
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            action: {
              type: "uri",
              label: "ดูรายละเอียด",
              uri: `https://oma-asset.com/properties/${prop.id}`,
            },
            color: "#0F172A", // Dark blue/slate
          },
        ],
      },
    };
  });

  const flexMessage = {
    type: "flex",
    altText: `พบ ${properties.length} ทรัพย์ที่เกี่ยวข้อง`,
    contents: {
      type: "carousel",
      contents: bubbles,
    },
  };

  await replyMessage(replyToken, [flexMessage]);
}

async function replyText(replyToken: string, text: string) {
  await replyMessage(replyToken, [{ type: "text", text }]);
}

async function replyMessage(replyToken: string, messages: any[]) {
  try {
    const res = await fetch(`${LINE_MESSAGING_API}/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lineConfig.channelAccessToken}`,
      },
      body: JSON.stringify({
        replyToken,
        messages,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("LINE API Error:", errorText);
    }
  } catch (error) {
    console.error("Reply functionality failed:", error);
  }
}
