import { metaConfig } from "./meta-config";

/**
 * Fetch Meta user profile (Messenger or Instagram)
 */
export async function getMetaUserProfile(
  psid: string,
  platform: "FACEBOOK" | "INSTAGRAM",
) {
  const token = metaConfig.pageAccessToken;
  if (!token) return null;

  try {
    // Messenger uses different fields than Instagram but basic name is common
    const url = `${metaConfig.graphApiUrl}/${psid}?fields=name,first_name,last_name,profile_pic&access_token=${token}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error(`Error fetching Meta profile for ${platform}:`, err);
    return null;
  }
}

/**
 * Send message to Messenger or Instagram psid
 */
export async function sendMetaMessage(
  psid: string,
  content: string,
  platform: "FACEBOOK" | "INSTAGRAM",
) {
  const token = metaConfig.pageAccessToken;
  if (!token) return { success: false, error: "Missing token" };

  try {
    const url = `${metaConfig.graphApiUrl}/me/messages?access_token=${token}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: psid },
        message: { text: content },
        messaging_type: "RESPONSE", // Required for many types of messages
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      return {
        success: false,
        error: errData.error?.message || "Unknown error",
      };
    }
    return { success: true };
  } catch (err: any) {
    console.error(`Error sending Meta message for ${platform}:`, err);
    return { success: false, error: err.message };
  }
}
