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
import { Edit, ExternalLink, Users, Trash2 } from "lucide-react";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeletePartnersAction } from "@/features/admin/partners-bulk-actions";
import { deletePartner } from "@/features/admin/partners-actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PartnerForm } from "./PartnerForm";
import { cn } from "@/lib/utils";

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

interface PartnersTableProps {
  partners: Partner[];
}

export function PartnersTable({ partners }: PartnersTableProps) {
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deleteConfirmPartner, setDeleteConfirmPartner] =
    useState<Partner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const allIds = useMemo(() => partners?.map((p) => p.id) || [], [partners]);
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
    const result = await bulkDeletePartnersAction(ids);
    if (result.success) {
      toast.success(result.message);
      clearSelection();
      window.location.reload();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleDelete = async (partner: Partner) => {
    setIsDeleting(true);
    try {
      const res = await deletePartner(partner.id);
      if (res.success) {
        toast.success(res.message);
        window.location.reload();
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาดในการลบ");
      }
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการลบ");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmPartner(null);
    }
  };

  const handleEditSuccess = () => {
    setEditingPartner(null);
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        entityName="พาร์ทเนอร์"
      />

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="w-[60px] px-6">
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
              <TableHead className="w-[140px] font-bold text-slate-900 px-6">
                โลโก้
              </TableHead>
              <TableHead className="font-bold text-slate-900 px-6">
                ชื่อพาร์ทเนอร์
              </TableHead>
              <TableHead className="font-bold text-slate-900 px-6">
                เว็บไซต์
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
            {!partners || partners.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-20 text-slate-400 bg-white"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-slate-50 rounded-full">
                      <Users className="h-10 w-10 text-slate-200" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-600">
                        ยังไม่มีข้อมูลพาร์ทเนอร์
                      </p>
                      <p className="text-sm">
                        เริ่มต้นเพิ่มพาร์ทเนอร์รายแรกของคุณ
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              partners.map((partner) => (
                <TableRow
                  key={partner.id}
                  className={`group hover:bg-slate-50/80 transition-all duration-200 ${isSelected(partner.id) ? "bg-blue-50/50" : ""}`}
                >
                  <TableCell className="w-[60px] px-6">
                    <Checkbox
                      checked={isSelected(partner.id)}
                      onCheckedChange={() => toggleSelect(partner.id)}
                      aria-label={`เลือก ${partner.name}`}
                      className="rounded-md"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm text-slate-500 px-6">
                    {partner.sort_order ?? "-"}
                  </TableCell>
                  <TableCell className="px-6">
                    <div className="h-10 w-24 relative bg-slate-50 rounded-lg border border-slate-100 p-1 flex items-center justify-center">
                      <img
                        src={partner.logo_url}
                        alt={partner.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-slate-900 px-6">
                    {partner.name}
                  </TableCell>
                  <TableCell className="px-6">
                    {partner.website_url ? (
                      <a
                        href={partner.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium transition-colors"
                      >
                        เยี่ยมชมเว็บไซต์{" "}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </TableCell>
                  <TableCell className="px-6">
                    {partner.is_active ? (
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
                        onClick={() => setEditingPartner(partner)}
                      >
                        <Edit className="w-4.5 h-4.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => setDeleteConfirmPartner(partner)}
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
        {!partners || partners.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 font-medium">
            <div className="flex flex-col items-center gap-3">
              <Users className="h-10 w-10 text-slate-200" />
              <p>ยังไม่มีข้อมูลพาร์ทเนอร์</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className={cn(
                  "p-5 bg-white rounded-2xl border transition-all active:scale-[0.98] shadow-sm",
                  isSelected(partner.id)
                    ? "border-blue-200 bg-blue-50/30"
                    : "border-slate-200",
                )}
                onClick={() => toggleSelect(partner.id)}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <Checkbox
                      checked={isSelected(partner.id)}
                      onCheckedChange={() => toggleSelect(partner.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-md mt-1.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          ลำดับ #{partner.sort_order ?? "-"}
                        </span>
                        {partner.is_active ? (
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] h-5 px-1.5 py-0">
                            ใช้งาน
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-50 text-slate-400 border-slate-100 text-[10px] h-5 px-1.5 py-0">
                            ปิด
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center shrink-0">
                          <img
                            src={partner.logo_url}
                            alt={partner.name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <h4 className="font-bold text-slate-900 leading-tight line-clamp-2">
                          {partner.name}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 gap-4">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      เว็บไซต์
                    </span>
                    {partner.website_url ? (
                      <a
                        href={partner.website_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-semibold text-blue-600 truncate flex items-center gap-1.5 hover:underline"
                      >
                        เยี่ยมชม <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-300">
                        ไม่มีเว็บไซต์
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 px-4 text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-50 rounded-xl font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPartner(partner);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      แก้ไข
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 text-rose-600 border-rose-100 bg-rose-50/50 hover:bg-rose-50 rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmPartner(partner);
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
        open={!!deleteConfirmPartner}
        onOpenChange={(open) => !open && setDeleteConfirmPartner(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบพาร์ทเนอร์</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบพาร์ทเนอร์{" "}
              <strong className="text-foreground">
                "{deleteConfirmPartner?.name}"
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
                if (deleteConfirmPartner) handleDelete(deleteConfirmPartner);
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

      <Dialog
        open={!!editingPartner}
        onOpenChange={(open) => !open && setEditingPartner(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลพาร์ทเนอร์</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            {editingPartner && (
              <PartnerForm
                initialData={editingPartner}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingPartner(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
