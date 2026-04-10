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
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
           <ShieldCheck className="h-5 w-5 text-slate-900" />
           <CardTitle className="text-lg font-bold">บัญชีและความปลอดภัย</CardTitle>
        </div>
        <CardDescription>
          จัดการการเข้าสู่ระบบและความปลอดภัยของบัญชี
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6 pt-2">
        <motion.div 
          whileHover={{ x: 4 }}
          className="flex gap-4 items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/30 hover:bg-white hover:border-blue-100 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-300"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-800">รหัสผ่าน</p>
              <p className="text-xs text-slate-500">
                เปลี่ยนรหัสผ่านเพื่อความปลอดภัย
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="rounded-lg h-9 border-slate-200 hover:bg-slate-900 hover:text-white transition-colors" asChild>
            <a href="/auth/update-password">แก้ไข</a>
          </Button>
        </motion.div>

        <div className="flex items-center gap-4 py-2">
          <Separator className="flex-1 opacity-50" />
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Logout Zone</span>
          <Separator className="flex-1 opacity-50" />
        </div>

        <motion.div 
          whileHover={{ x: 4 }}
          className="flex gap-4 items-center justify-between p-4 border border-transparent rounded-xl hover:bg-rose-50/30 transition-all duration-300"
        >
          <div className="flex items-center gap-3 opacity-60 group-hover:opacity-100">
            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-400 transition-colors">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-800">ออกจากระบบ</p>
              <p className="text-xs text-slate-400">ออกจากบัญชีบนอุปกรณ์นี้</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut} 
            className="rounded-lg h-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            Sign Out
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}
