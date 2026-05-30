import * as line from "@line/bot-sdk";

const { messagingApi } = line;

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
});

/**
 * Sends a push message to an agent when a high-quality property match is found.
 */
export async function notifyAgentOfSmartMatch(args: {
  lineUserId: string;
  agentName: string;
  leadName: string;
  propertyTitle: string;
  matchScore: number;
  leadUrl?: string;
  propertyUrl?: string;
  propertyImageUrl?: string | null;
}) {
  if (!args.lineUserId || !process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn("Skipping LINE notification: Missing lineUserId or token.");
    return;
  }

  const scoreText = `${(args.matchScore * 100).toFixed(0)}%`;
  const defaultImage = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80";
  const imageUrl = args.propertyImageUrl || defaultImage;

  const flexBubble = {
    type: "bubble",
    hero: {
      type: "image",
      url: imageUrl,
      size: "full",
      aspectRatio: "20:13",
      aspectMode: "cover",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "🎯 AI Smart Match พบคู่แท้!",
          weight: "bold",
          size: "lg",
          color: "#1E3A5F",
        },
        {
          type: "text",
          text: `เรียนคุณ ${args.agentName} ระบบ AI พบคู่ทรัพย์สินที่ตรงกับความต้องการของลูกค้าแล้วครับ`,
          size: "xs",
          color: "#666666",
          wrap: true,
          margin: "sm",
        },
        {
          type: "separator",
          margin: "md",
        },
        {
          type: "box",
          layout: "vertical",
          margin: "md",
          spacing: "sm",
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
                  flex: 2,
                },
                {
                  type: "text",
                  text: args.leadName,
                  size: "xs",
                  weight: "bold",
                  color: "#333333",
                  flex: 5,
                  wrap: true,
                },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "🏠 ทรัพย์สิน:",
                  size: "xs",
                  color: "#888888",
                  flex: 2,
                },
                {
                  type: "text",
                  text: args.propertyTitle,
                  size: "xs",
                  weight: "bold",
                  color: "#333333",
                  flex: 5,
                  wrap: true,
                },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "⭐ คะแนนจับคู่:",
                  size: "xs",
                  color: "#888888",
                  flex: 2,
                },
                {
                  type: "text",
                  text: scoreText,
                  size: "xs",
                  weight: "bold",
                  color: "#059669",
                  flex: 5,
                },
              ],
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
        args.propertyUrl ? {
          type: "button",
          style: "primary",
          color: "#1E3A5F",
          height: "sm",
          action: {
            type: "uri",
            label: "🔎 ดูรายละเอียดทรัพย์",
            uri: args.propertyUrl,
          },
        } : null,
        args.leadUrl ? {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "uri",
            label: "👤 ดูข้อมูลลูกค้า (Lead)",
            uri: args.leadUrl,
          },
        } : null,
      ].filter(Boolean) as any[],
    },
  };

  try {
    await client.pushMessage({
      to: args.lineUserId,
      messages: [
        {
          type: "flex",
          altText: `🎯 AI Smart Match: ${args.propertyTitle} (${scoreText})`,
          contents: flexBubble as any,
        },
      ],
    });
    console.log(`LINE Flex notification sent to ${args.lineUserId} (Score: ${scoreText})`);
  } catch (error) {
    console.error("Error sending LINE Flex notification:", error);
  }
}

/**
 * Sends a generic notification message.
 */
export async function sendLineBroadcast(messages: line.messagingApi.Message[]) {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) return;
  
  try {
    await client.broadcast({
      messages: messages,
    });
  } catch (error) {
    console.error("Error broadcasting LINE message:", error);
  }
}
