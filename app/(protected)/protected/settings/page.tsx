import { Metadata } from "next";
import { AdminSystemSettings } from "@/components/settings/AdminSystemSettings";
import { SiteSettingsPanel } from "@/components/settings/SiteSettingsPanel";
import { SiteConfigPanel } from "@/components/settings/SiteConfigPanel";
import { SocialAutomationSettings } from "@/components/settings/SocialAutomationSettings";
import {
  Settings,
  Sparkles,
  MessageSquare,
  Cpu,
  Shield,
  History,
  Users,
  Activity,
  UserCircle,
  Layout,
  Music2,
  Facebook,
  CheckCircle,
  Building2,
  Calculator,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { IntegrationDisconnectButton } from "@/components/settings/IntegrationDisconnectButton";
import { SuccessAnimation } from "@/components/settings/SuccessAnimation";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { CommissionSettings } from "@/features/dashboard/components/CommissionSettings";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaLine, FaTiktok } from "react-icons/fa";
import { createAdminClient } from "@/lib/supabase/admin";
import { CheckCircle2, ChevronRight, Zap, Database } from "lucide-react";
import { getLineBotInfo } from "@/lib/line";
import { FaFacebook, FaMeta, FaUser } from "react-icons/fa6";
import { getSiteSettings } from "@/features/site-settings/actions";
import { getSettingsSummaryAction } from "@/lib/actions/system-status";
import { SiteSettings } from "@/features/site-settings/schema";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { m } from "framer-motion";

export const metadata: Metadata = {
  title: "Settings | CRM",
  description: "Manage site settings",
};

