import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { ProfileHeaderBanner, ProfileIdentityCard } from "@/features/profile/ProfilePresenceHeader";
import { ProfileInfoForm } from "@/features/profile/ProfileInfoForm";
import { AccountSecurityCard } from "@/features/profile/AccountSecurityCard";
import { NotificationSettings } from "@/features/profile/NotificationSettings";
import { SocialIntegrationsCard } from "@/features/profile/SocialIntegrationsCard";
import { TenantMembershipCard } from "@/features/profile/TenantMembershipCard";
import { RolePermissionsNote } from "@/features/profile/RolePermissionsNote";
import { AdminTeamCard } from "@/features/profile/AdminTeamCard";
import { calculateProfileScore } from "@/lib/profile-utils";
import { type TenantMembership } from "@/features/profile/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile | Profile Management",
  description: "Manage your personal profile and account settings",
};

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
      <div className="text-center text-red-500 py-12">
        Error loading profile data / เกิดข้อผิดพลาดในการโหลดข้อมูลโปรไฟล์
      </div>
    );
  }

  // Fetch branch memberships with strict typing (V3)
  const { data: memberships } = await supabase
    .from("tenant_members_v3")
    .select("role, tenant:tenants_v3(id, name)")
    .eq("identity_id", profile.id);

  const isAdmin = profile.role === "ADMIN";
  
  // Calculate completeness score using the centralized engine
  const scoreClamped = calculateProfileScore(profile);

  return (
    <div className="relative max-w-screen-2xl mx-auto min-h-[calc(100vh-12rem)] pb-20">
      {/* Immersive Background Layer */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Full Width Top Header */}
        <ProfileHeaderBanner fullName={profile.full_name} score={scoreClamped} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          {/* Left Column - Presence & Identity (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <ProfileIdentityCard profile={profile} />

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
            {/* Section 4: Social Integrations */}
            <SocialIntegrationsCard
              metadata={profile.metadata}
            />
            {/* Section 1: Profile Information */}
            <ProfileInfoForm
              fullName={profile.full_name}
              nickname={profile.nickname}
              signature_url={profile.signature_url}
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
              bank_code={profile.bank_code}
              bank_account_no={profile.bank_account_no}
              bank_account_name={profile.bank_account_name}
              telegram_id={profile.telegram_id}
              wechat_user_id={profile.wechat_user_id}
              whatsapp_user_id={profile.whatsapp_user_id}
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
