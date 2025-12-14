import { OwnerForm } from "@/features/owners/OwnerForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewOwnerPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/protected/owners">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">เพิ่มเจ้าของทรัพย์</h1>
          <p className="text-muted-foreground">กรอกข้อมูลเจ้าของทรัพย์ใหม่</p>
        </div>
      </div>

      <OwnerForm mode="create" />
    </div>
  );
}
