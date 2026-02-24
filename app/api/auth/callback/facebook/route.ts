import { NextRequest, NextResponse } from "next/server";
import { metaConfig } from "@/lib/meta-config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  if (error) {
    console.error("Facebook Auth Error:", error);
    return NextResponse.redirect(
      new URL("/protected/settings?error=facebook_auth_failed", request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/protected/settings?error=no_code", request.url),
    );
  }

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/facebook`;

    // 1. Exchange code for user access token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${metaConfig.appId}&redirect_uri=${redirectUri}&client_secret=${metaConfig.appSecret}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("Facebook Token Exchange Error:", tokenData);
      return NextResponse.redirect(
        new URL("/protected/settings?error=token_exchange_failed", request.url),
      );
    }

    const userAccessToken = tokenData.access_token;

    // 2. Get Page Access Tokens
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}`;
    const pagesRes = await fetch(pagesUrl);
    const pagesData = await pagesRes.json();

    if (pagesRes.ok && pagesData.data && pagesData.data.length > 0) {
      // For now, take the first page as default
      const pageToken = pagesData.data[0].access_token;
      const pageId = pagesData.data[0].id;

      const supabase = createAdminClient();
      await supabase.from("site_settings").upsert([
        { key: "meta_page_access_token", value: pageToken },
        { key: "meta_page_id", value: pageId },
        { key: "meta_user_access_token", value: userAccessToken },
      ]);
    }

    return NextResponse.redirect(
      new URL("/protected/settings?success=facebook_connected", request.url),
    );
  } catch (err) {
    console.error("Facebook Callback Exception:", err);
    return NextResponse.redirect(
      new URL(
        "/protected/settings?error=facebook_callback_exception",
        request.url,
      ),
    );
  }
}
