import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { notifySignupAction } from "@/features/audit/actions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/protected";

  const supabase = await createClient();

  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error && data?.user) {
      await handleNewSignup(supabase, data.user);
      return redirect(next);
    } else {
      return redirect(
        `/auth/error?error=${encodeURIComponent(error?.message || "Verify OTP failed")}`,
      );
    }
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      await handleNewSignup(supabase, data.user);
      return redirect(next);
    } else {
      console.error("Supabase Auth Code Exchange Error:", error);
      return redirect(
        `/auth/error?error=${encodeURIComponent(error?.message || "Code exchange failed")}`,
      );
    }
  }

  return redirect(
    `/auth/error?error=${encodeURIComponent("No token hash, type or code found")}`,
  );
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

    // 🛡️ [AUTO-TENANT ASSIGNMENT]
    const { data: membership } = await supabase
      .from("tenant_members")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!membership) {
      try {
        const { getSystemConfig } = await import("@/lib/actions/system-config");
        const config = await getSystemConfig();
        let targetTenantId = config.default_tenant_id;

        if (!targetTenantId) {
          const { data: firstTenant } = await supabase
            .from("tenants")
            .select("id")
            .eq("is_deleted", false)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();
          
          if (firstTenant) targetTenantId = firstTenant.id;
        }

        if (targetTenantId) {
          await supabase.from("tenant_members").insert({
            tenant_id: targetTenantId,
            profile_id: user.id,
            role: "AGENT", 
          });
          
          // 🛡️ [SYNC TO AUTH METADATA]
          try {
            const { createAdminClient } = await import("@/lib/supabase/admin");
            const adminSupabase = createAdminClient();
            await adminSupabase.auth.admin.updateUserById(user.id, {
              app_metadata: {
                tenant_id: targetTenantId,
                role: "AGENT"
              }
            });
            console.log(`✅ [AuthSync] Initial metadata set for user ${user.id}`);
          } catch (syncErr) {
            console.error("❌ [AuthSync] Error:", syncErr);
          }

          console.log(`✅ [Auto-Tenant] User ${user.id} assigned to tenant ${targetTenantId}`);
        }
      } catch (err) {
        console.error("❌ [Auto-Tenant] Error:", err);
      }
    }
  }
}
