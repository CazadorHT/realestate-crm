"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  Calendar,
  Shield,
  Globe,
  UserCheck,
  Building2,
  Zap,
  Activity,
  ShieldAlert,
  Settings,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { UserRoleBadge } from "@/features/users/UserRoleBadge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { TenantMembershipCard } from "@/features/profile/TenantMembershipCard";
import { type TenantMembership } from "@/features/profile/types";
import { ProfileCompleteness } from "@/features/profile/ProfileCompleteness";
import { useLanguage } from "@/lib/i18n/language-context";

interface UserDetailViewProps {
  id: string;
  profile: any;
  memberships: TenantMembership[];
  isMultiTenant: boolean;
  score: number;
}

export function UserDetailView({
  id,
  profile,
  memberships,
  isMultiTenant,
  score,
}: UserDetailViewProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <div className="relative min-h-[calc(100vh-12rem)] pb-20 overflow-visible">
      {/* Immersive Background Layer */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-100/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-100/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Breadcrumb & Command Header */}
        <div className="flex flex-col gap-6">
          <Breadcrumb
            backHref="/protected/settings/users"
            items={[
              { label: isEn ? "User Management" : "จัดการผู้ใช้", href: "/protected/settings/users" },
              {
                label: isEn ? `Profile: ${profile.full_name}` : `โปรไฟล์: ${profile.full_name}`,
                href: `/protected/settings/users/${id}`,
              },
            ]}
          />

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/40 backdrop-blur-xl border border-white/40 p-8 rounded-3xl shadow-xl shadow-slate-200/50">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
                  <Shield className="h-6 w-6" />
                </div>
                <div className="h-10 w-[2px] bg-slate-200 rounded-full mx-1" />
                <div className="space-y-0.5">
                  <h1 className="text-3xl font-semibold tracking-tight bg-linear-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    USER COMMAND CENTER
                  </h1>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] pl-0.5">
                    Identity & Access Management
                  </p>
                </div>
              </div>
              <p className="text-slate-500 font-medium max-w-xl leading-relaxed italic">
                {isEn ? (
                  <>Inspecting account profile for <span className="text-slate-900 font-bold not-italic">{profile.full_name || "Unnamed"}</span>. You can manage permissions and security here.</>
                ) : (
                  <>กำลังตรวจสอบข้อมูลของ <span className="text-slate-900 font-bold not-italic">{profile.full_name || "ไม่ทราบชื่อ"}</span> คุณสามารถจัดการสิทธิ์และความปลอดภัยได้จากหน้านี้</>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ProfileCompleteness score={score} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="relative group rounded-3xl overflow-hidden bg-white/70 backdrop-blur-md border border-white/40 shadow-2xl shadow-slate-200/50">
              <div className="h-32 bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Zap className="h-24 w-24 text-white" />
                </div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
              </div>

              <CardContent className="px-6 pb-8 text-center relative">
                <div className="-mt-16 mb-6 flex justify-center">
                  <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-white shadow-2xl ring-1 ring-slate-100">
                      <AvatarImage
                        src={profile.avatar_url || ""}
                        alt={profile.full_name || ""}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-slate-50 text-slate-300 text-3xl font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-emerald-500 border-4 border-white shadow-lg animate-pulse" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-wider">
                      {profile.full_name || (isEn ? "Unnamed" : "ไม่ระบุชื่อ")}
                    </h2>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <UserRoleBadge role={profile.role} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                        ID: {profile.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 text-left p-4 bg-white/50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="h-8 w-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 border border-slate-100">
                        <Mail className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-semibold truncate">
                        {profile.email || (isEn ? "No email provided" : "ไม่มีข้อมูลอีเมล")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="h-8 w-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 border border-slate-100">
                        <Phone className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-semibold">
                        {profile.phone || (isEn ? "No phone provided" : "ไม่มีข้อมูลเบอร์โทร")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="h-8 w-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 border border-slate-100">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-slate-400 leading-none mb-1 tracking-widest">
                          Joined System
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {formatDate(profile.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Quick Actions */}
            <Card className="rounded-3xl border border-white/40 bg-white/60 backdrop-blur-md shadow-xl shadow-slate-200/40 overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-slate-600" />
                  <CardTitle className="text-sm font-bold text-slate-900">
                    {isEn ? "Admin Control Panel" : "แผงควบคุมแอดมิน"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Button className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-2 shadow-lg shadow-slate-900/20 transition-all active:scale-95">
                  <Activity className="h-4 w-4" />
                  <span>{isEn ? "Refresh Insights" : "ปรับปรุงข้อมูลเชิงลึก"}</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl border-slate-200 font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all active:scale-95"
                >
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  {isEn ? "Suspend User Temporarily" : "ระงับการใช้งานชั่วคราว"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Profile Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Branch Management Section */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl shadow-slate-200/40 overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                      {isEn ? "Branch & Team Membership" : "การสังกัดสาขาและทีม"}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      Branch Membership & Assignments
                    </p>
                  </div>
                </div>
                {!isMultiTenant && (
                  <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {isEn ? "Multi-Branch Disabled" : "ระบบสาขาปิดอยู่"}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-8">
                {isMultiTenant ? (
                  <TenantMembershipCard memberships={memberships} />
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                    <Building2 className="h-12 w-12 text-slate-200 mb-4" />
                    <h4 className="font-semibold text-slate-500">
                      {isEn ? "Single Branch Mode Active" : "ปิดระบบสาขาอยู่"}
                    </h4>
                    <p className="text-sm text-slate-400 max-w-xs mt-1">
                      {isEn 
                        ? "The system is currently running in single-tenant mode." 
                        : "ขณะนี้ระบบทำงานในโหมดสาขาเดียว จึงไม่มีการจัดการข้อมูลสาขาแยกส่วน"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Social Information - Elite Refinement */}
            <Card className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-md shadow-xl shadow-slate-200/40 overflow-hidden">
              <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-xl font-bold">
                    {isEn ? "Contact & Social Channels" : "ข้อมูลการติดต่อ (Social)"}
                  </CardTitle>
                </div>
                <CardDescription className="font-medium">
                  {isEn ? "Channels for team communication and coordination" : "ช่องทางสำหรับการสื่อสารและการประสานงานทีม"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Line ID", value: profile.line_id },
                    { label: "Facebook", value: profile.facebook_url },
                    { label: "WhatsApp", value: profile.whatsapp_id },
                    { label: "WeChat", value: profile.wechat_id },
                  ].map((social) => (
                    <div
                      key={social.label}
                      className="group bg-white/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                          {social.label}
                        </span>
                        <span className="font-bold text-slate-700">
                          {social.value || "—"}
                        </span>
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <Activity className="h-4 w-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Account Status Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none mb-1">
                    Account Status
                  </p>
                  <p className="text-xl font-bold text-emerald-900">
                    Active & Ready
                  </p>
                </div>
              </div>
              <div className="p-6 rounded-3xl bg-blue-50/50 border border-blue-100 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none mb-1">
                    Verification
                  </p>
                  <p className="text-xl font-bold text-blue-900">
                    Verified Identity
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
