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
    const supabase = createAdminClient();
    await supabase.from("site_settings").upsert({
      key: "google_integration_tokens",
      value: {
        ...data,
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
