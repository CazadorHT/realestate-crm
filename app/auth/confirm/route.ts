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

  console.log("🔍 [Auth Confirm] Incoming Request URL:", request.url);
  console.log("🔍 [Auth Confirm] Search Params:", {
    token_hash: token_hash ? `${token_hash.substring(0, 8)}...` : null,
    type,
    code: code ? `${code.substring(0, 8)}...` : null,
  });

  const supabase = await createClient();

  // 1. Check if user is already logged in (concurrency recovery)
  const { data: { user: existingUser } } = await supabase.auth.getUser();
  if (existingUser) {
    console.log("✅ [Auth Confirm] User already authenticated via existing session");
    await handleNewSignup(supabase, existingUser);
    return redirect(await getSmartRedirect(supabase, existingUser.id));
  }

  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error && data?.user) {
      await handleNewSignup(supabase, data.user);
      return redirect(await getSmartRedirect(supabase, data.user.id));
    } else {
      // Check again if we got authenticated concurrently (e.g. by another request prefetching)
      const { data: { user: retryUser } } = await supabase.auth.getUser();
      if (retryUser) {
        console.log("✅ [Auth Confirm] Recovered: User authenticated concurrently");
        await handleNewSignup(supabase, retryUser);
        return redirect(await getSmartRedirect(supabase, retryUser.id));
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
      return redirect(await getSmartRedirect(supabase, data.user.id));
    } else {
      // Check again if we got authenticated concurrently
      const { data: { user: retryUser } } = await supabase.auth.getUser();
      if (retryUser) {
        console.log("✅ [Auth Confirm] Recovered: User authenticated concurrently");
        await handleNewSignup(supabase, retryUser);
        return redirect(await getSmartRedirect(supabase, retryUser.id));
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
 * 🛡️ Smart Redirect: ตรวจสอบสถานะ user เพื่อเลือก redirect ที่เหมาะสม
 * - User ที่ approved แล้ว (is_active + staff role) → /protected
 * - User ที่ยังรออนุมัติ → /auth/pending
 */
async function getSmartRedirect(supabase: any, userId: string): Promise<string> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active, role")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.is_active) {
      const role = (profile.role as string || "").toUpperCase();
      if (role === "ADMIN" || role === "AGENT" || role === "MANAGER" || role === "OWNER") {
        console.log(`✅ [Auth Confirm] User ${userId} is approved staff (${role}), redirecting to /protected`);
        return "/protected";
      }
    }
  } catch (err) {
    console.error("[Auth Confirm] Smart redirect check failed:", err);
  }
  
  return "/auth/pending";
}

/**
 * 🛡️ Helper to handle new signup logic (Logging + Identity Creation)
 * เช็คจาก identities_v3 โดยตรง — ไม่พึ่ง timing window
 */
async function handleNewSignup(supabase: any, user: any) {
  // 1. เช็คว่ามี identities_v3 record อยู่แล้วหรือยัง (แหล่งความจริงเดียว)
  const { data: existingIdentity } = await supabase
    .from("identities_v3")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  // ถ้ามี identity แล้ว = ไม่ใช่ user ใหม่ → ข้ามไป
  if (existingIdentity) {
    console.log(`[handleNewSignup] Identity already exists for user ${user.id}, skipping.`);
    return;
  }

  // 2. New user! → แจ้งเตือนแอดมิน
  console.log(`[handleNewSignup] New user detected: ${user.id}, processing signup...`);
  
  try {
    await notifySignupAction(
      user.email || user.user_metadata?.email || "Unknown OAuth User",
      user.id,
      {
        full_name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture
      }
    );
  } catch (notifyErr) {
    console.error("[handleNewSignup] Notification failed (non-blocking):", notifyErr);
  }

  // 3. สร้าง identities_v3 record ด้วย role = AGENT, is_active = false
  console.log(`[handleNewSignup] Creating identities_v3 record with AGENT role for new user: ${user.id}`);
  const { error: insertError } = await supabase.from("identities_v3").insert({
    id: user.id,
    role: "AGENT",
    category: 1,  
    is_active: false, // Must be approved by admin
    display_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    email: user.email || null,
  });

  if (insertError) {
    console.error("[handleNewSignup] Failed to create identities_v3:", insertError);
    return;
  }

  // 4. Sync profiles.role → AGENT (DB trigger สร้าง profiles ด้วย role = USER, ต้อง sync ให้ตรง)
  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({ role: "AGENT" })
    .eq("id", user.id);

  if (profileUpdateError) {
    console.error("[handleNewSignup] Failed to sync profiles.role to AGENT:", profileUpdateError);
  } else {
    console.log(`✅ [handleNewSignup] profiles.role synced to AGENT for user ${user.id}`);
  }

  // 5. Sync role: "AGENT" to auth.users app_metadata
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
