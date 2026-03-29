import { metaConfig } from "./meta-config";
import { MetaPlatform, MetaUserProfile, MetaApiResponse } from "@/types/meta";

/**
 * Fetch Meta user profile (Messenger or Instagram)
 */
export async function getMetaUserProfile(
  psid: string,
  platform: MetaPlatform,
): Promise<MetaUserProfile | null> {
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
  platform: MetaPlatform,
): Promise<MetaApiResponse> {
  const token = metaConfig.pageAccessToken;
  if (!token) return { success: false, error: "ไม่พบ Token สำหรับการเชื่อมต่อ (Page Access Token)" };

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
      const detailedError = `Meta API Error (${response.status}): ${errData.error?.message || "Unknown error"}`;
      console.error(`[meta.ts] sendMetaMessage failure:`, detailedError);
      return {
        success: false,
        error: `เกิดข้อผิดพลาดจาก Meta API (${response.status}): ${errData.error?.message || "ไม่ทราบสาเหตุ"}`,
      };
    }
    return { success: true };
  } catch (err: any) {
    console.error(`Error sending Meta message for ${platform}:`, err);
    return { success: false, error: err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ" };
  }
}

/**
 * Send media message (image, video, etc) to PSID
 */
export async function sendMetaMedia(
  psid: string,
  url: string,
  type: "image" | "video" | "file" = "image",
  platform: MetaPlatform,
): Promise<MetaApiResponse> {
  const token = metaConfig.pageAccessToken;
  if (!token) return { success: false, error: "ไม่พบ Token สำหรับการเชื่อมต่อ" };

  try {
    const apiUrl = `${metaConfig.graphApiUrl}/me/messages?access_token=${token}`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: psid },
        message: {
          attachment: {
            type: type,
            payload: {
              url: url,
              is_reusable: true,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      return {
        success: false,
        error: errData.error?.message || "ไม่ทราบสาเหตุ",
      };
    }
    return { success: true };
  } catch (err: any) {
    console.error(`Error sending Meta media for ${platform}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Send Carousel (Generic Template) to FB or multiple images to IG
 */
export async function sendMetaCarousel(
  psid: string,
  elements: Array<{
    title: string;
    subtitle?: string;
    image_url: string;
    default_action?: { type: string; url: string };
    buttons?: any[];
  }>,
  platform: MetaPlatform,
): Promise<MetaApiResponse> {
  const token = metaConfig.pageAccessToken;
  if (!token) return { success: false, error: "ไม่พบ Token สำหรับการเชื่อมต่อ" };

  // Instagram doesn't support Generic Template (Carousel) in the same way FB does via API
  // Best practice for IG is to send separate images
  if (platform === "INSTAGRAM") {
    // Limit to first 5 images for IG to avoid spamming
    const images = elements.slice(0, 5);
    for (const item of images) {
      await sendMetaMedia(psid, item.image_url, "image", "INSTAGRAM");
    }
    return { success: true };
  }

  // Facebook Generic Template
  try {
    const url = `${metaConfig.graphApiUrl}/me/messages?access_token=${token}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: psid },
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements: elements.slice(0, 20), // FB Carousel max 20
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      return {
        success: false,
        error: errData.error?.message || "ไม่ทราบสาเหตุ",
      };
    }
    return { success: true };
  } catch (err: any) {
    console.error(`Error sending Meta carousel for ${platform}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Automatically discover the WhatsApp Phone Number ID associated with the token
 */
export async function discoverWhatsAppPhoneNumberId(): Promise<string | null> {
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
 * Automatically discover the Instagram Business Account ID associated with the page
 */
export async function discoverInstagramBusinessId(): Promise<string | null> {
  // Use manual override if available
  if (metaConfig.instagramBusinessId) {
    return metaConfig.instagramBusinessId;
  }

  const token = metaConfig.pageAccessToken;
  if (!token) return null;

  try {
    const url = `${metaConfig.graphApiUrl}/me?fields=instagram_business_account&access_token=${token}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.instagram_business_account) {
      console.warn("[meta.ts] No instagram_business_account found in Meta API response:", data);
    }

    return data.instagram_business_account?.id || null;
  } catch (err) {
    console.error("Error discovering Instagram Business ID:", err);
    return null;
  }
}

