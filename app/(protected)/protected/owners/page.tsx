import { Button } from "@/components/ui/button";
import { OwnersTable } from "@/components/owners/OwnersTable";
import { getOwnersWithPropertyCountAction } from "@/features/owners/actions";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default async function OwnersPage() {
  const owners = await getOwnersWithPropertyCountAction();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">เจ้าของทรัพย์</h1>
          <p className="text-muted-foreground">
            จัดการข้อมูลเจ้าของทรัพย์และผู้ติดต่อ
          </p>
        </div>
        <Button asChild>
          <Link href="/protected/owners/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            เพิ่มเจ้าของ
          </Link>
        </Button>
      </div>

      <OwnersTable owners={owners} />
    </div>
  );
}
