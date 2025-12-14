import { OwnerForm } from "@/features/owners/OwnerForm";
import { getOwnerByIdAction } from "@/features/owners/actions";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EditOwnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const owner = await getOwnerByIdAction(id);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/protected/owners">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">แก้ไขข้อมูลเจ้าของ</h1>
          <p className="text-muted-foreground">{owner.full_name}</p>
        </div>
      </div>

      <OwnerForm mode="edit" defaultValues={owner} />
    </div>
  );
}
