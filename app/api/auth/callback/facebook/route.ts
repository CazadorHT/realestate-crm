
import { NextRequest, NextResponse } from "next/server";
import { metaConfig } from "@/lib/meta-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptValue } from "@/features/site-settings/actions";

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

  let tenantId: string | null = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vccasset.com";
    const redirectUri = `${baseUrl}/api/auth/callback/facebook`;

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
      const pageName = pagesData.data[0].name;

      console.log(`[Facebook Callback] Mapping page: ${pageName} (${pageId})`);

      // Fetch user info/session to get tenant_id
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
        console.warn("Could not retrieve user context in Facebook callback, falling back to null", err);
      }

      const supabase = createAdminClient();
      const updates = [
        { key: "meta_page_access_token", value: pageToken },
        { key: "meta_page_id", value: pageId },
        { key: "meta_page_name", value: pageName },
        { key: "meta_user_access_token", value: userAccessToken },
      ];

      for (const update of updates) {
        const { data: existing } = await supabase
          .from("site_settings")
          .select("tenant_id, category")
          .eq("key", update.key)
          .limit(1)
          .maybeSingle();

        const rowTenantId = existing?.tenant_id ?? tenantId ?? null;
        const category = existing?.category || "general";

        await supabase.from("system_settings_v3").upsert({
          tenant_id: rowTenantId,
          category,
          key: update.key,
          value: (await encryptValue(update.key, update.value)) as any,
          updated_at: new Date().toISOString(),
        }, { onConflict: "tenant_id,category,key" });
      }
    } else {
      console.warn("[Facebook Callback] No pages found or pages request failed for this user token:", pagesData);
      return NextResponse.redirect(
        new URL(
          "/protected/settings?tab=social&error=facebook_no_pages_found",
          request.url,
        ),
      );
    }

    const { revalidatePath, revalidateTag } = await import("next/cache");
    revalidatePath("/protected/settings");
    revalidateTag("site-settings", "hours");
    if (tenantId) {
      revalidateTag(`site-settings-${tenantId}`, "hours");
    }

    return NextResponse.redirect(
      new URL(
        "/protected/settings?tab=social&success=facebook_connected",
        request.url,
      ),
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
