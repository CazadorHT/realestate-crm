import { getFaqs, deleteFaq } from "@/features/admin/faqs-actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function FAQsPage() {
  const faqs = await getFaqs();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">จัดการคำถามที่พบบ่อย (FAQs)</h1>
        <Link href="/protected/faqs/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มคำถามใหม่
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ลำดับ</TableHead>
              <TableHead>คำถาม</TableHead>
              <TableHead>หมวดหมู่</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {faqs?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-slate-500"
                >
                  ยังไม่มีข้อมูลคำถามที่พบบ่อย
                </TableCell>
              </TableRow>
            ) : (
              faqs?.map((faq) => (
                <TableRow key={faq.id}>
                  <TableCell>{faq.sort_order}</TableCell>
                  <TableCell className="font-medium">{faq.question}</TableCell>
                  <TableCell>
                    {faq.category ? (
                      <Badge variant="outline">{faq.category}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={faq.is_active ? "default" : "secondary"}
                      className={
                        faq.is_active ? "bg-green-600 hover:bg-green-700" : ""
                      }
                    >
                      {faq.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/protected/faqs/${faq.id}`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                      </Link>
                      <form
                        action={async () => {
                          "use server";
                          await deleteFaq(faq.id);
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
