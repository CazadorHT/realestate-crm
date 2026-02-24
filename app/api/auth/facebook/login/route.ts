import { NextResponse } from "next/server";
import { metaConfig } from "@/lib/meta-config";

export async function GET() {
  const appId = metaConfig.appId;
  const redirectUri = encodeURIComponent(
    `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/facebook`,
  );
  const scope = [
    "public_profile",
    "email",
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
    "pages_messaging",
    "instagram_manage_messages",
  ].join(",");
  const state = Math.random().toString(36).substring(7);

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

  return NextResponse.redirect(authUrl);
}
