import { tiktokConfig } from "./tiktok-config";
import { createAdminClient } from "./supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

export interface TikTokTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  open_id: string;
  scope: string;
  updated_at?: string; // Track when token was last updated
  display_name?: string;
  avatar_url?: string;
}

export interface TikTokUserInfo {
  display_name: string;
  avatar_url: string;
  open_id?: string;
  union_id?: string;
}

/**
 * Exchange Authorization Code for Access Token
 */
export async function exchangeTikTokCode(
  code: string,
  redirectUri: string,
): Promise<TikTokTokenResponse | null> {
  const url = "https://open.tiktokapis.com/v2/oauth/token/";
  const params = new URLSearchParams({
    client_key: tiktokConfig.clientKey,
    client_secret: tiktokConfig.clientSecret,
    code: code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("TikTok Token Exchange Error:", data);
      return null;
    }

    return data;
  } catch (error) {
    console.error("TikTok Token Exchange Exception:", error);
    return null;
  }
}

/**
 * Refresh TikTok token using refresh_token
 */
export async function refreshTikTokToken(
  refreshToken: string,
): Promise<TikTokTokenResponse | null> {
  const url = "https://open.tiktokapis.com/v2/oauth/token/";
  const params = new URLSearchParams({
    client_key: tiktokConfig.clientKey,
    client_secret: tiktokConfig.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("TikTok Token Refresh Error:", data);
      return null;
    }

    return data;
  } catch (error) {
    console.error("TikTok Token Refresh Exception:", error);
    return null;
  }
}

/**
 * Check if token is expired and refresh if necessary
 */
export async function refreshTikTokTokenIfNeeded(): Promise<string | null> {
  const token = await getTikTokToken();
  if (!token) return null;

  const updatedAt = token.updated_at ? new Date(token.updated_at).getTime() : 0;
  const now = Date.now();
  const buffer = 300 * 1000; // 5 minutes buffer

  // expires_in is in seconds
  if (now >= updatedAt + (token.expires_in * 1000) - buffer) {
    console.log("[TikTok] Token expired or expiring soon, refreshing...");
    const refreshed = await refreshTikTokToken(token.refresh_token);
    if (refreshed) {
      // Ensure we keep existing metadata if not returned in refresh
      const finalToken = {
        ...token,
        ...refreshed,
        updated_at: new Date().toISOString()
      };
      await saveTikTokToken(finalToken);
      return finalToken.access_token;
    }
    return null;
  }

  return token.access_token;
}

/**
 * Publish Photo Mode content to TikTok
 */
export async function publishTikTokPhotoPost(
  accessToken: string,
  params: {
    title: string;
    description: string;
    images: string[];
    postMode: "DIRECT_POST" | "MEDIA_UPLOAD";
    privacyLevel?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY";
  },
) {
  const url = "https://open.tiktokapis.com/v2/post/publish/content/init/";

  const body = {
    post_info: {
      // TikTok title limit is 80 chars, description limit is 4000
      title: params.title.substring(0, 80), 
      description: params.description.substring(0, 4000),
      privacy_level: params.privacyLevel || "PUBLIC_TO_EVERYONE",
      disable_comment: false,
      disable_duet: false,
      disable_stitch: false,
    },
    source_info: {
      source: "PULL_FROM_URL",
      photo_cover_index: 0,
      photo_images: params.images.slice(0, 35), // Max 35 images
    },
    post_mode: params.postMode,
    media_type: "PHOTO",
  };

  console.log("[TikTok API Request Body]:", JSON.stringify(body, null, 2));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("[TikTok API Response]:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("TikTok Publish Error Data:", data);
      return {
        success: false,
        error: data.error?.message || "Unknown TikTok error",
        error_code: data.error?.code,
      };
    }

    return {
      success: true,
      status: "PROCESSING",
      publish_id: data.data?.publish_id,
      data: data.data
    };
  } catch (error) {
    console.error("TikTok Publish Exception:", error);
    return { success: false, status: "FAILED", error: error instanceof Error ? error.message : String(error) };
  }
}

export interface TikTokPublishStatusResponse {
  success: boolean;
  status: "PROCESSING" | "FAILED" | "SUCCESS" | "UNKNOWN";
  publish_id?: string;
  fail_reason?: string;
  public_url?: string;
  error?: string;
  data?: any;
}

/**
 * Fetch the status of a TikTok publish task
 */
export async function getTikTokPublishStatus(
  accessToken: string,
  publishId: string
): Promise<TikTokPublishStatusResponse> {
  const url = "https://open.tiktokapis.com/v2/post/publish/status/fetch/";
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publish_id: publishId }),
    });

    const data = await response.json();
    console.log("[TikTok Status Response]:", JSON.stringify(data, null, 2));

    if (response.status === 401) {
      return { success: false, status: "FAILED", error: "Unauthorized" };
    }

    if (!data.data) {
      return { success: false, status: "FAILED", error: data.error?.message || "Invalid response", data: data };
    }

    return {
      success: true,
      status: data.data?.status || "UNKNOWN",
      fail_reason: data.data?.fail_reason,
      public_url: data.data?.public_url,
      data: data.data
    };
  } catch (error) {
    return { success: false, status: "FAILED", error: "Network error checking TikTok status" };
  }
}

/**
 * Fetch basic user info from TikTok
 */
export async function getTikTokUserInfo(
  accessToken: string,
): Promise<TikTokUserInfo | null> {
  // Try newer v2 user info field names
  const url = "https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url,open_id,union_id";

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("TikTok User Info Error:", data);
      return null;
    }

    // Standard TikTok v2 response structure is data.user
    return data.data?.user || data.user || null;
  } catch (error) {
    console.error("TikTok User Info Exception:", error);
    return null;
  }
}

/**
 * Save TikTok token to site_settings (Simple singleton approach)
 */
export async function saveTikTokToken(tokenData: TikTokTokenResponse) {
  let tenantId: string | null = null;
  try {
    const supabaseUser = await createServerClient();
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (user) {
      const { data: identity } = await supabaseUser
        .from("identities_v3")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();
      if (identity?.tenant_id) {
        tenantId = identity.tenant_id;
      }
    }
  } catch (err) {
    console.warn("Could not retrieve user context for TikTok token, falling back to existing row or null", err);
  }

  const supabase = createAdminClient();
  
  // Try to find if there is an existing row for 'tiktok_auth_token'
  const { data: existing } = await supabase
    .from("site_settings")
    .select("tenant_id, category")
    .eq("key", "tiktok_auth_token")
    .limit(1)
    .maybeSingle();

  const tenant_id = existing?.tenant_id ?? tenantId ?? null;
  const category = existing?.category || "general";

  const { error } = await supabase.from("system_settings_v3").upsert({
    tenant_id,
    category,
    key: "tiktok_auth_token",
    value: {
      ...tokenData,
      updated_at: new Date().toISOString(),
    },
  }, { onConflict: "tenant_id,category,key" });

  if (error) {
    console.error("Error saving TikTok token:", error);
  }
}

/**
 * Get active TikTok token from database
 */
export async function getTikTokToken(): Promise<TikTokTokenResponse | null> {
  let supabase;
  try {
    supabase = await createServerClient();
  } catch {
    supabase = createAdminClient();
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "tiktok_auth_token")
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.value as unknown as TikTokTokenResponse;
}
