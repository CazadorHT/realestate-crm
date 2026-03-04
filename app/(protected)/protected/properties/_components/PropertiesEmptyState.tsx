import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export function PropertiesEmptyState() {
  return (
    <div className="mt-8">
      <EmptyState
        icon="plusCircle"
        title="ยังไม่มีทรัพย์ในระบบ"
        description="เริ่มต้นสร้างรายการทรัพย์สินแรกของคุณเลย! ระบบจะช่วยจัดการ ติดตาม และนำเสนอทรัพย์ของคุณอย่างมืออาชีพ"
        actionSlot={
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
        }
      />
    </div>
  );
}
