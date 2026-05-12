import { createAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/lib/site-config";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { Database } from "@/lib/database.types";

type UserRole = Database["public"]["Enums"]["user_role"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const roleInput = searchParams.get("role");
  const token = searchParams.get("token");

  if (!userId || !token || !roleInput) {
    return new NextResponse("Invalid request", { status: 400 });
  }

  // Validate that the role input matches our Enums
  const validRoles: UserRole[] = ["ADMIN", "USER", "AGENT", "MANAGER"];
  if (!validRoles.includes(roleInput as UserRole)) {
    return new NextResponse("Invalid role specified", { status: 400 });
  }
  const role = roleInput as UserRole;

  // 🛡️ Verify Token (HMAC) to ensure the request is from our system
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback_secret";
  const expectedToken = crypto
    .createHmac("sha256", secret)
    .update(`${userId}:${role}`)
    .digest("hex");

  if (token !== expectedToken) {
    return new NextResponse("Unauthorized or Expired Token", { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    
    // 1. Update Profile Role
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ 
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (profileError) throw profileError;

    // 🛡️ 1.1 Sync to Auth Metadata (The RLS Fast-Path)
    // First, get the tenant_id for this user
    const { data: membership } = await supabase
      .from("tenant_members")
      .select("tenant_id")
      .eq("profile_id", userId)
      .maybeSingle();

    if (membership?.tenant_id) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        { 
          app_metadata: { 
            role: role,
            tenant_id: membership.tenant_id 
          } 
        }
      );
      if (authError) console.error("⚠️ [AuthSyncError]", authError);
      else console.log(`✅ [AuthSync] Metadata updated for user ${userId}`);
    }

    // 2. Log Activity (Strict Typing)
    const { error: auditError } = await supabase.from("audit_logs").insert({
      action: "ADMIN_APPROVE_USER",
      entity: "user",
      entity_id: userId,
      metadata: {
        new_role: role,
        tenant_id: membership?.tenant_id,
        method: "ONE_CLICK_APPROVAL"
      }
    });

    // Return a beautiful success page (HTML)
    return new NextResponse(
      `
      <html>
        <head>
          <title>อนุมัติสำเร็จ</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-[#020617] text-white flex items-center justify-center min-h-screen font-sans">
          <div class="text-center p-8 bg-white/5 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl max-w-sm w-full mx-4">
            <div class="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
              <span class="text-4xl">✅</span>
            </div>
            <h1 class="text-2xl font-bold mb-2">อนุมัติสำเร็จ!</h1>
            <p class="text-slate-400 text-sm mb-8">ผู้ใช้งานได้รับการปรับบทบาทเป็น <b>${role}</b> เรียบร้อยแล้วครับ</p>
            <a href="${siteConfig.url}/protected/users" class="inline-block w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20">
              ไปที่หน้าจัดการสมาชิก
            </a>
          </div>
        </body>
      </html>
      `,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (error) {
    console.error("[APPROVE_ERROR]", error);
    return new NextResponse("Failed to approve user", { status: 500 });
  }
}
