import { NextRequest, NextResponse } from "next/server";
import { tiktokConfig } from "@/lib/tiktok-config";
import { getBaseUrl } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const clientKey = tiktokConfig.clientKey;
  const baseUrl = getBaseUrl(request);
  const redirectUri = encodeURIComponent(`${baseUrl}/api/auth/callback/tiktok`);
  const scope = "user.info.basic,video.upload,video.publish";
  const state = Math.random().toString(36).substring(7);

  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${redirectUri}&state=${state}`;

  return NextResponse.redirect(authUrl);
}
