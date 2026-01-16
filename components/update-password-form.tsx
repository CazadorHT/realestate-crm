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
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Get the current user's email
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, [supabase.auth]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!currentPassword) {
      setError("กรุณากรอกรหัสผ่านปัจจุบัน");
      return;
    }

    if (password.length < 6) {
      setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    if (currentPassword === password) {
      setError("รหัสผ่านใหม่ต้องไม่เหมือนกับรหัสผ่านเดิม");
      return;
    }

    if (!userEmail) {
      setError("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (signInError) {
        setError("รหัสผ่านปัจจุบันไม่ถูกต้อง");
        setIsLoading(false);
        return;
      }

      // Step 2: Update to the new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
      router.push("/protected/profile");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-slate-200 dark:border-slate-700 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">เปลี่ยนรหัสผ่าน</CardTitle>
          <CardDescription>
            กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword}>
            <div className="flex flex-col gap-4">
              {/* Current Password */}
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">รหัสผ่านปัจจุบัน</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="กรอกรหัสผ่านปัจจุบัน"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    รหัสผ่านใหม่
                  </span>
                </div>
              </div>

              {/* New Password */}
              <div className="grid gap-2">
                <Label htmlFor="password">รหัสผ่านใหม่</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
                <Input
                  id="confirmPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกรหัสผ่านใหม่"
                )}
              </Button>

              <Link
                href="/protected/profile"
                className="text-sm text-center text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                กลับไปหน้าโปรไฟล์
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
