import { tiktokConfig } from "./tiktok-config";
import { createAdminClient } from "./supabase/admin";

export interface TikTokTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  open_id: string;
  scope: string;
}

/**
 * Exchange Authorization Code for Access Token
 */
export async function exchangeTikTokCode(
  code: string,
): Promise<TikTokTokenResponse | null> {
  const url = "https://open.tiktokapis.com/v2/oauth/token/";
  const params = new URLSearchParams({
    client_key: tiktokConfig.clientKey,
    client_secret: tiktokConfig.clientSecret,
    code: code,
    grant_type: "authorization_code",
    redirect_uri: tiktokConfig.redirectUri,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("TikTok Token Exchange Error:", err);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("TikTok Token Exchange Exception:", error);
    return null;
  }
}

/**
 * Save TikTok token to site_settings (Simple singleton approach)
 */
export async function saveTikTokToken(tokenData: TikTokTokenResponse) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("site_settings").upsert({
    key: "tiktok_auth_token",
    value: {
      ...tokenData,
      updated_at: new Date().toISOString(),
    },
  });

  if (error) {
    console.error("Error saving TikTok token:", error);
  }
}

/**
 * Get active TikTok token from database
 */
export async function getTikTokToken(): Promise<TikTokTokenResponse | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "tiktok_auth_token")
    .single();

  if (error || !data) return null;
  return data.value as unknown as TikTokTokenResponse;
}
