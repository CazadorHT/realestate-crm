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

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
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
              <TableHead className="w-[80px]">ลำดับการแสดง</TableHead>
              <TableHead className="w-[120px]">โลโก้</TableHead>
              <TableHead>ชื่อพาร์ทเนอร์</TableHead>
              <TableHead>เว็บไซต์</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!partners || partners.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-10 text-slate-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-12 w-12 text-slate-300" />
                    <p>ยังไม่มีข้อมูลพาร์ทเนอร์</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              partners.map((partner) => (
                <TableRow
                  key={partner.id}
                  className={isSelected(partner.id) ? "bg-blue-50/50" : ""}
                >
                  <TableCell className="w-[50px]">
                    <Checkbox
                      checked={isSelected(partner.id)}
                      onCheckedChange={() => toggleSelect(partner.id)}
                      aria-label={`เลือก ${partner.name}`}
                    />
                  </TableCell>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => setEditingPartner(partner)}
                      >
                        <Edit className="w-4 h-4 " />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => setDeleteConfirmPartner(partner)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
