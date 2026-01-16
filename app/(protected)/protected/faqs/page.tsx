import { getFaqs, deleteFaq } from "@/features/admin/faqs-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  Plus,
  Edit,
  Trash2,
  HelpCircle,
  CheckCircle,
  XCircle,
  FolderOpen,
} from "lucide-react";
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

  // Calculate stats
  const totalFaqs = faqs?.length || 0;
  const activeFaqs = faqs?.filter((f) => f.is_active).length || 0;
  const inactiveFaqs = totalFaqs - activeFaqs;
  const categories = [...new Set(faqs?.map((f) => f.category).filter(Boolean))];
  const totalCategories = categories.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            จัดการคำถามที่พบบ่อย
          </h1>
          <p className="text-slate-500 mt-2">จัดการคำถามและคำตอบสำหรับลูกค้า</p>
        </div>
        <Link href="/protected/faqs/new">
          <Button className="hover:shadow-md transition-shadow">
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มคำถามใหม่
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คำถามทั้งหมด</CardTitle>
            <HelpCircle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFaqs}</div>
            <p className="text-xs text-slate-500 mt-1">Total FAQs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ใช้งานอยู่</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeFaqs}
            </div>
            <p className="text-xs text-slate-500 mt-1">Active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ปิดใช้งาน</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {inactiveFaqs}
            </div>
            <p className="text-xs text-slate-500 mt-1">Inactive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">หมวดหมู่</CardTitle>
            <FolderOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalCategories}
            </div>
            <p className="text-xs text-slate-500 mt-1">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* FAQs Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[100px] font-semibold">ลำดับ</TableHead>
              <TableHead className="font-semibold">คำถาม</TableHead>
              <TableHead className="font-semibold">หมวดหมู่</TableHead>
              <TableHead className="font-semibold">สถานะ</TableHead>
              <TableHead className="text-right font-semibold">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {faqs?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-slate-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <HelpCircle className="h-12 w-12 text-slate-300" />
                    <p className="font-medium">ยังไม่มีข้อมูลคำถามที่พบบ่อย</p>
                    <p className="text-sm">เริ่มต้นสร้างคำถามแรกของคุณ</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              faqs?.map((faq) => (
                <TableRow
                  key={faq.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <TableCell className="font-medium">
                    {faq.sort_order}
                  </TableCell>
                  <TableCell className="font-medium max-w-md">
                    <div className="truncate">{faq.question}</div>
                  </TableCell>
                  <TableCell>
                    {faq.category ? (
                      <Badge variant="outline" className="font-medium">
                        {faq.category}
                      </Badge>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={faq.is_active ? "default" : "secondary"}
                      className={
                        faq.is_active
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-slate-400"
                      }
                    >
                      {faq.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/protected/faqs/${faq.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
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

      {/* Footer Stats */}
      {totalFaqs > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500 px-2">
          <div className="flex items-center gap-4">
            <span>แสดงทั้งหมด {totalFaqs} คำถาม</span>
            {activeFaqs > 0 && (
              <span className="text-green-600 font-medium">
                {activeFaqs} ใช้งาน
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs">
              อัพเดทล่าสุด: {new Date().toLocaleDateString("th-TH")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
