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
      console.log(`[Auth Sync API] Creating identities_v3 record with USER role for OAuth user: ${user.id}`);
      
      // 1. Insert identity record with default AGENT role and is_active: false
      await supabase.from("identities_v3").insert({
        id: user.id,
        role: "AGENT", 
        category: 1,  
        is_active: false,
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        email: user.email || null,
      });

      // Sync role: "AGENT" to auth.users metadata
      try {
        const adminSupabase = createAdminClient();
        await adminSupabase.auth.admin.updateUserById(user.id, {
          app_metadata: {
            role: "AGENT"
          }
        });
        console.log(`✅ [Auth Sync API] Initial AGENT metadata synced (is_active: false) for user ${user.id}`);
      } catch (syncErr) {
        console.error("❌ [Auth Sync API] Metadata sync error:", syncErr);
      }

      // 2. Logging and Audit Trail
      await notifySignupAction(
        user.email || user.user_metadata?.email || "Unknown OAuth User",
        user.id,
        {
          full_name: user.user_metadata?.full_name || user.user_metadata?.name,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ [Auth Sync API] Exception error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