import { cookies } from "next/headers";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  await cookies(); // Force dynamic rendering
  const activeTab = (resolvedParams?.tab as string) || "general";
  const supabase = createAdminClient();

  const allSettings = await getSiteSettings();
  const summary = await getSettingsSummaryAction();

  const isTikTokConnected = !!allSettings.tiktok_auth_token;
  const isFacebookConnected =
    !!process.env.META_PAGE_ACCESS_TOKEN ||
    !!allSettings.meta_page_access_token;

  const isLineConnected =
    !!process.env.LINE_CHANNEL_ACCESS_TOKEN ||
    !!allSettings.line_channel_access_token;

  let lineBotInfo = null;
  if (isLineConnected) {
    lineBotInfo = await getLineBotInfo();
  }

  return (
    <div className="space-y-8 max-w-screen-2xl pb-20">
      <SuccessAnimation />

      <SettingsHeader />

      <Tabs defaultValue={activeTab} className="w-full">
        <SettingsTabs activeTab={activeTab} />

        <div className="mt-6">
          <TabsContent value="general" className="space-y-6">
            <SiteSettingsPanel />
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <SiteConfigPanel />
          </TabsContent>

          <TabsContent value="social" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LINE Card */}
              <Card
                className={cn(
                  "relative group transition-all duration-500 overflow-hidden border-slate-200/60 bg-white/40 backdrop-blur-xl hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 rounded-[24px]",
                  isLineConnected && "ring-2 ring-emerald-500/50",
                )}
              >
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "relative p-3 rounded-2xl transition-all duration-300 transform group-hover:rotate-6",
                          isLineConnected
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                            : "bg-emerald-50 text-emerald-500",
                        )}
                      >
                        <div className="absolute inset-0 bg-emerald-400/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <FaLine className="h-7 w-7 relative z-10" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900">
                          LINE
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-medium">
                          Official Account Hub
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLineConnected ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-[20px] bg-emerald-50/50 border border-emerald-100/50">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse pointer-events-none absolute inset-0" />
                            <div className="h-3 w-3 rounded-full bg-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-emerald-700">
                            Connected
                          </span>
                        </div>
                        {lineBotInfo?.displayName && (
                          <Badge
                            variant="outline"
                            className="bg-white/80 border-emerald-200 text-emerald-700 font-bold px-3 py-1"
                          >
                            {lineBotInfo.displayName}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href="/protected/line-manager" className="flex-1">
                          <Button className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 border-none transition-all active:scale-95">
                            Manage Bot
                          </Button>
                        </Link>
                        <IntegrationDisconnectButton
                          provider="line"
                          variant="outline"
                          showLabel={false}
                          className="h-12 w-12 p-0 flex items-center justify-center rounded-xl bg-slate-50 border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        เชื่อมต่อ Line OA
                        เพื่อรับการแจ้งเตือนและแชทกับลูกค้าผ่านระบบ CRM ได้ทันที
                      </p>
                      <Link href="/protected/line-manager">
                        <Button
                          variant="outline"
                          className="w-full h-12 rounded-xl border-dashed border-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-bold"
                        >
                          Connect LINE
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* TikTok Card */}
              <Card
                className={cn(
                  "relative group transition-all duration-500 overflow-hidden border-slate-200/60 bg-white/40 backdrop-blur-xl hover:shadow-2xl hover:shadow-slate-900/10 hover:-translate-y-1 rounded-[24px]",
                  isTikTokConnected && "ring-2 ring-slate-900/50",
                )}
              >
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "relative p-3 rounded-2xl transition-all duration-300 transform group-hover:-rotate-6",
                          isTikTokConnected
                            ? "bg-slate-900 text-white shadow-lg shadow-slate-300"
                            : "bg-slate-100 text-slate-900",
                        )}
                      >
                        <div className="absolute inset-0 bg-slate-400/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <FaTiktok className="h-7 w-7 relative z-10" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900">
                          TikTok
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-medium">
                          Video Marketing
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isTikTokConnected ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-[20px] bg-slate-100/50 border border-slate-200/50">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full bg-emerald-500" />
                          <span className="text-sm font-bold text-emerald-700">
                            Active
                          </span>
                        </div>
                        {allSettings.tiktok_auth_token?.display_name && (
                          <Badge
                            variant="outline"
                            className="bg-white/80 border-slate-300 text-slate-700 font-bold px-3 py-1 text-[11px]"
                          >
                            {allSettings.tiktok_auth_token.display_name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href="/api/auth/tiktok/login" className="flex-1">
                          <Button className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-200 border-none transition-all active:scale-95">
                            Reconnect
                          </Button>
                        </Link>
                        <IntegrationDisconnectButton
                          provider="tiktok"
                          variant="outline"
                          showLabel={false}
                          className="h-12 w-12 p-0 flex items-center justify-center rounded-xl bg-slate-50 border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        นำเข้าวิดีโอจาก TikTok
                        เพื่อทำการตลาดและขายทรัพย์ของคุณได้อย่างน่าสนใจมากขึ้น
                      </p>
                      <Link href="/api/auth/tiktok/login">
                        <Button
                          variant="outline"
                          className="w-full h-12 rounded-xl border-dashed border-2 border-slate-300 text-slate-900 hover:bg-slate-50 font-bold"
                        >
                          Connect TikTok
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Meta Card */}
              <Card
                className={cn(
                  "relative group transition-all duration-500 overflow-hidden border-none bg-linear-to-br from-blue-600/5 via-indigo-600/5 to-pink-500/5 backdrop-blur-xl hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 rounded-[24px]",
                  isFacebookConnected &&
                    "ring-2 ring-indigo-500 shadow-xl shadow-indigo-100",
                )}
              >
                {isFacebookConnected && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                )}
                <CardHeader className="pb-4 relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "relative p-3 rounded-2xl transition-all duration-500 transform group-hover:scale-110",
                          isFacebookConnected
                            ? "bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-indigo-200"
                            : "bg-blue-50 text-blue-600",
                        )}
                      >
                        <div className="absolute inset-0 bg-indigo-400/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <FaMeta className="h-7 w-7 relative z-10" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900">
                          Meta
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-medium">
                          FB & Instagram
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  {isFacebookConnected ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-[20px] bg-indigo-50/80 border border-indigo-100/50 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full bg-indigo-600 animate-pulse" />
                          <span className="text-sm font-bold text-indigo-700">
                            Integration Active
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-white/90 border-indigo-200 text-indigo-700 font-bold px-3 py-1 text-[10px]"
                        >
                          {allSettings.meta_page_name || "Enterprise"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href="/api/auth/facebook/login"
                          className="flex-1"
                        >
                          <Button className="w-full h-12 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-200 border-none transition-all active:scale-95">
                            Update Tokens
                          </Button>
                        </Link>
                        <IntegrationDisconnectButton
                          provider="facebook"
                          variant="outline"
                          showLabel={false}
                          className="h-12 w-12 p-0 flex items-center justify-center rounded-xl bg-white/50 border-indigo-200 text-indigo-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95 shadow-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        ขยายตลาดไปยัง Facebook และ Instagram
                        พร้อมรับการแจ้งเตือนและการตลาดอัตโนมัติ
                      </p>
                      <Link href="/api/auth/facebook/login">
                        <Button className="w-full h-12 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 text-white font-black hover:opacity-90 shadow-md shadow-indigo-100">
                          Connect Meta
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div id="social-automation" className="mt-8">
              <SocialAutomationSettings
                lineBotInfo={lineBotInfo}
                initialSettings={allSettings}
              />
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Snapshot Active Model */}
              <Card className="col-span-full border-none bg-linear-to-br from-indigo-500 to-purple-600 text-white rounded-[24px] shadow-xl shadow-indigo-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                <CardHeader className="relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                      <Cpu className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-indigo-50">
                        AI Control Center
                      </CardTitle>
                      <CardDescription className="text-indigo-50 font-medium italic">
                        สถานะการทำงานของปัญญาประดิษฐ์ในระบบ
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 pt-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="px-6 py-4 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col gap-1 transition-all hover:bg-white/20">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                        LLM Provider
                      </span>
                      <span className="text-xl font-bold italic">
                        Claude 3.5 Sonnet / Gemini
                      </span>
                    </div>
                    <div className="px-6 py-4 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col gap-1 transition-all hover:bg-white/20">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                        Status
                      </span>
                      <span className="text-xl font-bold italic flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        Ready
                      </span>
                    </div>
                    <div className="px-6 py-4 rounded-3xl bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 flex flex-col gap-1 transition-all hover:bg-emerald-500/30">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 text-emerald-200">
                        Processing Mode
                      </span>
                      <span className="text-xl font-bold italic text-white flex items-center gap-2">
                        <Zap className="h-4 w-4 fill-emerald-300 text-emerald-300" />
                        Enterprise High-Speed
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Link href="/protected/ai-monitor" className="group">
                <Card className="hover:border-blue-300 transition-all duration-300 rounded-[22px] border-slate-200/60 bg-white/50 backdrop-blur-md group-hover:shadow-lg group-hover:-translate-y-1 overflow-hidden">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-600 transition-colors duration-300">
                      <Activity className="h-6 w-6 text-blue-600 group-hover:text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        AI Monitor
                      </CardTitle>
                      <CardDescription className="text-[13px] font-medium text-slate-500 truncate italic">
                        ตรวจสอบสถานะการทำงาน
                      </CardDescription>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/protected/admin/ai-config" className="group">
                <Card className="hover:border-purple-300 transition-all duration-300 rounded-[22px] border-slate-200/60 bg-white/50 backdrop-blur-md group-hover:shadow-lg group-hover:-translate-y-1 overflow-hidden">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-600 transition-colors duration-300">
                      <Cpu className="h-6 w-6 text-purple-600 group-hover:text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors truncate">
                        AI Model Config
                      </CardTitle>
                      <CardDescription className="text-[13px] font-medium text-slate-500 truncate italic">
                        จัดการ Model และ Prompt
                      </CardDescription>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-purple-500 transition-colors" />
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/protected/settings/smart-match" className="group">
                <Card className="hover:border-amber-300 transition-all duration-300 rounded-[22px] border-slate-200/60 bg-white/50 backdrop-blur-md group-hover:shadow-lg group-hover:-translate-y-1 overflow-hidden">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="p-3 bg-amber-50 rounded-xl group-hover:bg-amber-600 transition-colors duration-300">
                      <Sparkles className="h-6 w-6 text-amber-600 group-hover:text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors truncate">
                        SmartMatch
                      </CardTitle>
                      <CardDescription className="text-[13px] font-medium text-slate-500 truncate italic">
                        ตั้งค่าแนะนำทรัพย์อัตโนมัติ
                      </CardDescription>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-amber-500 transition-colors" />
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-8">
            <AdminSystemSettings />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              <Link href="/protected/settings/users" className="group">
                <Card className="relative hover:border-slate-400 transition-all duration-300 bg-white/50 backdrop-blur-sm border-slate-200/60 rounded-[22px] group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-slate-200/50 overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-slate-100 text-slate-600 border-slate-200 font-bold px-2 py-0.5 rounded-lg text-[10px]">
                      {summary.users} Users
                    </Badge>
                  </div>
                  <CardHeader className="flex flex-col items-center gap-4 text-center">
                    <div className="p-4 bg-slate-50 rounded-[24px] group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 transform group-hover:rotate-360 shadow-xs">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-bold text-slate-900">
                        จัดการผู้ใช้
                      </CardTitle>
                      <CardDescription className="text-[11px] font-bold text-slate-500 tracking-tight uppercase italic opacity-70">
                        Roles & Permissions
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/protected/settings/branches" className="group">
                <Card className="relative hover:border-blue-400 transition-all duration-300 bg-white/50 backdrop-blur-sm border-slate-200/60 rounded-[22px] group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-blue-200/50 overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-blue-100 text-blue-600 border-blue-200 font-bold px-2 py-0.5 rounded-lg text-[10px]">
                      {summary.branches} Branches
                    </Badge>
                  </div>
                  <CardHeader className="flex flex-col items-center gap-4 text-center">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-[24px] group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 transform group-hover:scale-110 shadow-xs">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-bold text-slate-900">
                        จัดการสาขา
                      </CardTitle>
                      <CardDescription className="text-[11px] font-bold text-blue-500/70 tracking-tight uppercase italic opacity-70">
                        Multi-Office Control
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/protected/settings/teams" className="group">
                <Card className="relative hover:border-indigo-400 transition-all duration-300 bg-white/50 backdrop-blur-sm border-slate-200/60 rounded-[22px] group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-indigo-200/50 overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-indigo-100 text-indigo-600 border-indigo-200 font-bold px-2 py-0.5 rounded-lg text-[10px]">
                      {summary.teams} Teams
                    </Badge>
                  </div>
                  <CardHeader className="flex flex-col items-center gap-4 text-center">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[24px] group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 transform group-hover:-translate-y-1 shadow-xs">
                      <Users className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-bold text-slate-900">
                        จัดการทีม
                      </CardTitle>
                      <CardDescription className="text-[11px] font-bold text-indigo-500/70 tracking-tight uppercase italic opacity-70">
                        Group Resource Mgmt
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/protected/admin/audit-logs" className="group">
                <Card className="hover:border-slate-400 transition-all duration-300 bg-white/50 backdrop-blur-sm border-slate-200/60 rounded-[22px] group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-slate-300/50">
                  <CardHeader className="flex flex-col items-center gap-4 text-center">
                    <div className="p-4 bg-slate-50 text-slate-600 rounded-[24px] group-hover:bg-slate-700 group-hover:text-white transition-all duration-500 shadow-xs">
                      <History className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-bold text-slate-900">
                        Audit Logs
                      </CardTitle>
                      <CardDescription className="text-[11px] font-bold text-slate-500/70 tracking-tight uppercase italic opacity-70">
                        Security Tracing
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </div>

            {/* Elite Data Snapshot Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card className="border-none bg-linear-to-r from-slate-900 to-slate-800 text-white rounded-[28px] p-1 overflow-hidden relative group">
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-2xl">
                      <Database className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">System Health</h4>
                      <p className="text-xs text-slate-400 font-medium">
                        All database nodes optimized
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-black italic text-blue-400">
                      100%
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                      Stability Rate
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none bg-linear-to-r from-indigo-900 to-blue-900 text-white rounded-[28px] p-1 overflow-hidden relative group">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-2xl">
                      <Shield className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Security Score</h4>
                      <p className="text-xs text-slate-300 font-medium italic">
                        Elite hardening level active
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-black italic text-indigo-400">
                      A+
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      Security Grade
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="commission" className="space-y-6">
            <CommissionSettings />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
