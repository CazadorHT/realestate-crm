import { NextRequest, NextResponse } from "next/server";
import { googleConfig } from "@/lib/google-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptValue } from "@/features/site-settings/actions";
import { getBaseUrl } from "@/lib/utils";

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
    const baseUrl = getBaseUrl(request);
    const redirectUri = `${baseUrl}/api/auth/callback/google`;

    const url = "https://oauth2.googleapis.com/token";
    const values = {
      code,
      client_id: googleConfig.clientId,
      client_secret: googleConfig.clientSecret,
      redirect_uri: redirectUri,
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

    // Fetch user info/session to get tenant_id
    let tenantId: string | null = null;
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const client = await createClient();
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        const { data: identity } = await client
          .from("identities_v3")
          .select("tenant_id")
          .eq("id", user.id)
          .maybeSingle();
        if (identity?.tenant_id) {
          tenantId = identity.tenant_id;
        }
      }
    } catch (err) {
      console.warn("Could not retrieve user context in Google callback, falling back to null", err);
    }

    const supabase = createAdminClient();
    const configKey = "google_integration_tokens";
    const configValue = {
      ...data,
      email,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("site_settings")
      .select("tenant_id, category")
      .eq("key", configKey)
      .limit(1)
      .maybeSingle();

    const rowTenantId = existing?.tenant_id ?? tenantId ?? null;
    const category = existing?.category || "general";

    await supabase.from("system_settings_v3").upsert({
      tenant_id: rowTenantId,
      category,
      key: configKey,
      value: (await encryptValue(configKey, configValue)) as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: "tenant_id,category,key" });

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
