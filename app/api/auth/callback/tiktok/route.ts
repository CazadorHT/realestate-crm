import { NextRequest, NextResponse } from "next/server";
import { exchangeTikTokCode, saveTikTokToken } from "@/lib/tiktok";

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

  const tokenData = await exchangeTikTokCode(code);

  if (tokenData) {
    await saveTikTokToken(tokenData);
    return NextResponse.redirect(
      new URL(
        "/protected/settings?tab=social&success=tiktok_connected",
        request.url,
      ),
    );
  } else {
    return NextResponse.redirect(
      new URL("/protected/settings?error=token_exchange_failed", request.url),
    );
  }
}
