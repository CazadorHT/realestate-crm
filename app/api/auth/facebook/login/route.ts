import { NextRequest, NextResponse } from "next/server";
import { metaConfig } from "@/lib/meta-config";
import { getBaseUrl } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const appId = metaConfig.appId;
  const baseUrl = getBaseUrl(request);
  const redirectUri = encodeURIComponent(`${baseUrl}/api/auth/callback/facebook`);
  
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
