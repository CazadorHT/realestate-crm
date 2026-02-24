import { NextResponse } from "next/server";
import { tiktokConfig } from "@/lib/tiktok-config";

export async function GET() {
  const clientKey = tiktokConfig.clientKey;
  const redirectUri = encodeURIComponent(tiktokConfig.redirectUri);
  const scope = "user.info.basic,video.upload,video.publish";
  const state = Math.random().toString(36).substring(7);

  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${redirectUri}&state=${state}`;

  return NextResponse.redirect(authUrl);
}
