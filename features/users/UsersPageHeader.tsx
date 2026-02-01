import { Users } from "lucide-react";

export function UsersPageHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <Users className="h-5 w-5" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 ml-1">
          จัดการผู้ใช้ในระบบ
        </h1>
      </div>
      <p className="text-slate-500 text-sm md:text-base ml-14">
        ตรวจสอบและจัดการบทบาทของสมาชิกทีมเพื่อความปลอดภัยและการเข้าถึงข้อมูล
      </p>
    </div>
  );
}
