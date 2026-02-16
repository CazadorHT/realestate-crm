import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function PropertiesEmptyState() {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-linear-to-br from-slate-50 to-white p-8 md:p-12">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 border-4 border-slate-400 rounded-xl rotate-12" />
        <div className="absolute bottom-10 right-10 w-16 h-16 border-4 border-slate-400 rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-12 h-12 border-4 border-slate-400 rounded-lg -rotate-6" />
      </div>

      <div className="relative flex flex-col items-center justify-center text-center space-y-5 md:space-y-6">
        {/* Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl scale-150" />
          <div className="relative p-5 md:p-6 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/30">
            <PlusCircle className="h-10 w-10 md:h-12 md:w-12 text-white" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2 max-w-md">
          <h3 className="text-xl md:text-2xl font-bold text-slate-800">
            ยังไม่มีทรัพย์ในระบบ
          </h3>
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed px-4">
            เริ่มต้นสร้างรายการทรัพย์สินแรกของคุณเลย! ระบบจะช่วยจัดการ ติดตาม
            และนำเสนอทรัพย์ของคุณอย่างมืออาชีพ
          </p>
        </div>

        {/* CTA Button */}
        <Button
          asChild
          size="lg"
          className="w-full sm:w-auto bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 font-bold"
        >
          <Link href="/protected/properties/new">
            <PlusCircle className="h-4 w-4 md:h-5 md:w-5 mr-2" />
            เพิ่มทรัพย์แรกของคุณ
          </Link>
        </Button>
      </div>
    </div>
  );
}
