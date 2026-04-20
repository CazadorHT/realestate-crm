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
}) {
  if (!args.lineUserId || !process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn("Skipping LINE notification: Missing lineUserId or token.");
    return;
  }

  const scoreText = `${(args.matchScore * 100).toFixed(0)}%`;
  
  const text = 
    `📢 [AI Smart Match Found!]\n\n` +
    `Hello ${args.agentName},\n` +
    `AI suggests a property for your lead: ${args.leadName}\n\n` +
    `🏠 Property: ${args.propertyTitle}\n` +
    `⭐ Match Score: ${scoreText}\n\n` +
    `Check the details in your dashboard to send it to the customer.`;

  try {
    await client.pushMessage({
      to: args.lineUserId,
      messages: [
        {
          type: "text",
          text: text,
        },
      ],
    });
    console.log(`LINE notification sent to ${args.lineUserId} (Score: ${scoreText})`);
  } catch (error) {
    console.error("Error sending LINE notification:", error);
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
