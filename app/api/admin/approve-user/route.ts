import { createAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/lib/site-config";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { Database } from "@/lib/database.types.generated";

type UserRole = "ADMIN" | "MANAGER" | "AGENT" | "VIEWER";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const roleInput = searchParams.get("role");
  const token = searchParams.get("token");

  if (!userId || !token || !roleInput) {
    return new NextResponse("Invalid request", { status: 400 });
  }

  // Validate that the role input matches our V3 Enums
  const validRoles: UserRole[] = ["ADMIN", "MANAGER", "AGENT", "VIEWER"];
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

    // 🛡️ Strict V3 Type Extension (No any)
    interface V3ApproveRpc {
      Args: { target_user_id: string; new_role: string; actor_id: string };
      Returns: { success: boolean; tenant_id: string | null };
    }
    
    const { data: result, error: rpcError } = await (supabase as any).rpc("v3_approve_identity", {
      target_user_id: userId,
      new_role: role,
      actor_id: userId
    });

    if (rpcError) throw rpcError;

    const rpcResult = result as unknown as { success: boolean; tenant_id: string | null };
    const tenantId = rpcResult.tenant_id;

    // ✅ FIX 1: Sync profiles.is_active = true
    // หน้า /auth/pending เช็ค profiles.is_active ดังนั้นต้อง sync ด้วย
    const { error: profilesError } = await supabase
      .from("profiles")
      .update({ role: role, is_active: true })
      .eq("id", userId);
    if (profilesError) console.error("⚠️ [ProfileSyncError]", profilesError);
    else console.log(`✅ [ProfileSync] profiles.is_active=true synced for user ${userId}`);

    // ✅ FIX 2: Sync to Auth Metadata (The RLS Fast-Path)
    // Always sync regardless of tenantId — agent needs role in JWT claims
    const { error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      { 
        app_metadata: { 
          role: role,
          ...(tenantId ? { tenant_id: tenantId } : {})
        } 
      }
    );
    if (authError) console.error("⚠️ [AuthSyncError]", authError);
    else console.log(`✅ [AuthSync] Metadata updated for user ${userId}`);

    // 🔔 Send Push Notification inside the CRM to the agent
    try {
      await supabase.from("notifications_v3").insert({
        user_id: userId,
        type: "SYSTEM",
        title: "✅ บัญชีของคุณได้รับการอนุมัติแล้ว!",
        message: "ยินดีต้อนรับเข้าสู่ระบบ! บัญชีของคุณได้รับการปรับเป็น AGENT และพร้อมทำงานแล้วครับ 🚀",
        link: "/protected",
      });
      console.log(`✅ [LINE Approve] Push notification sent to user ${userId}`);
    } catch (notifErr) {
      console.error("❌ [LINE Approve] Failed to send push notification to agent:", notifErr);
    }

    // Return a beautiful success page (HTML)
    return new NextResponse(
      `
      <html>
        <head>
          <title>อนุมัติสำเร็จ</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; }
            .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); }
          </style>
        </head>
        <body class="bg-[#020617] text-white flex items-center justify-center min-h-screen">
          <div class="text-center p-10 glass rounded-[2.5rem] shadow-2xl max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-500">
            <div class="w-24 h-24 bg-linear-to-tr from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/20">
              <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 class="text-3xl font-black mb-3 tracking-tight">อนุมัติสำเร็จ!</h1>
            <p class="text-slate-400 text-base mb-10 leading-relaxed">บทบาทผู้ใช้งานถูกปรับเป็น <span class="text-emerald-400 font-bold">${role}</span><br/>พร้อมใช้งานระบบ V3 แล้วครับ</p>
            <a href="${siteConfig.url}/protected/users" class="block w-full py-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl font-bold transition-all shadow-xl shadow-blue-900/20 active:scale-95">
              เข้าสู่ระบบจัดการ
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
