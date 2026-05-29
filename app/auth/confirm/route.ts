import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";
import { notifySignupAction } from "@/features/audit/actions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/protected";

  console.log("🔍 [Auth Confirm] Incoming Request URL:", request.url);
  console.log("🔍 [Auth Confirm] Search Params:", {
    token_hash: token_hash ? `${token_hash.substring(0, 8)}...` : null,
    type,
    code: code ? `${code.substring(0, 8)}...` : null,
    next
  });

  const supabase = await createClient();

  // 1. Check if user is already logged in (concurrency recovery)
  const { data: { user: existingUser } } = await supabase.auth.getUser();
  if (existingUser) {
    console.log("✅ [Auth Confirm] User already authenticated via existing session");
    await handleNewSignup(supabase, existingUser);
    return redirect("/auth/pending");
  }

  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error && data?.user) {
      await handleNewSignup(supabase, data.user);
      return redirect("/auth/pending");
    } else {
      // Check again if we got authenticated concurrently (e.g. by another request prefetching)
      const { data: { user: retryUser } } = await supabase.auth.getUser();
      if (retryUser) {
        console.log("✅ [Auth Confirm] Recovered: User authenticated concurrently");
        await handleNewSignup(supabase, retryUser);
        return redirect("/auth/pending");
      }

      console.error("❌ [Auth Confirm] Verify OTP Error:", error);
      return redirect(
        `/auth/error?error=${encodeURIComponent(error?.message || "Verify OTP failed")}`,
      );
    }
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      await handleNewSignup(supabase, data.user);
      return redirect("/auth/pending");
    } else {
      // Check again if we got authenticated concurrently
      const { data: { user: retryUser } } = await supabase.auth.getUser();
      if (retryUser) {
        console.log("✅ [Auth Confirm] Recovered: User authenticated concurrently");
        await handleNewSignup(supabase, retryUser);
        return redirect("/auth/pending");
      }

      console.error("❌ [Auth Confirm] Supabase Auth Code Exchange Error:", error);
      return redirect(
        `/auth/error?error=${encodeURIComponent(error?.message || "Code exchange failed")}`,
      );
    }
  }

  console.warn("⚠️ [Auth Confirm] No token_hash/type or code found in URL params. Redirecting to client-side callback page to parse hash...");
  
  // ส่งไปหน้า Client-side เพื่อตรวจสอบ Token ใน Hash (#access_token=...)
  const clientRedirectUrl = new URL("/auth/confirm/callback", request.url);
  searchParams.forEach((value, key) => {
    clientRedirectUrl.searchParams.set(key, value);
  });
  return NextResponse.redirect(clientRedirectUrl);
}

/**
 * 🛡️ Helper to handle new signup logic (Logging + Auto-Tenant)
 */
async function handleNewSignup(supabase: any, user: any) {
  // 1. Check if it's a new signup
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const isNewSignup = !profile || (
    profile.created_at && 
    (new Date().getTime() - new Date(profile.created_at).getTime() < 30000)
  );

  if (isNewSignup) {
    await notifySignupAction(
      user.email || user.user_metadata?.email || "Unknown OAuth User",
      user.id,
      {
        full_name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture
      }
    );

    const { data: existingIdentity } = await supabase
      .from("identities_v3")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existingIdentity) {
      console.log(`[handleNewSignup] Creating identities_v3 record with AGENT role for new user: ${user.id}`);
      await supabase.from("identities_v3").insert({
        id: user.id,
        role: "AGENT", // Default role is AGENT now
        category: 1,  
        is_active: false, // Must be approved by admin
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        email: user.email || null,
      });

      // Sync role: "AGENT" to auth.users app_metadata
      try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const adminSupabase = createAdminClient();
        await adminSupabase.auth.admin.updateUserById(user.id, {
          app_metadata: {
            role: "AGENT"
          }
        });
        console.log(`✅ [AuthSync] Initial metadata set to AGENT for user ${user.id}`);
      } catch (syncErr) {
        console.error("❌ [AuthSync] Error syncing initial AGENT metadata:", syncErr);
      }
    }
  }
}
