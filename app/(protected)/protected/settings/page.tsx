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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className={
                  isLineConnected
                    ? "bg-green-500 text-white border-slate-800 transition-colors shadow-lg"
                    : ""
                }
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div
                      className={
                        isLineConnected
                          ? "flex items-center gap-2 text-white"
                          : "flex items-center gap-2"
                      }
                    >
                      <FaLine
                        className={`h-10 w-10 ${isLineConnected ? "text-white" : "text-green-500"}`}
                      />
                      LINE Integration
                    </div>
                    {isLineConnected && (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-2 items-center text-xs text-green-400 bg-white px-3 py-1.5 rounded-full font-bold shadow-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          เชื่อมต่อแล้ว
                        </div>
                        {lineBotInfo?.displayName && (
                          <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg bg-white/20 text-white text-xs font-medium backdrop-blur-md border border-white/20 shadow-sm">
                            <FaUser className="h-3 w-3 opacity-80" />
                            <span>{lineBotInfo.displayName}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardTitle>
                  <CardDescription
                    className={isLineConnected ? "text-white" : ""}
                  >
                    จัดการการเชื่อมต่อ LINE Official Account และการแจ้งเตือน
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <Link href="/protected/line-manager">
                        <Button
                          variant={isLineConnected ? "secondary" : "outline"}
                          className="w-full md:w-auto font-bold"
                        >
                          {isLineConnected
                            ? "จัดการ Line Manager"
                            : "เปิด Line Manager"}
                        </Button>
                      </Link>
                      {isLineConnected && (
                        <IntegrationDisconnectButton
                          provider="line"
                          variant="secondary"
                          className="w-full md:w-auto font-bold opacity-80 hover:opacity-100"
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={
                  isTikTokConnected
                    ? "bg-slate-900 text-white border-slate-800 transition-colors shadow-lg"
                    : ""
                }
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div
                      className={`flex items-center gap-2 ${isTikTokConnected ? "text-white" : "text-slate-900"}`}
                    >
                      <FaTiktok
                        className={`h-6 w-6 ${isTikTokConnected ? "text-white" : "text-slate-900"}`}
                      />
                      TikTok Integration
                    </div>
                    {isTikTokConnected && (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-2 items-center text-xs text-green-400 bg-slate-700/50 px-3 py-1.5 rounded-full font-bold border border-slate-700">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          เชื่อมต่อแล้ว
                        </div>
                        {allSettings.tiktok_auth_token?.display_name && (
                          <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg bg-slate-800/50 text-white text-[11px] font-bold backdrop-blur-md border border-slate-700 shadow-sm">
                            <FaUser className="h-3 w-3 opacity-80" />
                            <span>{allSettings.tiktok_auth_token.display_name}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardTitle>
                  <CardDescription
                    className={isTikTokConnected ? "text-slate-400" : ""}
                  >
                    เชื่อมต่อ TikTok เพื่อโพสต์วิดีโอทรัพย์โดยตรงจาก CRM
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <Link href="/api/auth/tiktok/login">
                        <Button
                          className={
                            isTikTokConnected
                              ? "bg-white text-slate-900 hover:bg-slate-100 font-bold"
                              : "bg-slate-900 hover:bg-slate-800 text-white font-bold"
                          }
                        >
                          {isTikTokConnected
                            ? "เชื่อมต่อใหม่"
                            : "เชื่อมต่อ TikTok"}
                        </Button>
                      </Link>
                      {isTikTokConnected && (
                        <IntegrationDisconnectButton
                          provider="tiktok"
                          className={`w-full md:w-auto font-bold ${isTikTokConnected ? "text-white hover:text-white hover:bg-slate-800" : ""}`}
                        />
                      )}
                      {!isTikTokConnected && (
                        <p className={`text-xs text-slate-500`}>
                          ลงชื่อเข้าใช้เพื่อขอสิทธิ์การโพสต์วิดีโอ
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={
                  isFacebookConnected
                    ? "bg-blue-500 bg-linear-to-r from-blue-500 to-pink-500/70 text-white border-slate-800 transition-colors shadow-lg"
                    : ""
                }
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className={`flex items-center gap-2 ${isFacebookConnected ? "text-white" : "text-slate-900"}`}>
                      <FaMeta
                        className={`h-5 w-5 ${isFacebookConnected ? "text-white" : "text-[#1877F2]"}`}
                      />
                      Meta Integration
                    </div>
                    {isFacebookConnected && (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-2 items-center text-xs text-green-700 bg-white px-3 py-1.5 rounded-full font-semibold border border-white">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          เชื่อมต่อแล้ว
                        </div>
                        {isFacebookConnected && (
                          <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg bg-white/20 text-white text-[11px] font-semibold backdrop-blur-md border border-white shadow-sm">
                            <Facebook className="h-3 w-3 opacity-80" />
                            <span>{allSettings.meta_page_name || "System (Environment)"}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardTitle>
                  <CardDescription
                    className={isFacebookConnected ? "text-white" : "text-slate-500"}
                  >
                    เชื่อมต่อ Facebook , Instagram เพื่อโพสต์ทรัพย์ลง Page โดยอัตโนมัติ
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <Link href="/api/auth/facebook/login">
                        <Button
                          className={
                            isFacebookConnected
                              ? "bg-white text-slate-900 hover:bg-slate-100 font-bold"
                              : "bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold"
                          }
                        >
                          {isFacebookConnected
                            ? "เชื่อมต่อใหม่"
                            : "เชื่อมต่อ Facebook Page"}
                        </Button>
                      </Link>
                      {isFacebookConnected && (
                        <IntegrationDisconnectButton
                          provider="facebook"
                          variant="secondary"
                          className="w-full md:w-auto font-bold opacity-80 hover:opacity-100"
                        />
                      )}
                      {!isFacebookConnected && (
                        <p className={`text-xs text-slate-500`}>
                          ดึงข้อมูล Page และขอสิทธิ์การโพสต์
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>


            </div>
            <div id="social-automation">
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
