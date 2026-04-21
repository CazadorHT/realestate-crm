import { NextRequest, NextResponse } from "next/server";
import { exchangeTikTokCode, saveTikTokToken, getTikTokUserInfo } from "@/lib/tiktok";
import { getBaseUrl } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    console.error("TikTok Auth Error:", error, errorDescription);
    return NextResponse.redirect(
      new URL("/protected/settings?error=tiktok_auth_failed", request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/protected/settings?error=no_code", request.url),
    );
  }

  const baseUrl = getBaseUrl(request);
  const redirectUri = `${baseUrl}/api/auth/callback/tiktok`;
  const tokenData = await exchangeTikTokCode(code, redirectUri);

  if (tokenData) {
    // 1. Fetch user info to display in settings
    const userInfo = await getTikTokUserInfo(tokenData.access_token);
    
    if (!userInfo) {
      console.warn("[TikTok Callback] Successfully exchanged token but failed to fetch user info. Persisting token without metadata.");
    }

    const finalTokenData = {
      ...tokenData,
      display_name: userInfo?.display_name || "TikTok User",
      avatar_url: userInfo?.avatar_url || "",
      updated_at: new Date().toISOString(),
    };

    // 2. Save to database
    await saveTikTokToken(finalTokenData);
    
    console.log(`[TikTok Callback] Successfully connected: ${userInfo?.display_name || 'Unknown'}`);

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/(protected)/protected/settings", "page");

    return NextResponse.redirect(
      new URL(
        "/protected/settings?tab=social&success=tiktok_connected",
        request.url,
      ),
    );
  } else {
    console.error("[TikTok Callback] Token exchange returned null/empty.");
    return NextResponse.redirect(
      new URL("/protected/settings?error=token_exchange_failed", request.url),
    );
  }
}
