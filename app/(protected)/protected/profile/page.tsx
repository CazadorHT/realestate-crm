import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";

export const metadata: Metadata = {
  title: "โปรไฟล์",
  description: "จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชี",
};
import { ProfileAvatar } from "@/features/profile/ProfileAvatar";
import { ProfileInfoForm } from "@/features/profile/ProfileInfoForm";
import { AccountSecurityCard } from "@/features/profile/AccountSecurityCard";
import { NotificationSettings } from "@/features/profile/NotificationSettings";
import { TenantMembershipCard } from "@/features/profile/TenantMembershipCard";
import { RolePermissionsNote } from "@/features/profile/RolePermissionsNote";
import { AdminTeamCard } from "@/features/profile/AdminTeamCard";
import { ProfileCompleteness } from "@/features/profile/ProfileCompleteness";
import { calculateProfileScore } from "@/lib/profile-utils";
import { type TenantMembership } from "@/features/profile/types";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Fingerprint, LayoutDashboard, ShieldCheck, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";


export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="text-center text-red-500">
        เกิดข้อผิดพลาดในการโหลดข้อมูลโปรไฟล์
      </div>
    );
  }

  // Fetch branch memberships with strict typing
  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("role, tenant:tenants(id, name)")
    .eq("profile_id", profile.id);

  const isAdmin = profile.role === "ADMIN";
  
  // Calculate completeness score using the centralized engine
  const scoreClamped = calculateProfileScore(profile);

  return (
    <div className="relative max-w-7xl mx-auto min-h-[calc(100vh-12rem)] pb-20">
      {/* Immersive Background Layer */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Elite Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/40 backdrop-blur-xl border border-white/40 p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <div className="p-2.5 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
                  <LayoutDashboard className="h-6 w-6" />
               </div>
               <div className="h-10 w-[2px] bg-slate-200 rounded-full mx-1" />
               <div className="space-y-0.5">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">
                    MY PROFILE
                  </h1>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] pl-0.5">
                    Workspace Identity
                  </p>
               </div>
            </div>
            <p className="text-slate-500 font-medium max-w-md leading-relaxed">
              ยินดีต้อนรับคุณ <span className="text-slate-900 font-bold underline underline-offset-4 decoration-blue-500/30">{profile.full_name || "Agent"}</span> จัดการข้อมูลตัวตน ความปลอดภัย และการแจ้งเตือนสิทธิ์การใช้งานของคุณได้ที่นี่
            </p>
          </div>

          {/* Completeness Gimmick (Client Component) */}
          <ProfileCompleteness score={scoreClamped} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          {/* Left Column - Presence & Identity (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Elite Profile Card */}
            <div className="relative group rounded-3xl overflow-hidden bg-white/70 backdrop-blur-md border border-white/40 shadow-2xl shadow-slate-200/50">
              <div className="h-32 bg-linear-to-br from-blue-400 via-indigo-400 to-indigo-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Zap className="h-24 w-24 text-white" />
                </div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
              </div>
              
              <div className="px-6 pb-8 text-center relative">
                <div className="-mt-20 mb-6 inline-block">
                  <ProfileAvatar
                    avatarUrl={profile.avatar_url}
                    fullName={profile.full_name}
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-wider">
                      {profile.full_name || "ไม่ระบุชื่อ"}
                    </h2>
                    <div className="flex items-center justify-center gap-2 mt-1">
                       <Trophy className="h-3.5 w-3.5 text-amber-500" />
                       <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">Verified {profile.role || "USER"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100/50 flex items-center gap-3 transition-all hover:bg-blue-50">
                      <div className="shrink-0 p-2 rounded-xl bg-blue-100 text-blue-600">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div className="text-left overflow-hidden">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                        <p className="text-[11px] font-black text-blue-600 uppercase truncate">Verified</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 flex items-center gap-3 transition-all hover:bg-indigo-50">
                      <div className="shrink-0 p-2 rounded-xl bg-indigo-100 text-indigo-600">
                        <Fingerprint className="h-4 w-4" />
                      </div>
                      <div className="text-left overflow-hidden">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Access</p>
                        <p className="text-[11px] font-black text-indigo-600 uppercase truncate">{profile.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Security - Premium Redesign */}
            <AccountSecurityCard />

            {/* Branch Memberships */}
            <TenantMembershipCard memberships={(memberships as TenantMembership[]) || []} />

            {/* Role Permissions Note */}
            <RolePermissionsNote />
            
            {/* Admin Team (If Admin) */}
            {isAdmin && (
              <AdminTeamCard
                currentRole={profile.role || "AGENT"}
                isViewingOwnProfile={true}
              />
            )}
          </div>

          {/* Right Column - High Performance Forms (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Section 1: Profile Information */}
            <ProfileInfoForm
              fullName={profile.full_name}
              phone={profile.phone}
              line_id={profile.line_id}
              line_user_id={profile.line_user_id}
              facebook_url={profile.facebook_url}
              whatsapp_id={profile.whatsapp_id}
              wechat_id={profile.wechat_id}
              email={profile.email}
              role={profile.role}
              tax_id={profile.tax_id}
              tax_address={profile.tax_address}
              telegram_id={profile.telegram_id}
              score={scoreClamped}
            />

            {/* Section 3: Notification Preferences */}
            <NotificationSettings
              initialSettings={profile.notification_preferences}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
