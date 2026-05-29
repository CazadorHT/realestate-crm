import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifySignupAction } from "@/features/audit/actions";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run identical signup identity logic to ensure DB tables are ready
    const { data: existingIdentity } = await supabase
      .from("identities_v3")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existingIdentity) {
      console.log(`[Auth Sync API] Creating identities_v3 record for OAuth user: ${user.id}`);
      
      // 1. Insert identity record
      await supabase.from("identities_v3").insert({
        id: user.id,
        role: "AGENT", 
        category: 1,  
      });

      // 2. Logging and Audit Trail
      await notifySignupAction(
        user.email || user.user_metadata?.email || "Unknown OAuth User",
        user.id,
        {
          full_name: user.user_metadata?.full_name || user.user_metadata?.name,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture
        }
      );

      // 3. Auto-Tenant Assignment
      const { data: membership } = await supabase
        .from("tenant_members_v3")
        .select("id")
        .eq("identity_id", user.id)
        .maybeSingle();

      if (!membership) {
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
          await supabase.from("tenant_members_v3").insert({
            tenant_id: targetTenantId,
            identity_id: user.id,
            role: "AGENT", 
          });
          
          // Sync App Metadata to Auth schema
          try {
            const adminSupabase = createAdminClient();
            await adminSupabase.auth.admin.updateUserById(user.id, {
              app_metadata: {
                tenant_id: targetTenantId,
                role: "AGENT"
              }
            });
            console.log(`✅ [Auth Sync API] Metadata synced for user ${user.id}`);
          } catch (syncErr) {
            console.error("❌ [Auth Sync API] Metadata sync error:", syncErr);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ [Auth Sync API] Exception error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
