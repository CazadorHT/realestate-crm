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
      <div className="p-8 text-center text-red-500">
        เกิดข้อผิดพลาดในการโหลดข้อมูลโปรไฟล์
      </div>
    );
  }

  const isAdmin = profile.role === "ADMIN";

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">โปรไฟล์ของฉัน</h1>
        <p className="text-muted-foreground">
          จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชี
        </p>
      </div>

      <Separator />

      {/* Section 1: Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลโปรไฟล์</CardTitle>
          <CardDescription>
            อัปเดตข้อมูลส่วนตัวและรูปโปรไฟล์ของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <ProfileAvatar
            avatarUrl={profile.avatar_url}
            fullName={profile.full_name}
          />

          <Separator />

          <ProfileInfoForm
            fullName={profile.full_name}
            phone={(profile as any).phone}
            email={profile.email}
            role={profile.role}
          />
        </CardContent>
      </Card>

      {/* Section 2: Account & Security */}
      <AccountSecurityCard />

      {/* Section 3: Notification Preferences */}
      <NotificationSettings />

      {/* Section 4: Admin Team & Role Management (Admin Only) */}
      {isAdmin && (
        <AdminTeamCard
          currentRole={profile.role || "AGENT"}
          isViewingOwnProfile={true}
        />
      )}
    </div>
  );
}
