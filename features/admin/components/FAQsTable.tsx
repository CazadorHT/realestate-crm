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
import { deleteFaq } from "@/features/admin/faqs-actions";
import { toast } from "sonner";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { EditFAQDialog } from "./EditFAQDialog";
import { cn } from "@/lib/utils";

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
  const [deleteConfirmFaq, setDeleteConfirmFaq] = useState<FAQ | null>(null);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleDelete = async (faq: FAQ) => {
    setIsDeleting(true);
    try {
      const res = await deleteFaq(faq.id);
      if (res.success) {
        toast.success(res.message);
        window.location.reload();
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาดในการลบคำถาม");
      }
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการลบคำถาม");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmFaq(null);
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

      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-in fade-in duration-500">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="w-[50px] px-6">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={() => toggleSelectAll(allIds)}
                  aria-label="เลือกทั้งหมด"
                  className={
                    isPartialSelected
                      ? "data-[state=checked]:bg-primary/50"
                      : "rounded-md"
                  }
                />
              </TableHead>
              <TableHead className="w-[100px] font-bold text-slate-900 px-6">
                ลำดับ
              </TableHead>
              <TableHead className="font-bold text-slate-900 px-6">
                คำถาม
              </TableHead>
              <TableHead className="font-bold text-slate-900 px-6">
                หมวดหมู่
              </TableHead>
              <TableHead className="font-bold text-slate-900 px-6">
                สถานะ
              </TableHead>
              <TableHead className="text-right font-bold text-slate-900 px-6">
                จัดการ
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!faqs || faqs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-20 text-slate-400 bg-white"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-slate-50 rounded-full">
                      <HelpCircle className="h-10 w-10 text-slate-200" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-600">
                        ยังไม่มีข้อมูลคำถามที่พบบ่อย
                      </p>
                      <p className="text-sm">
                        เริ่มต้นสร้างคำถามแรกของคุณได้เลย
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              faqs.map((faq) => (
                <TableRow
                  key={faq.id}
                  className={`group hover:bg-slate-50/80 transition-all duration-200 ${
                    isSelected(faq.id) ? "bg-blue-50/50" : ""
                  }`}
                >
                  <TableCell className="px-6 py-4">
                    <Checkbox
                      checked={isSelected(faq.id)}
                      onCheckedChange={() => toggleSelect(faq.id)}
                      aria-label={`เลือก ${faq.question}`}
                      className="rounded-md"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm text-slate-500 px-6">
                    {faq.sort_order ?? "-"}
                  </TableCell>
                  <TableCell className="font-medium max-w-md px-6">
                    <div className="text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {faq.question}
                    </div>
                  </TableCell>
                  <TableCell className="px-6">
                    {faq.category ? (
                      <Badge
                        variant="outline"
                        className="font-medium bg-slate-50/50 border-slate-200"
                      >
                        {faq.category}
                      </Badge>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </TableCell>
                  <TableCell className="px-6">
                    {faq.is_active ? (
                      <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/80 transition-colors">
                        ใช้งาน
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100/80 transition-colors">
                        ปิดใช้งาน
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => setEditingFaq(faq)}
                      >
                        <Edit className="w-4.5 h-4.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => setDeleteConfirmFaq(faq)}
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile & Tablet Card View */}
      <div className="lg:hidden space-y-4 animate-in fade-in duration-500">
        {!faqs || faqs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
            <div className="flex flex-col items-center gap-3">
              <HelpCircle className="h-10 w-10 text-slate-200" />
              <p className="font-medium">ยังไม่มีข้อมูลคำถามที่พบบ่อย</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className={cn(
                  "p-5 bg-white rounded-2xl border transition-all active:scale-[0.98] shadow-sm",
                  isSelected(faq.id)
                    ? "border-blue-200 bg-blue-50/30"
                    : "border-slate-200",
                )}
                onClick={() => toggleSelect(faq.id)}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Checkbox
                      checked={isSelected(faq.id)}
                      onCheckedChange={() => toggleSelect(faq.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-md mt-1"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          #{faq.sort_order ?? "-"}
                        </span>
                        {faq.is_active ? (
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] h-5 px-1.5 py-0">
                            ใช้งาน
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-50 text-slate-400 border-slate-100 text-[10px] h-5 px-1.5 py-0">
                            ปิด
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 leading-tight">
                        {faq.question}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 gap-4">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      หมวดหมู่
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-slate-50/50 max-w-full truncate block whitespace-nowrap"
                    >
                      {faq.category || "ไม่มีหมวดหมู่"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-50 rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFaq(faq);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      แก้ไข
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 text-rose-600 border-rose-100 bg-rose-50/50 hover:bg-rose-50 rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmFaq(faq);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteConfirmFaq}
        onOpenChange={(open) => !open && setDeleteConfirmFaq(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบคำถาม</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบคำถาม{" "}
              <strong className="text-foreground">
                "{deleteConfirmFaq?.question}"
              </strong>
              ? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                if (deleteConfirmFaq) handleDelete(deleteConfirmFaq);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                "ยืนยันการลบ"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditFAQDialog
        faq={editingFaq}
        open={!!editingFaq}
        onOpenChange={(open) => !open && setEditingFaq(null)}
        onSuccess={() => {
          // You might already have a refresh mechanism, but reload is safe here
          window.location.reload();
        }}
      />
    </div>
  );
}
