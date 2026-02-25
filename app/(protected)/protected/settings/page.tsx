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
  Music2,
  Facebook,
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
import { FaLine, FaTiktok } from "react-icons/fa";

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
           
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FaLine className="h-5 w-5 text-green-500" />
                  LINE Integration
                </CardTitle>
                <CardDescription>
                  จัดการการเชื่อมต่อ LINE Official Account และการแจ้งเตือน
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <Link href="/protected/line-manager">
                    <Button variant="outline" className="w-full md:w-auto">
                      เปิด Line Manager
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FaTiktok className="h-5 w-5 text-slate-900 dark:text-white" />
                  TikTok Integration
                </CardTitle>
                <CardDescription>
                  เชื่อมต่อ TikTok เพื่อโพสต์วิดีโอทรัพย์โดยตรงจาก CRM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Link href="/api/auth/tiktok/login">
                      <Button className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold">
                        เชื่อมต่อ TikTok
                      </Button>
                    </Link>
                    <p className="text-xs text-slate-500">
                      ลงชื่อเข้าใช้เพื่อขอสิทธิ์การโพสต์วิดีโอ
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Facebook className="h-5 w-5 text-[#1877F2]" />
                  Facebook Integration
                </CardTitle>
                <CardDescription>
                  เชื่อมต่อ Facebook เพื่อโพสต์ทรัพย์ลง Page โดยอัตโนมัติ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Link href="/api/auth/facebook/login">
                      <Button className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold">
                        เชื่อมต่อ Facebook Page
                      </Button>
                    </Link>
                    <p className="text-xs text-slate-500">
                      ดึงข้อมูล Page และขอสิทธิ์การโพสต์
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google Integration
                </CardTitle>
                <CardDescription>
                  เชื่อมต่อ Google สำหรับ Calendar และ My Business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Link href="/api/auth/google/login">
                      <Button
                        variant="outline"
                        className="border-slate-200 font-bold"
                      >
                        เชื่อมต่อ Google Account
                      </Button>
                    </Link>
                    <p className="text-xs text-slate-500">
                      จัดการปฏิทินและข้อมูลธุรกิจบน Google
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card></div>
             <div id="social-automation">
              <SocialAutomationSettings />
            </div>
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
