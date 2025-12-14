import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";

export function PropertiesEmptyState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Building2 className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">ยังไม่มีรายการทรัพย์</h3>
      <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
        เริ่มต้นด้วยการเพิ่มทรัพย์แรกของคุณเข้าสู่ระบบ เพื่อจัดการข้อมูลลูกค้าและการขายได้อย่างมีประสิทธิภาพ
      </p>
      <Button asChild>
        <Link href="/protected/properties/new">
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มทรัพย์ใหม่
        </Link>
      </Button>
    </div>
  );
}
