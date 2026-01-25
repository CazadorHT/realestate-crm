import { Button } from "@/components/ui/button";
import { PlusCircle, UserPlus, CalendarDays } from "lucide-react";
import Link from "next/link";

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <Button
        asChild
        variant="outline"
        className="h-20 flex flex-col gap-2 hover:border-primary hover:text-primary transition-colors"
      >
        <Link href="/protected/properties/new">
          <PlusCircle className="h-6 w-6" />
          <span className="text-xs font-semibold">เพิ่มทรัพย์</span>
        </Link>
      </Button>

      <Button
        asChild
        variant="outline"
        className="h-20 flex flex-col gap-2 hover:border-primary hover:text-primary transition-colors"
      >
        <Link href="/protected/leads/new">
          <UserPlus className="h-6 w-6" />
          <span className="text-xs font-semibold">เพิ่มลูกค้า</span>
        </Link>
      </Button>

      <Button
        asChild
        variant="outline"
        className="h-20 flex flex-col gap-2 hover:border-primary hover:text-primary transition-colors"
      >
        <Link href="/protected/calendar">
          <CalendarDays className="h-6 w-6" />
          <span className="text-xs font-semibold">นัดหมาย</span>
        </Link>
      </Button>
    </div>
  );
}
