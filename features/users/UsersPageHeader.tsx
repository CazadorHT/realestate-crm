import { Users, Users2, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

export function UsersPageHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/40 backdrop-blur-xl border border-white/40 p-8 rounded-3xl shadow-xl shadow-slate-200/50">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
           <div className="p-2.5 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
              <Users className="h-6 w-6" />
           </div>
           <div className="h-10 w-[2px] bg-slate-200 rounded-full mx-1" />
           <div className="space-y-0.5">
              <h1 className="text-3xl font-semibold   bg-linear-to-br  from-slate-900 to-slate-700 bg-clip-text text-transparent">
                USER MANAGEMENT
              </h1>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] pl-0.5">
                Enterprise Control Center
              </p>
           </div>
        </div>
        <p className="text-slate-500 font-medium max-w-xl leading-relaxed italic">
          ตรวจสอบและจัดการบทบาทของสมาชิกทีม <span className="text-slate-900 font-bold not-italic">{siteConfig.company}</span> เพื่อความปลอดภัยและการเข้าถึงข้อมูลระดับสูงสุด
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/protected/settings/teams">
          <Button 
            variant="outline" 
            className="rounded-2xl h-12 px-6 border-slate-200 bg-white/50 hover:bg-white hover:border-slate-300 transition-all duration-300 flex items-center gap-2 group shadow-sm"
          >
            <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-blue-50 transition-colors">
              <Users2 className="h-4 w-4 text-slate-600 group-hover:text-blue-600" />
            </div>
            <span className="font-semibold text-slate-700">จัดการทีม</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
