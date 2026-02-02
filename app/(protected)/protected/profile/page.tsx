import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { ProfileAvatar } from "@/features/profile/ProfileAvatar";
import { ProfileInfoForm } from "@/features/profile/ProfileInfoForm";
import { AccountSecurityCard } from "@/features/profile/AccountSecurityCard";
import { NotificationSettings } from "@/features/profile/NotificationSettings";
import { AdminTeamCard } from "@/features/profile/AdminTeamCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

  const isAdmin = profile.role === "ADMIN";

  return (
    <div className="mx-auto  space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-linear-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
          โปรไฟล์ของฉัน
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          จัดการข้อมูลส่วนตัว ความปลอดภัย และการตั้งค่าบัญชี
        </p>
      </div>

      <Separator className="my-6" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Identity & Settings (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Identity Card */}
          <Card className="overflow-hidden border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="h-24 bg-linear-to-r from-blue-600 to-indigo-600 opacity-90"></div>
            <CardContent className="pt-0 relative px-6 pb-6">
              <div className="-mt-12 mb-4 flex justify-center">
                <ProfileAvatar
                  avatarUrl={profile.avatar_url}
                  fullName={profile.full_name}
                />
              </div>
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {profile.full_name || "ไม่ระบุชื่อ"}
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {profile.role || "USER"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Security */}
          <AccountSecurityCard />

          {/* Admin Team (If Admin) */}
          {isAdmin && (
            <AdminTeamCard
              currentRole={profile.role || "AGENT"}
              isViewingOwnProfile={true}
            />
          )}
        </div>

        {/* Right Column - Forms (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Profile Information */}
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                ข้อมูลส่วนตัว
              </CardTitle>
              <CardDescription>
                อัปเดตข้อมูลรายละเอียดของคุณเพื่อใช้ในการติดต่อ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileInfoForm
                fullName={profile.full_name}
                phone={profile.phone}
                line_id={profile.line_id}
                facebook_url={profile.facebook_url}
                whatsapp_id={profile.whatsapp_id}
                wechat_id={profile.wechat_id}
                email={profile.email}
                role={profile.role}
              />
            </CardContent>
          </Card>

          {/* Section 3: Notification Preferences */}
          <NotificationSettings
            initialSettings={profile.notification_preferences}
          />
        </div>
      </div>
    </div>
  );
}
