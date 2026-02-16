import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PropertiesHeaderProps {
  count: number;
}

export function PropertiesHeader({ count }: PropertiesHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 md:p-8 shadow-xl">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />

      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
        <div className="space-y-1.5 md:space-y-2">
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
              <PlusCircle className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight">
              ทรัพย์ทั้งหมด
            </h1>
          </div>
          <p className="text-blue-100/90 text-xs md:text-base max-w-md">
            จัดการและติดตามทรัพย์สินของคุณ • มีทั้งหมด{" "}
            <span className="font-bold text-white">{count || 0}</span> รายการ
          </p>
        </div>

        <Button
          asChild
          size="lg"
          className="w-full md:w-auto bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 font-bold h-11 md:h-12"
        >
          <Link href="/protected/properties/new">
            <PlusCircle className="h-4 w-4 md:h-5 md:w-5 mr-2" />
            เพิ่มทรัพย์ใหม่
          </Link>
        </Button>
      </div>
    </div>
  );
}