/**
 * Send WhatsApp message using Meta Graph API
 */
export async function sendWhatsAppMessage(
  phoneNumber: string,
  content: string,
): Promise<MetaApiResponse> {
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
        error: errData.error?.message || "ไม่ทราบสาเหตุ",
      };
    }
    return { success: true };
  } catch (err: any) {
    console.error("Error sending WhatsApp message:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Reply to a specific Facebook or Instagram comment
 */
export async function replyToMetaComment(
  commentId: string,
  content: string,
): Promise<MetaApiResponse<{ id: string }>> {
  const token = metaConfig.pageAccessToken;
  if (!token) return { success: false, error: "ไม่พบ Token สำหรับการเชื่อมต่อ" };

  try {
    const url = `${metaConfig.graphApiUrl}/${commentId}/comments?access_token=${token}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: content }),
    });

    if (!response.ok) {
      const errData = await response.json();
      return {
        success: false,
        error: errData.error?.message || "ไม่ทราบสาเหตุ",
      };
    }
    const resData = await response.json();
    return { success: true, data: { id: resData.id } };
  } catch (err: any) {
    console.error("Error replying to comment:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Send a private reply to a Facebook or Instagram comment (Keyword Automation)
 */
export async function sendPrivateReply(
  commentId: string,
  content: string,
  platform: MetaPlatform,
): Promise<MetaApiResponse> {
  const token = metaConfig.pageAccessToken;
  if (!token) return { success: false, error: "ไม่พบ Token สำหรับการเชื่อมต่อ" };

  try {
    let url = "";
    let body: any = {};

    if (platform === "FACEBOOK") {
      // FB Private Reply endpoint
      url = `${metaConfig.graphApiUrl}/${commentId}/private_replies?access_token=${token}`;
      body = { message: content };
    } else if (platform === "INSTAGRAM") {
      // Instagram Private Reply uses the normal messages endpoint but with comment_id
      url = `${metaConfig.graphApiUrl}/me/messages?access_token=${token}`;
      body = {
        recipient: { comment_id: commentId },
        message: { text: content },
      };
    } else {
      return {
        success: false,
        error: "Private reply not supported for WhatsApp",
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errData = await response.json();
      return {
        success: false,
        error: errData.error?.message || "ไม่ทราบสาเหตุ",
      };
    }
    return { success: true };
  } catch (err: any) {
    console.error(`Error sending private reply for ${platform}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch detailed lead data from Facebook Lead Ads ID
 */
export async function fetchFacebookLeadDetails(
  leadgenId: string,
): Promise<any | null> {
  const token = metaConfig.pageAccessToken;
  if (!token) return null;

  try {
    const url = `${metaConfig.graphApiUrl}/${leadgenId}?access_token=${token}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error("Error fetching leadgen details:", err);
    return null;
  }
}

/**
 * Post a new status/photo to Facebook Page or Instagram Business
 */
export async function postToMetaPage(
  content: string,
  imageUrls?: string | string[],
  platform: MetaPlatform = "FACEBOOK",
): Promise<MetaApiResponse> {
  const token = metaConfig.pageAccessToken;
  if (!token) return { success: false, error: "ไม่พบ Token สำหรับการเชื่อมต่อ (Page Access Token)" };

  const images = Array.isArray(imageUrls)
    ? imageUrls
    : imageUrls
      ? [imageUrls]
      : [];

  try {
    if (platform === "FACEBOOK") {
      if (images.length === 0) {
        // Text only post
        const url = `${metaConfig.graphApiUrl}/me/feed?access_token=${token}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content }),
        });
        const data = await res.json();
        return res.ok
          ? { success: true, data }
          : { success: false, error: data.error?.message };
      }

      if (images.length === 1) {
        // Native Photo Post (Hides domain, looks better)
        const url = `${metaConfig.graphApiUrl}/me/photos?access_token=${token}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: images[0], caption: content }),
        });
        const data = await res.json();
        if (!res.ok) {
          console.error("Facebook Photo Post Error:", data);
          return { success: false, error: `ไม่สามารถโพสต์รูปภาพไปยัง Facebook ได้ (${data.error?.message || "Unknown error"})` };
        }
        return { success: true, data };
      }

      // Multi-photo Post
      // 1. Upload photos as unpublished
      const mediaIds: string[] = [];
      for (const imgUrl of images.slice(0, 50)) {
        const uploadUrl = `${metaConfig.graphApiUrl}/me/photos?access_token=${token}`;
        try {
          const uploadRes = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: imgUrl, published: false }),
          });
          const uploadData = await uploadRes.json();
          if (uploadRes.ok && uploadData.id) {
            mediaIds.push(uploadData.id);
          } else {
            console.warn("[meta.ts] Failed to upload photo to FB:", uploadData);
          }
        } catch (err) {
          console.error("[meta.ts] Error uploading photo to FB:", err);
        }
      }

      if (mediaIds.length === 0) {
        return {
          success: false,
          error: "ไม่สามารถอัปโหลดรูปภาพไปยัง Facebook สำหรับโพสต์แบบกลุ่มได้เลยแม้แต่รูปเดียว (กรุณาเช็คว่า URL รูปภาพเข้าถึงได้จากอินเทอร์เน็ตหรือไม่)",
        };
      }

      // 2. Attach to feed
      const feedUrl = `${metaConfig.graphApiUrl}/me/feed?access_token=${token}`;
      const attachedMedia = mediaIds.map((id) => ({ media_fbid: id }));
      const feedRes = await fetch(feedUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          attached_media: attachedMedia,
        }),
      });
      const feedData = await feedRes.json();
      if (!feedRes.ok) {
        console.error("Facebook Feed Post Error:", feedData);
        return { success: false, error: `ไม่สามารถสร้างโพสต์แบบกลุ่มบน Facebook ได้ (${feedData.error?.message || "Unknown error"})` };
      }
      return { success: true, data: feedData };
    } else if (platform === "INSTAGRAM") {
      // Instagram Post
      const igId = await discoverInstagramBusinessId();
      if (!igId) {
        return {
          success: false,
          error: "ไม่พบบัญชี Instagram Business ที่เชื่อมต่อกับเพจนี้ (กรุณาเช็คการเชื่อมต่อในหน้าตั้งค่า Facebook Page)",
        };
      }

      if (images.length === 0) {
        return { success: false, error: "การโพสต์ Instagram จำเป็นต้องมีรูปภาพ" };
      }

      if (images.length === 1) {
        // Single Image
        const createUrl = `${metaConfig.graphApiUrl}/${igId}/media?image_url=${encodeURIComponent(images[0])}&caption=${encodeURIComponent(content)}&access_token=${token}`;
        const createRes = await fetch(createUrl, { method: "POST" });
        const createData = await createRes.json();

        if (!createRes.ok || !createData.id) {
          console.error("Instagram Media Creation Error:", createData);
          return {
            success: false,
            error: `ไม่สามารถเริ่มสร้างโพสต์ Instagram ได้ (${createData.error?.message || "Unknown error"})`,
          };
        }

        const publishUrl = `${metaConfig.graphApiUrl}/${igId}/media_publish?creation_id=${createData.id}&access_token=${token}`;
        const publishRes = await fetch(publishUrl, { method: "POST" });
        const publishData = await publishRes.json();

        if (!publishRes.ok) {
          console.error("Instagram Media Publish Error:", publishData);
          return {
            success: false,
            error: `ไม่สามารถนำโพสต์ขึ้น Instagram ได้ (${publishData.error?.message || "Unknown error"})`,
          };
        }
        return { success: true, data: publishData };
      }

      // Multi-image (Carousel) - Support up to 10 images (API Limit)
      // 1. Create items
      const childIds: string[] = [];
      let lastError = "";
      console.log(`[meta.ts] Processing ${images.length} images for Instagram carousel...`);
      
      for (const imgUrl of images.slice(0, 20)) {
        const itemUrl = `${metaConfig.graphApiUrl}/${igId}/media?image_url=${encodeURIComponent(imgUrl)}&is_carousel_item=true&access_token=${token}`;
        const itemRes = await fetch(itemUrl, { method: "POST" });
        const itemData = await itemRes.json();
        if (itemRes.ok && itemData.id) {
          childIds.push(itemData.id);
        } else {
          lastError = itemData.error?.message || "Unknown error";
          console.error(`[meta.ts] Failed to create carousel item for ${imgUrl}:`, itemData);
        }
      }

      if (childIds.length === 0) {
        return {
          success: false,
          error: `ไม่สามารถส่งรูปภาพไปยัง Instagram ได้เลยแม้แต่รูปเดียว (${lastError}) (กรุณาเช็คว่า URL รูปภาพเข้าถึงได้จากอินเทอร์เน็ตหรือไม่ หากรันบน Localhost ต้องใช้ URL สาธารณะเท่านั้น)`,
        };
      }

      // Fallback: If only 1 image remains after processing, post it as a single image
      if (childIds.length === 1) {
        console.log("[meta.ts] Only one image succeeded for carousel, falling back to single image post");
        const singleUrl = `${metaConfig.graphApiUrl}/${igId}/media?image_url=${encodeURIComponent(images[0])}&caption=${encodeURIComponent(content)}&access_token=${token}`;
        const singleRes = await fetch(singleUrl, { method: "POST" });
        const singleData = await singleRes.json();
        
        if (!singleRes.ok || !singleData.id) {
          return { success: false, error: `ไม่สามารถโพสต์รูปแบบรูปเดี่ยว (Fallback) ได้: ${singleData.error?.message}` };
        }

        const pubUrl = `${metaConfig.graphApiUrl}/${igId}/media_publish?creation_id=${singleData.id}&access_token=${token}`;
        const pubRes = await fetch(pubUrl, { method: "POST" });
        const pubData = await pubRes.json();
        return pubRes.ok ? { success: true, data: pubData } : { success: false, error: `มีปัญหาตอนนำโพสต์ (Fallback) ขึ้น IG: ${pubData.error?.message}` };
      }

      // 2. Create Carousel Container
      const carouselUrl = `${metaConfig.graphApiUrl}/${igId}/media?media_type=CAROUSEL&children=${childIds.join(",")}&caption=${encodeURIComponent(content)}&access_token=${token}`;
      const carouselRes = await fetch(carouselUrl, { method: "POST" });
      const carouselData = await carouselRes.json();

      if (!carouselRes.ok || !carouselData.id) {
        console.error("Instagram Carousel Creation Error:", carouselData);
        return {
          success: false,
          error: `ไม่สามารถรวมรูปภาพเข้าด้วยกันเป็น Carousel ได้ (${carouselData.error?.message || "OAuthException 100?"})`,
        };
      }

      // 3. Publish Carousel
      const publishUrl = `${metaConfig.graphApiUrl}/${igId}/media_publish?creation_id=${carouselData.id}&access_token=${token}`;
      const publishRes = await fetch(publishUrl, { method: "POST" });
      const publishData = await publishRes.json();

      return publishRes.ok
        ? { success: true, data: publishData }
        : { success: false, error: `ไม่สามารถนำโพสต์แบบกลุ่ม (Carousel) ขึ้น IG ได้ (${publishData.error?.message})` };
    } else {
      return {
        success: false,
        error: "WhatsApp ไม่รองรับการโพสต์ฟีดผ่านช่องทางนี้",
      };
    }
  } catch (err: any) {
    console.error("Error posting to Meta:", err);
    return { success: false, error: `เกิดข้อผิดพลาดในการโพสต์: ${err.message}` };
  }
}
