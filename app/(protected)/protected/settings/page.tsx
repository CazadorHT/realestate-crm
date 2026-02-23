import { Metadata } from "next";
import { SiteSettingsPanel } from "@/components/settings/SiteSettingsPanel";
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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Settings | CRM",
  description: "Manage site settings",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-7xl pb-10">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
          <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            การตั้งค่าระบบ
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            จัดการการตั้งค่าระบบและฟีเจอร์ต่างๆ ทั้งหมดในที่เดียว
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto h-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
          <TabsTrigger
            value="general"
            className="rounded-lg py-2 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
          >
            ทั่วไป
          </TabsTrigger>
          <TabsTrigger
            value="social"
            className="rounded-lg py-2 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
          >
            Social
          </TabsTrigger>
          <TabsTrigger
            value="ai"
            className="rounded-lg py-2 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
          >
            AI Tools
          </TabsTrigger>
          <TabsTrigger
            value="admin"
            className="rounded-lg py-2 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
          >
            Admin
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/protected/profile">
                <Card className="hover:border-blue-200 transition-colors h-full">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <UserCircle className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">โปรไฟล์ของคุณ</CardTitle>
                      <CardDescription className="text-xs">
                        จัดการข้อมูลส่วนตัวและรหัสผ่าน
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </div>
            <SiteSettingsPanel />
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <div id="social-automation">
              <SocialAutomationSettings />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  LINE Integration
                </CardTitle>
                <CardDescription>
                  จัดการการเชื่อมต่อ LINE Official Account และการแจ้งเตือน
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/protected/line-manager">
                  <Button variant="outline" className="w-full md:w-auto">
                    เปิด Line Manager
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/protected/ai-monitor">
                <Card className="hover:border-blue-200 transition-colors">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
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
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
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
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/protected/settings/users">
                <Card className="hover:border-red-200 transition-colors">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
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

              <Link href="/protected/settings/teams">
                <Card className="hover:border-red-200 transition-colors">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
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
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
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
        </div>
      </Tabs>
    </div>
  );
}
