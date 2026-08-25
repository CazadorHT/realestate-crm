import { Bot } from "grammy";

const token = process.env.TELEGRAM_BOT_TOKEN;

// Initialize bot instance for reuse
export const telegramBot = token ? new Bot(token) : null;

/**
 * 📢 Enterprise Admin Notification Bridge
 * Sends messages to a specific Group or individual Admin
 */
export async function sendAdminNotification(
  message: string, 
  options: { 
    chatId?: string; 
    parseMode?: "HTML" | "MarkdownV2";
    replyMarkup?: any;
  } = {}
) {
  if (!telegramBot) {
    console.warn("[TELEGRAM] Skip notification: Bot token missing");
    return;
  }

  const targetId = options.chatId || process.env.TELEGRAM_ADMIN_GROUP_ID;

  if (!targetId) {
    console.error("[TELEGRAM] Skip notification: No target chatId provided and TELEGRAM_ADMIN_GROUP_ID is missing");
    return;
  }

  try {
    console.log(`[TELEGRAM] Attempting to send message to ${targetId}`);
    await telegramBot.api.sendMessage(targetId, message, {
      parse_mode: options.parseMode || "HTML",
      reply_markup: options.replyMarkup,
    });
    console.log(`[TELEGRAM] Message sent successfully to ${targetId}`);
  } catch (error: any) {
    console.error("[TELEGRAM] Failed to send admin notification:", error.message || error);
    if (error.parameters?.retry_after) {
      console.warn(`[TELEGRAM] Rate limited. Retry after ${error.parameters.retry_after}s`);
    }
  }
}

/**
 * 🖼️ Send Photo with Caption to Admin
 */
export async function sendAdminPhoto(
  photoUrl: string,
  caption: string,
  options: { 
    chatId?: string; 
    parseMode?: "HTML" | "MarkdownV2";
    replyMarkup?: any;
  } = {}
) {
  if (!telegramBot) return;
  const targetId = options.chatId || process.env.TELEGRAM_ADMIN_GROUP_ID;
  if (!targetId) return;

  try {
    const safeCaption = caption.length > 1024 ? caption.slice(0, 1020) + "..." : caption;
    await telegramBot.api.sendPhoto(targetId, photoUrl, {
      caption: safeCaption,
      parse_mode: options.parseMode || "HTML",
      reply_markup: options.replyMarkup,
    });
  } catch (error: any) {
    console.error("[TELEGRAM] Failed to send photo:", error.message || error);
    // Fallback to text if photo fails
    await sendAdminNotification(caption, options);
  }
}
