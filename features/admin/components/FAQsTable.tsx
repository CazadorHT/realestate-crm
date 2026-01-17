"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, HelpCircle } from "lucide-react";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeleteFaqsAction } from "@/features/admin/faqs-bulk-actions";
import { toast } from "sonner";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

interface FAQsTableProps {
  faqs: FAQ[];
}

export function FAQsTable({ faqs }: FAQsTableProps) {
  const allIds = useMemo(() => faqs?.map((f) => f.id) || [], [faqs]);
  const {
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isPartialSelected,
    selectedCount,
    selectedIds,
  } = useTableSelection(allIds);

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const result = await bulkDeleteFaqsAction(ids);
    if (result.success) {
      toast.success(result.message);
      clearSelection();
      window.location.reload();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="space-y-4">
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        entityName="คำถาม"
      />

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={() => toggleSelectAll(allIds)}
                  aria-label="เลือกทั้งหมด"
                  className={
                    isPartialSelected
                      ? "data-[state=checked]:bg-primary/50"
                      : ""
                  }
                />
              </TableHead>
              <TableHead className="w-[100px] font-semibold">ลำดับ</TableHead>
              <TableHead className="font-semibold">คำถาม</TableHead>
              <TableHead className="font-semibold">หมวดหมู่</TableHead>
              <TableHead className="font-semibold">สถานะ</TableHead>
              <TableHead className="text-right font-semibold">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!faqs || faqs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
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
              faqs.map((faq) => (
                <TableRow
                  key={faq.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    isSelected(faq.id) ? "bg-blue-50/50" : ""
                  }`}
                >
                  <TableCell className="w-[50px]">
                    <Checkbox
                      checked={isSelected(faq.id)}
                      onCheckedChange={() => toggleSelect(faq.id)}
                      aria-label={`เลือก ${faq.question}`}
                    />
                  </TableCell>
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
