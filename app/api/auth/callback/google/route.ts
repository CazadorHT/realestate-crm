import { NextRequest, NextResponse } from "next/server";
import { googleConfig } from "@/lib/google-config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("Google Auth Error:", error);
    return NextResponse.redirect(
      new URL("/protected/settings?error=google_auth_failed", request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/protected/settings?error=no_code", request.url),
    );
  }

  try {
    const url = "https://oauth2.googleapis.com/token";
    const values = {
      code,
      client_id: googleConfig.clientId,
      client_secret: googleConfig.clientSecret,
      redirect_uri: googleConfig.redirectUri,
      grant_type: "authorization_code",
    };

    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(values),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Google Token Exchange error:", data);
      return NextResponse.redirect(
        new URL("/protected/settings?error=token_exchange_failed", request.url),
      );
    }

    // data contains access_token, refresh_token, etc.
    
    // Fetch user info to get email
    let email = null;
    try {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        email = userData.email;
      }
    } catch (userInfoErr) {
      console.error("Error fetching Google user info:", userInfoErr);
    }

    const supabase = createAdminClient();
    await supabase.from("site_settings").upsert({
      key: "google_integration_tokens",
      value: {
        ...data,
        email,
        updated_at: new Date().toISOString(),
      },
    });

    return NextResponse.redirect(
      new URL(
        "/protected/settings?tab=social&success=google_connected",
        request.url,
      ),
    );
  } catch (err) {
    console.error("Google Callback Exception:", err);
    return NextResponse.redirect(
      new URL(
        "/protected/settings?error=google_callback_exception",
        request.url,
      ),
    );
  }
}
