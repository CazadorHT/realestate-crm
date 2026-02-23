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

/**
 * Automatically discover the WhatsApp Phone Number ID associated with the token
 */
export async function discoverWhatsAppPhoneNumberId() {
  const token = metaConfig.whatsappAccessToken || metaConfig.pageAccessToken;
  if (!token) return null;

  try {
    // 1. Get WABA IDs linked to this token
    const wabaUrl = `${metaConfig.graphApiUrl}/me?fields=whatsapp_business_accounts&access_token=${token}`;
    const wabaRes = await fetch(wabaUrl);
    const wabaData = await wabaRes.json();

    const wabaId = wabaData.whatsapp_business_accounts?.data?.[0]?.id;
    if (!wabaId) return null;

    // 2. Get Phone Numbers for that WABA
    const phoneUrl = `${metaConfig.graphApiUrl}/${wabaId}/phone_numbers?access_token=${token}`;
    const phoneRes = await fetch(phoneUrl);
    const phoneData = await phoneRes.json();

    return phoneData.data?.[0]?.id || null;
  } catch (err) {
    console.error("Error discovering WhatsApp ID:", err);
    return null;
  }
}

/**
 * Send WhatsApp message using Meta Graph API
 */
export async function sendWhatsAppMessage(
  phoneNumber: string,
  content: string,
) {
  const token = metaConfig.whatsappAccessToken || metaConfig.pageAccessToken;
  let phoneNumberId = metaConfig.whatsappPhoneNumberId;

  // -- AUTO DISCOVERY --
  if (!phoneNumberId && token) {
    phoneNumberId = (await discoverWhatsAppPhoneNumberId()) || "";
  }

  if (!token || !phoneNumberId) {
    console.warn("[MOCK] WhatsApp sending (Missing Keys):", {
      phoneNumber,
      content,
    });
    return { success: true, mock: true };
  }

  try {
    const url = `${metaConfig.graphApiUrl}/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phoneNumber,
        type: "text",
        text: { body: content },
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
    console.error("Error sending WhatsApp message:", err);
    return { success: false, error: err.message };
  }
}
