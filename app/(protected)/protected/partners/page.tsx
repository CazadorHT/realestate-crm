import { getPartners, deletePartner } from "@/features/admin/partners-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function PartnersPage() {
  const partners = await getPartners();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">จัดการพาร์ทเนอร์ (Partners)</h1>
        <Link href="/protected/partners/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มพาร์ทเนอร์
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ลำดับ</TableHead>
              <TableHead className="w-[120px]">โลโก้</TableHead>
              <TableHead>ชื่อพาร์ทเนอร์</TableHead>
              <TableHead>เว็บไซต์</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-slate-500"
                >
                  ยังไม่มีข้อมูลพาร์ทเนอร์
                </TableCell>
              </TableRow>
            ) : (
              partners?.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>{partner.sort_order}</TableCell>
                  <TableCell>
                    <div className="h-8 w-20 relative">
                      <img
                        src={partner.logo_url}
                        alt={partner.name}
                        className="h-full w-full object-contain object-left"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell>
                    {partner.website_url ? (
                      <a
                        href={partner.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                      >
                        Link <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={partner.is_active ? "default" : "secondary"}
                      className={
                        partner.is_active
                          ? "bg-green-600 hover:bg-green-700"
                          : ""
                      }
                    >
                      {partner.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/protected/partners/${partner.id}`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                      </Link>
                      <form
                        action={async () => {
                          "use server";
                          await deletePartner(partner.id);
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
