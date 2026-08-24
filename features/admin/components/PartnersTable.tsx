"use client";

import { useMemo, useTransition, useState, useEffect } from "react";
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
import { Edit, ExternalLink, Trash2, GripVertical, Loader2, Link2, PlusCircle, LayoutGrid } from "lucide-react";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeletePartnersAction } from "@/features/admin/partners-bulk-actions";
import { deletePartner, reorderPartnersAction } from "@/features/admin/partners-actions";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { EditPartnerDialog } from "./EditPartnerDialog";
import { cn } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getChannelStyle, BrandIcon } from "@/features/admin/partners-utils";
import { useLanguage } from "@/lib/i18n/language-context";

// Dnd Kit Imports
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { PartnerRow } from "@/features/admin/partners-actions";

type Partner = PartnerRow;

interface PartnersTableProps {
  partners: Partner[];
  isSuperAdmin?: boolean;
  onRefresh?: () => void;
}

export function PartnersTable({ 
  partners: initialPartners,
  isSuperAdmin = false,
  onRefresh
}: PartnersTableProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const isEn = language === "en";
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSearchActive = !!searchParams.get("q");

  const [partners, setPartners] = useState<Partner[]>(initialPartners);
  const [isPending, startTransition] = useTransition();
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deleteConfirmPartner, setDeleteConfirmPartner] =
    useState<Partner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync with props
  useEffect(() => {
    setPartners(initialPartners);
  }, [initialPartners]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = partners.findIndex((p) => p.id === active.id);
    const newIndex = partners.findIndex((p) => p.id === over.id);

    const currentPage = parseInt(searchParams.get("page") || "1");
    const pageSize = 100;
    const offset = (currentPage - 1) * pageSize;

    const movedArray = arrayMove(partners, oldIndex, newIndex);
    const newOrder = movedArray.map((p, i) => ({
      ...p,
      sort_order: offset + i + 1
    }));
    
    // Optimistic Update
    setPartners(newOrder);

    try {
      const ids = newOrder.map((p) => p.id);
      const result = await reorderPartnersAction(ids, offset);
      if (result.success) {
        toast.success(isEn ? "Channels reordered successfully" : "ปรับลำดับช่องทางเรียบร้อยแล้ว");
        if (onRefresh) {
          onRefresh();
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.message || (isEn ? "Failed to reorder channels" : "เกิดข้อผิดพลาดในการเปลี่ยนตำแหน่ง"));
        setPartners(initialPartners); // Rollback
      }
    } catch (error) {
      toast.error(isEn ? "Failed to reorder channels" : "เกิดข้อผิดพลาดในการเปลี่ยนตำแหน่ง");
      setPartners(initialPartners); // Rollback
    }
  };

  const handleSuccessFeedback = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      router.refresh();
    }
  };

  const handleBulkDelete = async () => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const ids = Array.from(selectedIds);
        const result = await bulkDeletePartnersAction(ids);
        if (result.success) {
          toast.success(result.message);
          clearSelection();
          handleSuccessFeedback();
        } else {
          toast.error(result.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"));
        }
        resolve();
      });
    });
  };

  const handleDelete = async (partner: Partner) => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        setIsDeleting(true);
        try {
          const res = await deletePartner(partner.id);
          if (res.success) {
            toast.success(res.message);
            handleSuccessFeedback();
          } else {
            toast.error(res.message || (isEn ? "Failed to delete" : "เกิดข้อผิดพลาดในการลบ"));
          }
        } catch (error: any) {
          toast.error(error.message || (isEn ? "Failed to delete" : "เกิดข้อผิดพลาดในการลบ"));
        } finally {
          setIsDeleting(false);
          setDeleteConfirmPartner(null);
          resolve();
        }
      });
    });
  };

  const handleEditSuccess = () => {
    setEditingPartner(null);
    handleSuccessFeedback();
  };

  return (
    <div className="space-y-4">
      {isSuperAdmin && (
        <BulkActionToolbar
          selectedCount={selectedCount}
          onClear={clearSelection}
          onDelete={handleBulkDelete}
          entityName={isEn ? "channels" : "ช่องทาง"}
          className={isPending ? "opacity-50 pointer-events-none" : ""}
        />
      )}

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-transparent">
                <TableHead className="w-[40px] px-6 text-center">
                  {/* Grip Column */}
                </TableHead>
                <TableHead className="w-[60px] px-2 text-center text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={() => toggleSelectAll(allIds)}
                    aria-label={isEn ? "Select all" : "เลือกทั้งหมด"}
                    className={
                      isPartialSelected
                        ? "data-[state=checked]:bg-primary/50"
                        : "rounded-md"
                    }
                  />
                </TableHead>
                <TableHead className="w-[100px] font-bold text-slate-900 px-6 uppercase tracking-wider text-[11px]">
                  {isEn ? "Order" : "ลำดับ"}
                </TableHead>
                <TableHead className="font-bold text-slate-900 px-6 uppercase tracking-wider text-[11px]">
                  {isEn ? "Badge Preview" : "รูปแบบการแสดง Badges"}
                </TableHead>
                <TableHead className="font-bold text-slate-900 px-6 uppercase tracking-wider text-[11px]">
                  {isEn ? "Destination Link" : "ลิงก์เชื่อมโยง"}
                </TableHead>
                <TableHead className="font-bold text-slate-900 px-6 uppercase tracking-wider text-[11px]">
                  {isEn ? "Homepage Status" : "สถานะหน้าแรก"}
                </TableHead>
                {isSuperAdmin && (
                  <TableHead className="text-right font-bold text-slate-900 px-6 uppercase tracking-wider text-[11px]">
                    {isEn ? "Actions" : "จัดการ"}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-20 text-slate-450 bg-white"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <LayoutGrid className="h-10 w-10 text-slate-300" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-700">
                          {isEn ? "No marketing channels found" : "ยังไม่มีข้อมูลช่องทางการตลาด"}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                          {isEn ? "Get started by adding your first promotional channel badge" : "คุณสามารถเริ่มต้นโดยการคลิกปุ่ม เพิ่มช่องทาง เพื่อเริ่มสร้างช่องทางใหม่"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext
                  items={allIds}
                  strategy={verticalListSortingStrategy}
                  disabled={isSearchActive}
                >
                  {partners.map((partner) => (
                    <SortablePartnerRow
                      key={partner.id}
                      partner={partner}
                      isSelected={isSelected(partner.id)}
                      toggleSelect={() => toggleSelect(partner.id)}
                      onEdit={() => setEditingPartner(partner)}
                      onDelete={() => setDeleteConfirmPartner(partner)}
                      isSearchActive={isSearchActive}
                      isSuperAdmin={isSuperAdmin}
                      isEn={isEn}
                    />
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Mobile & Tablet Card View */}
      <div className="lg:hidden space-y-4 animate-in fade-in duration-500">
        {!partners || partners.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 font-medium">
            <div className="flex flex-col items-center gap-3">
              <LayoutGrid className="h-10 w-10 text-slate-355" />
              <p>{isEn ? "No marketing channels found" : "ยังไม่มีข้อมูลช่องทางการตลาด"}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partners.map((partner) => {
              const stylePreset = getChannelStyle(partner.name);
              return (
                <div
                  key={partner.id}
                  className={cn(
                    "p-5 bg-white rounded-2xl border transition-all active:scale-[0.98] shadow-xs",
                    isSelected(partner.id)
                      ? "border-rose-200 bg-rose-50/20"
                      : "border-slate-200",
                  )}
                  onClick={() => toggleSelect(partner.id)}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4 min-w-0 w-full">
                      <Checkbox
                        checked={isSelected(partner.id)}
                        onCheckedChange={() => toggleSelect(partner.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-md mt-1.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase font-bold">
                            {isEn ? `Order #${partner.sort_order ?? "-"}` : `ลำดับ #${partner.sort_order ?? "-"}`}
                          </span>
                          {partner.is_active ? (
                            <Badge className="bg-emerald-50 hover:bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] h-5 px-1.5 py-0 font-bold">
                              {isEn ? "Active" : "เปิดใช้งาน"}
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-50 hover:bg-slate-50 text-slate-400 border-slate-200 text-[10px] h-5 px-1.5 py-0 font-bold">
                              {isEn ? "Inactive" : "ปิดใช้งาน"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center">
                          <div className={cn(
                            "inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-bold shadow-xs transition-all duration-300",
                            stylePreset.bg,
                            stylePreset.text,
                            stylePreset.border
                          )}>
                            <BrandIcon name={partner.name} className="w-4.5 h-4.5 shrink-0" />
                            <span>{partner.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-4">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        {isEn ? "Destination Link" : "ลิงก์เชื่อมโยง"}
                      </span>
                      {partner.website_url ? (
                        <a
                          href={partner.website_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-bold text-blue-600 truncate flex items-center gap-1 hover:underline"
                        >
                          {partner.website_url} <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-350 italic">
                          {isEn ? "No destination URL" : "ไม่มีเว็บไซต์ปลายทาง"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSuperAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPartner(partner);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1.5" />
                            {isEn ? "Edit" : "แก้ไข"}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 text-rose-600 border-rose-100 bg-rose-50/50 hover:bg-rose-100 rounded-xl transition-all active:scale-95 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmPartner(partner);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ResponsiveDialog
        open={!!deleteConfirmPartner}
        onOpenChange={(open) => !open && setDeleteConfirmPartner(null)}
        title={isEn ? "Confirm Channel Deletion" : "ยืนยันการลบช่องทางการตลาด"}
        description={
          deleteConfirmPartner ? (
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              {isEn ? (
                <>
                  Are you sure you want to delete{" "}
                  <strong className="text-slate-900 font-bold">
                    "{deleteConfirmPartner.name}"
                  </strong>
                  ? It will be removed immediately from the public homepage and cannot be recovered.
                </>
              ) : (
                <>
                  คุณแน่ใจหรือไม่ว่าต้องการลบช่องทางการตลาด{" "}
                  <strong className="text-slate-900 font-bold">
                    "{deleteConfirmPartner.name}"
                  </strong>{" "}
                  การลบข้อมูลนี้จะถูกย้ายออกจากหน้าแรกทันที และไม่สามารถกู้คืนข้อมูลกลับมาได้
                </>
              )}
            </p>
          ) : ""
        }
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full mt-4">
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeleteConfirmPartner(null)}
              className="flex-1 rounded-xl h-11 font-bold text-slate-500 border-slate-200 cursor-pointer"
            >
              {isEn ? "Cancel" : "ยกเลิก"}
            </Button>
            <Button
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                if (deleteConfirmPartner) handleDelete(deleteConfirmPartner);
              }}
              className="flex-1 rounded-xl px-8 font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-200 transition-all active:scale-95 border-none h-11 cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-white" />
                  {isEn ? "Deleting..." : "กำลังลบ..."}
                </>
              ) : (
                isEn ? "Confirm Delete" : "ยืนยันการลบ"
              )}
            </Button>
          </div>
        }
      />

      <EditPartnerDialog
        partner={editingPartner}
        open={!!editingPartner}
        onOpenChange={(open) => !open && setEditingPartner(null)}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}

// Separate Component for Sortable Row
interface SortableRowProps {
  partner: Partner;
  isSelected: boolean;
  toggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isSearchActive: boolean;
  isSuperAdmin: boolean;
  isEn: boolean;
}

function SortablePartnerRow({ 
  partner, 
  isSelected, 
  toggleSelect, 
  onEdit, 
  onDelete, 
  isSearchActive,
  isSuperAdmin,
  isEn,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: partner.id,
    disabled: !isSuperAdmin
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.6 : 1,
  };

  const stylePreset = getChannelStyle(partner.name);

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        "group hover:bg-slate-50/50 transition-all duration-200",
        isSelected && "bg-rose-50/10",
        isDragging && "shadow-xl bg-white border-2 border-rose-100 ring-4 ring-rose-500/5"
      )}
    >
      <TableCell className="w-[40px] px-6 text-center">
        {!isSearchActive && isSuperAdmin && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-2 text-slate-300 hover:text-rose-500 transition-colors"
          >
            <GripVertical className="w-5 h-5" />
          </div>
        )}
      </TableCell>
      <TableCell className="w-[60px] px-2 text-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={toggleSelect}
          aria-label={isEn ? `Select ${partner.name}` : `เลือก ${partner.name}`}
          className="rounded-md"
        />
      </TableCell>
      <TableCell className="font-mono text-[13px] text-slate-500 px-6 font-bold">
        {partner.sort_order ?? "-"}
      </TableCell>
      <TableCell className="px-6 py-4">
        <div className="flex items-center">
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold shadow-xs transition-all duration-300",
            stylePreset.bg,
            stylePreset.text,
            stylePreset.border
          )}>
            <BrandIcon name={partner.name} className="w-4.5 h-4.5 shrink-0" />
            <span>{partner.name}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-6">
        {partner.website_url ? (
          <a
            href={partner.website_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline text-xs font-bold transition-colors"
          >
            {partner.website_url} <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        ) : (
          <span className="text-slate-350 italic text-xs">{isEn ? "No link attached" : "ไม่มีเว็บไซต์เชื่อมโยง"}</span>
        )}
      </TableCell>
      <TableCell className="px-6">
        {partner.is_active ? (
          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/80 transition-colors text-[10px] uppercase font-bold px-2.5 py-0.5">
            {isEn ? "Active" : "เปิดใช้งาน"}
          </Badge>
        ) : (
          <Badge className="bg-slate-55 text-slate-400 border-slate-200 hover:bg-slate-100/80 transition-colors text-[10px] uppercase font-bold px-2.5 py-0.5">
            {isEn ? "Inactive" : "ปิดใช้งาน"}
          </Badge>
        )}
      </TableCell>
      {isSuperAdmin && (
        <TableCell className="text-right px-6">
          <div className="flex justify-end gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-all active:scale-90"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit className="w-4.5 h-4.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-all active:scale-90"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-4.5 h-4.5" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
