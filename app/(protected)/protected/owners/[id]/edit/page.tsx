import { notFound } from "next/navigation";
import { OwnerForm } from "@/features/owners/OwnerForm";
import { getOwnerById, getOwnerProperties } from "@/features/owners/queries";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditOwnerPage({ params }: PageProps) {
  const { id } = await params;
  const owner = await getOwnerById(id);
  const properties = await getOwnerProperties(id);

  if (!owner) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-6">แก้ไขข้อมูลเจ้าของทรัพย์</h1>
        <OwnerForm mode="edit" id={owner.id} initialValues={owner} />
      </div>

      <div className="border-t pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            รายการทรัพย์ทั้งหมด ({properties.length})
          </h2>
          <Link
            href={`/protected/properties/new?owner_id=${owner.id}`}
            className="text-sm text-primary hover:underline"
          >
            + เพิ่มทรัพย์ใหม่
          </Link>
        </div>

        {properties.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัสทรัพย์</TableHead>
                  <TableHead>โครงการ</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead className="text-right">ราคา</TableHead>
                  <TableHead className="text-right">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((prop) => (
                  <TableRow key={prop.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/protected/properties/${prop.id}`}
                        className="hover:underline"
                      >
                        {prop.postal_code || "-"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/protected/properties/${prop.id}`}
                        className="hover:underline block"
                      >
                        <span className="font-medium">
                          {prop.title || "ไม่ระบุชื่อ"}
                        </span>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {prop.address_line1 && `ต.${prop.address_line1}`}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm">{prop.property_type}</span>
                        <span className="text-xs text-muted-foreground">
                          {prop.listing_type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("th-TH", {
                        style: "currency",
                        currency: "THB",
                        maximumFractionDigits: 0,
                      }).format(prop.price || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          prop.status === "ACTIVE" ? "secondary" : "outline"
                        }
                      >
                        {prop.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg bg-muted/10">
            <p className="text-muted-foreground">ยังไม่มีรายการทรัพย์</p>
          </div>
        )}
      </div>
    </div>
  );
}
