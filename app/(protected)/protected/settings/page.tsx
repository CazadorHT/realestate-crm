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
import { CheckCircle2 } from "lucide-react";
import { getLineBotInfo } from "@/lib/line";
import { FaFacebook, FaMeta, FaUser } from "react-icons/fa6";
import { getSiteSettings } from "@/features/site-settings/actions";
import { SiteSettings } from "@/features/site-settings/schema";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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

  const isTikTokConnected = !!allSettings.tiktok_auth_token;
  const isFacebookConnected = !!process.env.META_PAGE_ACCESS_TOKEN || !!allSettings.meta_page_access_token;

  const isLineConnected =
    !!process.env.LINE_CHANNEL_ACCESS_TOKEN || !!allSettings.line_channel_access_token;

  let lineBotInfo = null;
  if (isLineConnected) {
    lineBotInfo = await getLineBotInfo();
  }

  return (
    <div className="space-y-6 max-w-screen-2xl pb-10">
      <SuccessAnimation />
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-xl">
          <Settings className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">การตั้งค่าระบบ</h1>
          <p className="text-slate-500 text-sm">
            จัดการการตั้งค่าระบบและฟีเจอร์ต่างๆ ทั้งหมดในที่เดียว
          </p>
        </div>
      </div>

      <Tabs defaultValue={activeTab} className="w-full">
        <SettingsTabs activeTab={activeTab} />

        <div className="mt-6">
          <TabsContent value="general" className="space-y-6">
            <SiteSettingsPanel />
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <SiteConfigPanel />
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LINE Card */}
              <Card
                className={cn(
                  "transition-all duration-300 shadow-sm hover:shadow-md",
                  isLineConnected
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-emerald-100"
                    : "bg-white border-slate-200"
                )}
              >
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-2xl",
                        isLineConnected ? "bg-white/20 backdrop-blur-md" : "bg-emerald-50"
                      )}>
                        <FaLine className={cn("h-8 w-8", isLineConnected ? "text-white" : "text-emerald-500")} />
                      </div>
                      <div>
                        <CardTitle className={cn("text-lg font-bold", isLineConnected ? "text-white" : "text-slate-900")}>LINE</CardTitle>
                        <CardDescription className={isLineConnected ? "text-emerald-50" : "text-slate-500"}>
                          Official Account & Notifications
                        </CardDescription>
                      </div>
                    </div>
                    {isLineConnected && (
                      <div className="flex flex-col items-start sm:items-end gap-2">
                        <Badge className="bg-white text-emerald-600 border-none hover:bg-white/90 font-bold px-3 py-1 scale-90 sm:scale-100 origin-left sm:origin-right">
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                          เชื่อมต่อแล้ว
                        </Badge>
                        {lineBotInfo?.displayName && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/10 text-white text-[10px] font-medium border border-white/10">
                            <FaUser className="h-2.5 w-2.5 opacity-70" />
                            <span className="truncate max-w-[120px]">{lineBotInfo.displayName}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Link href="/protected/line-manager" className="w-full sm:w-auto">
                      <Button
                        variant={isLineConnected ? "secondary" : "outline"}
                        className="w-full font-bold h-10 rounded-xl"
                      >
                        {isLineConnected ? "จัดการ Line Manager" : "เชื่อมต่อ Line"}
                      </Button>
                    </Link>
                    {isLineConnected && (
                      <IntegrationDisconnectButton
                        provider="line"
                        variant="secondary"
                        className="w-full sm:w-auto font-bold h-10 rounded-xl bg-white/10 hover:bg-white/20 border-white/20 text-white"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* TikTok Card */}
              <Card
                className={cn(
                  "transition-all duration-300 shadow-sm hover:shadow-md",
                  isTikTokConnected
                    ? "bg-slate-900 text-white border-slate-800 shadow-slate-200"
                    : "bg-white border-slate-200"
                )}
              >
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-2xl",
                        isTikTokConnected ? "bg-white/10 backdrop-blur-md" : "bg-slate-100"
                      )}>
                        <FaTiktok className={cn("h-7 w-7", isTikTokConnected ? "text-white" : "text-slate-900")} />
                      </div>
                      <div>
                        <CardTitle className={cn("text-lg font-bold", isTikTokConnected ? "text-white" : "text-slate-900")}>TikTok</CardTitle>
                        <CardDescription className={isTikTokConnected ? "text-slate-400" : "text-slate-500"}>
                          Short Video Marketing
                        </CardDescription>
                      </div>
                    </div>
                    {isTikTokConnected && (
                      <div className="flex flex-col items-start sm:items-end gap-2">
                        <Badge className="bg-emerald-500 text-white border-none font-bold px-3 py-1 scale-90 sm:scale-100 origin-left sm:origin-right">
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                          เชื่อมต่อแล้ว
                        </Badge>
                        {allSettings.tiktok_auth_token?.display_name && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 text-slate-300 text-[10px] font-medium border border-white/5">
                            <FaUser className="h-2.5 w-2.5 opacity-70" />
                            <span className="truncate max-w-[120px]">{allSettings.tiktok_auth_token.display_name}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Link href="/api/auth/tiktok/login" className="w-full sm:w-auto">
                      <Button
                        className={cn(
                          "w-full font-bold h-10 rounded-xl",
                          isTikTokConnected ? "bg-white text-slate-900 hover:bg-slate-100" : "bg-slate-900 text-white hover:bg-slate-800"
                        )}
                      >
                        {isTikTokConnected ? "เชื่อมต่อใหม่" : "เชื่อมต่อ TikTok"}
                      </Button>
                    </Link>
                    {isTikTokConnected && (
                      <IntegrationDisconnectButton
                        provider="tiktok"
                        className="w-full sm:w-auto font-bold h-10 rounded-xl bg-slate-800 text-white border-slate-700"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Meta Card */}
              <Card
                className={cn(
                  "transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden relative",
                  isFacebookConnected
                    ? "bg-linear-to-br from-blue-600 via-indigo-600 to-pink-500 text-white border-none"
                    : "bg-white border-slate-200"
                )}
              >
                {isFacebookConnected && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
                )}
                <CardHeader className="pb-4 relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-2xl",
                        isFacebookConnected ? "bg-white/20 backdrop-blur-md" : "bg-blue-50"
                      )}>
                        <FaMeta className={cn("h-7 w-7", isFacebookConnected ? "text-white" : "text-blue-600")} />
                      </div>
                      <div>
                        <CardTitle className={cn("text-lg font-bold", isFacebookConnected ? "text-white" : "text-slate-900")}>Meta</CardTitle>
                        <CardDescription className={isFacebookConnected ? "text-blue-50" : "text-slate-500"}>
                          Facebook & Instagram
                        </CardDescription>
                      </div>
                    </div>
                    {isFacebookConnected && (
                      <div className="flex flex-col items-start sm:items-end gap-2">
                        <Badge className="bg-white text-indigo-600 border-none hover:bg-white/90 font-bold px-3 py-1 scale-90 sm:scale-100 origin-left sm:origin-right">
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                          เชื่อมต่อแล้ว
                        </Badge>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/10 text-white text-[10px] font-medium border border-white/10">
                          <Facebook className="h-2.5 w-2.5 opacity-70" />
                          <span className="truncate max-w-[120px]">{allSettings.meta_page_name || "System (Env)"}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Link href="/api/auth/facebook/login" className="w-full sm:w-auto">
                      <Button
                        className={cn(
                          "w-full font-bold h-10 rounded-xl",
                          isFacebookConnected ? "bg-white text-indigo-600 hover:bg-slate-50" : "bg-blue-600 text-white hover:bg-blue-700"
                        )}
                      >
                        {isFacebookConnected ? "เชื่อมต่อใหม่" : "เชื่อมต่อ Facebook"}
                      </Button>
                    </Link>
                    {isFacebookConnected && (
                      <IntegrationDisconnectButton
                        provider="facebook"
                        variant="secondary"
                        className="w-full sm:w-auto font-bold h-10 rounded-xl bg-white/10 hover:bg-white/20 border-white/20 text-white"
                      />
                    )}
                  </div>
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

          <TabsContent value="ai" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/protected/ai-monitor">
                <Card className="hover:border-blue-200 transition-colors">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">AI Monitor</CardTitle>
                      <CardDescription className="text-xs">
                        ตรวจสอบสถานะการทำงานของ AI
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/protected/admin/ai-config">
                <Card className="hover:border-blue-200 transition-colors">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Cpu className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        ตั้งค่า AI Model
                      </CardTitle>
                      <CardDescription className="text-xs">
                        ปรับแต่งการเลือกใช้ AI และ Prompt
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/protected/settings/smart-match">
                <Card className="hover:border-blue-200 transition-colors">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <Sparkles className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        SmartMatch Config
                      </CardTitle>
                      <CardDescription className="text-xs">
                        ตั้งค่าการแนะนำทรัพย์อัจฉริยะ
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            <AdminSystemSettings />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/protected/settings/users">
                <Card className="hover:border-red-200 transition-colors">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Shield className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">จัดการผู้ใช้</CardTitle>
                      <CardDescription className="text-xs">
                        เพิ่ม/ลด สิทธิ์ และจัดการบัญชีผู้ใช้งาน
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/protected/settings/branches">
                <Card className="hover:border-blue-200 transition-colors">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">จัดการสาขา</CardTitle>
                      <CardDescription className="text-xs">
                        บริหารจัดการสาขา แฟรนไชส์ และพนักงานในสังกัด
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/protected/settings/teams">
                <Card className="hover:border-red-200 transition-colors">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Users className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">จัดการทีม</CardTitle>
                      <CardDescription className="text-xs">
                        แบ่งกลุ่มทรัพยากรและการทำงานในทีม
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/protected/admin/audit-logs">
                <Card className="hover:border-slate-200 transition-colors">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <History className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Audit Logs</CardTitle>
                      <CardDescription className="text-xs">
                        ตรวจสอบบันทึกการใช้งานย้อนหลังของระบบ
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
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
