import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { ProfileAvatar } from "@/features/profile/ProfileAvatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Shield,
  User as UserIcon,
  Globe,
  MapPin,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { UserRoleBadge } from "@/features/users/UserRoleBadge";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Check Admin Permission
  const currentProfile = await getCurrentProfile();
  if (currentProfile?.role !== "ADMIN") {
    return redirect("/protected");
  }

  // 2. Fetch User Data
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !profile) {
    return notFound();
  }

  // 3. User initials for fallback
  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <div className="max-w-7xl mx-auto p-4  space-y-8">
      {/* Back Button & Header */}
      <div className="flex flex-col gap-4">
         <Breadcrumb
        backHref={`/protected/settings/users`}
        items={[
          { label: "ผู้ใช้งาน", href: "/protected/settings/users" },
          {
            label: `รายละเอียดผู้ใช้งาน ${profile.full_name}`,
            href: `/protected/settings/users/${id}`,
          },
        ]}
        className="mb-4"
      />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              ข้อมูลผู้ใช้งาน
            </h1>
            <p className="text-slate-500">
              รายละเอียดและข้อมูลการติดต่อของสมาชิทีม
            </p>
          </div>
          <UserRoleBadge role={profile.role} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="overflow-hidden border-none shadow-xl bg-white ring-1 ring-slate-200">
            <div className="h-32 bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600" />
            <CardContent className="pt-0 relative px-8 pb-8">
              <div className="-mt-16 mb-6 flex justify-center">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-2xl">
                    <AvatarImage
                      src={profile.avatar_url || ""}
                      alt={profile.full_name || ""}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-blue-50 text-blue-600 text-3xl font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                </div>
              </div>

              <div className="text-center space-y-4">
                <div>
                  <h2 className="text-2xl font-medium text-slate-900">
                    {profile.full_name || "ไม่ระบุชื่อ"}
                  </h2>
                  <p className="text-sm text-slate-400 font-medium">
                    #{profile.id.slice(0, 8)}
                  </p>
                </div>

                <Separator className="bg-slate-100" />

                <div className="grid grid-cols-1 gap-3 text-left">
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">
                      {profile.email || "ไม่มีข้อมูลอีเมล"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">
                      {profile.phone || "ไม่มีข้อมูลเบอร์โทร"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">
                        เข้าร่วมระบบเมื่อ
                      </span>
                      <span className="text-sm font-medium italic">
                        {formatDate(profile.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Social Information */}
          <Card className="border-none shadow-sm bg-slate-50/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-xl">
                  ข้อมูลการติดต่อ (Social)
                </CardTitle>
              </div>
              <CardDescription>
                ช่องทางสำหรับการสื่อสารและการประสานงาน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: "Line ID", value: profile.line_id, icon: "LINE" },
                  {
                    label: "Facebook",
                    value: profile.facebook_url,
                    icon: "FB",
                  },
                  { label: "WhatsApp", value: profile.whatsapp_id, icon: "WA" },
                  { label: "WeChat", value: profile.wechat_id, icon: "WC" },
                ].map((social) => (
                  <div
                    key={social.label}
                    className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-xs flex flex-col gap-1"
                  >
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                      {social.label}
                    </span>
                    <span className="font-medium text-slate-700 text-sm">
                      {social.value || "ไม่ได้ระบุ"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-xl">
                  ข้อมูลการเข้าใช้งานระบบ
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">
                      บทบาทในปัจจุบัน
                    </h4>
                    <p className="text-xs text-slate-400">
                      กำหนดสิทธิ์การเข้าถึงข้อมูลและเครื่องมือต่างๆ
                    </p>
                  </div>
                </div>
                <UserRoleBadge role={profile.role} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group relative flex flex-col gap-3 p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-50 transition-all duration-300">
                  <div className="flex items-center justify-between pointer-events-none">
                    <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-widest px-2 py-0.5 bg-emerald-100/50 rounded-full">
                      สถานะบัญชี
                    </span>
                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-600 transform group-hover:scale-110 transition-transform">
                      <UserCheck className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-medium text-emerald-900 leading-tight">
                      เปิดใช้งาน (Active)
                    </h4>
                    <p className="text-xs text-emerald-600/70 font-medium">
                      สมาชิทีมของคุณพร้อมทำงานแล้ว
                    </p>
                  </div>
                </div>

                <div className="group relative flex flex-col gap-3 p-5 rounded-2xl bg-blue-50/50 border border-blue-100 hover:bg-blue-50 transition-all duration-300">
                  <div className="flex items-center justify-between pointer-events-none">
                    <span className="text-[10px] font-medium text-blue-600 uppercase tracking-widest px-2 py-0.5 bg-blue-100/50 rounded-full">
                      การยืนยันตัวตน
                    </span>
                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 transform group-hover:scale-110 transition-transform">
                      <Shield className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-medium text-blue-900 leading-tight">
                      อีเมลยืนยันแล้ว
                    </h4>
                    <p className="text-xs text-blue-600/70 font-medium font-mono">
                      Verified Account
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
