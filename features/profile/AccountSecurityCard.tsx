"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { KeyRound, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function AccountSecurityCard() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("ออกจากระบบสำเร็จ");
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการออกจากระบบ");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>บัญชีและความปลอดภัย</CardTitle>
        <CardDescription>
          จัดการการเข้าสู่ระบบและความปลอดภัยของบัญชี
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">รหัสผ่าน</p>
              <p className="text-sm text-muted-foreground">
                เปลี่ยนรหัสผ่านของคุณ
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <a href="/auth/update-password">เปลี่ยนรหัสผ่าน</a>
          </Button>
        </div>

        <Separator />

        <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/20 bg-destructive/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <LogOut className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="font-medium">ออกจากระบบ</p>
              <p className="text-sm text-muted-foreground">ออกจากบัญชีของคุณ</p>
            </div>
          </div>
          <Button variant="destructive" onClick={handleSignOut}>
            ออกจากระบบ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
