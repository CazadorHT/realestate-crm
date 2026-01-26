"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { AuthLayout } from "@/components/auth-layout";
import { Mail, ArrowLeft } from "lucide-react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      greeting={
        <>
          กู้คืนรหัสผ่าน
          <br />
          PropertyHub CRM
        </>
      }
      subtitle="กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับรีเซ็ตรหัสผ่านใหม่"
      features={[
        "ปลอดภัยและรวดเร็ว",
        "รีเซ็ตรหัสผ่านได้ด้วยตัวเองตลอด 24 ชม.",
        "ระบบรักษาความปลอดภัยข้อมูลขั้นสูง",
      ]}
    >
      {success ? (
        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-600">
              ตรวจสอบอีเมลของคุณ
            </CardTitle>
            <CardDescription className="text-base">
              เราได้ส่งขั้นตอนการรีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              หากคุณไม่ได้รับอีเมลภายใน 5 นาที
              กรุณาตรวจสอบในกล่องจดหมายขยะหรือลองใหม่อีกครั้ง
            </p>
            <Button
              variant="outline"
              onClick={() => setSuccess(false)}
              className="w-full h-12"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> ลองใหม่อีกครั้ง
            </Button>
            <div className="text-center pt-2">
              <Link
                href="/auth/login"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-none shadow-xl">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ลืมรหัสผ่าน?
              </CardTitle>
              <CardDescription className="text-base">
                ไม่ต้องกังวล เราจะช่วยคุณกู้คืนรหัสผ่าน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    อีเมล
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <span className="text-red-500">⚠️</span>
                      {error}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      กำลังส่งลิงก์...
                    </span>
                  ) : (
                    "ส่งลิงก์รีเซ็ตรหัสผ่าน"
                  )}
                </Button>

                <div className="text-center pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
                    จำรหัสผ่านได้แล้ว?{" "}
                    <Link
                      href="/auth/login"
                      className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                      เข้าสู่ระบบ
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Help Text */}
          <p className="text-center text-sm text-slate-500">
            ต้องการความช่วยเหลือ?{" "}
            <Link
              href="mailto:support@propertyhub.com"
              className="text-blue-600 hover:underline"
            >
              ติดต่อฝ่ายบริการ
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
