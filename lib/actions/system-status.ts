"use server";

/**
 * Checks if mandatory environment variables are set.
 * Returns only the status (boolean) for each category to avoid exposing sensitive data.
 */
export async function getSystemStatus() {
  const status = {
    meta: {
      configured: !!(
        process.env.META_PAGE_ACCESS_TOKEN &&
        process.env.META_VERIFY_TOKEN &&
        process.env.META_APP_ID &&
        process.env.META_APP_SECRET
      ),
      missing: [
        !process.env.META_PAGE_ACCESS_TOKEN && "Page Access Token",
        !process.env.META_VERIFY_TOKEN && "Verify Token",
        !process.env.META_APP_ID && "App ID",
        !process.env.META_APP_SECRET && "App Secret",
      ].filter(Boolean) as string[],
    },
    line: {
      configured: !!(
        process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_CHANNEL_SECRET
      ),
      missing: [
        !process.env.LINE_CHANNEL_ACCESS_TOKEN && "Channel Access Token",
        !process.env.LINE_CHANNEL_SECRET && "Channel Secret",
      ].filter(Boolean) as string[],
    },
    ai: {
      configured: !!process.env.GEMINI_API_KEY,
      missing: [!process.env.GEMINI_API_KEY && "Gemini API Key"].filter(
        Boolean,
      ) as string[],
    },
    app: {
      url_configured: !!process.env.NEXT_PUBLIC_APP_URL,
    },
  };

  return status;
}
