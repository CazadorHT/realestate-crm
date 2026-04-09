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
import { Edit, ExternalLink, Users, Trash2, GripVertical, Loader2 } from "lucide-react";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeletePartnersAction } from "@/features/admin/partners-bulk-actions";
import { deletePartner, reorderPartnersAction } from "@/features/admin/partners-actions";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { EditPartnerDialog } from "./EditPartnerDialog";
import { cn } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

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

export function PartnersTable({ partners: initialPartners }: PartnersTableProps) {
  const router = useRouter();
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
    const pageSize = 10;
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
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
        setPartners(initialPartners); // Rollback
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนตำแหน่ง");
      setPartners(initialPartners); // Rollback
    }
  };

  const handleSuccessFeedback = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("success", "true");
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
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
          toast.error(result.message || "เกิดข้อผิดพลาด");
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
            toast.error(res.message || "เกิดข้อผิดพลาดในการลบ");
          }
        } catch (error: any) {
          toast.error(error.message || "เกิดข้อผิดพลาดในการลบ");
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
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        entityName="พาร์ทเนอร์"
        className={isPending ? "opacity-50 pointer-events-none" : ""}
      />

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
                    aria-label="เลือกทั้งหมด"
                    className={
                      isPartialSelected
                        ? "data-[state=checked]:bg-primary/50"
                        : "rounded-md"
                    }
                  />
                </TableHead>
                <TableHead className="w-[100px] font-bold text-slate-900 px-6 uppercase tracking-wider text-[11px]">
                  ลำดับ
                </TableHead>
                <TableHead className="w-[140px] font-bold text-slate-900 px-6 uppercase tracking-wider text-[11px]">
                  โลโก้
                </TableHead>
                <TableHead className="font-bold text-slate-900 px-6 uppercase tracking-wider text-[11px]">
                  ชื่อพาร์ทเนอร์
                </TableHead>
                <TableHead className="font-bold text-slate-900 px-6 uppercase tracking-wider text-[11px]">
                  เว็บไซต์
                </TableHead>
                <TableHead className="font-bold text-slate-900 px-6 uppercase tracking-wider text-[11px]">
                  สถานะ
                </TableHead>
                <TableHead className="text-right font-bold text-slate-900 px-6 uppercase tracking-wider text-[11px]">
                  จัดการ
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
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
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase">
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
                        <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center shrink-0 shadow-inner">
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
                      <span className="text-xs text-slate-300 italic">
                        ไม่มีเว็บไซต์
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 px-4 text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100 rounded-xl font-medium transition-all active:scale-95"
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
                      className="h-10 w-10 text-rose-600 border-rose-100 bg-rose-50/50 hover:bg-rose-100 rounded-xl transition-all active:scale-95"
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

      {/* Dialogs */}
      <ResponsiveDialog
        open={!!deleteConfirmPartner}
        onOpenChange={(open) => !open && setDeleteConfirmPartner(null)}
        title="ยืนยันการลบพาร์ทเนอร์"
        description={
          deleteConfirmPartner ? (
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบพาร์ทเนอร์{" "}
              <strong className="text-slate-900 font-bold">
                "{deleteConfirmPartner.name}"
              </strong>{" "}
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
          ) : ""
        }
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeleteConfirmPartner(null)}
              className="flex-1 rounded-xl h-12 font-bold text-slate-500 border-slate-200"
            >
              ยกเลิก
            </Button>
            <Button
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                if (deleteConfirmPartner) handleDelete(deleteConfirmPartner);
              }}
              className="flex-1 rounded-xl h-12 px-8 font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-100 transition-all active:scale-95 border-none"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-white" />
                  กำลังลบ...
                </>
              ) : (
                "ยืนยันการลบ"
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
}

function SortablePartnerRow({ 
  partner, 
  isSelected, 
  toggleSelect, 
  onEdit, 
  onDelete, 
  isSearchActive 
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: partner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        "group hover:bg-slate-50/80 transition-all duration-200",
        isSelected && "bg-blue-50/50",
        isDragging && "shadow-xl bg-white border-2 border-blue-100 ring-4 ring-blue-500/10"
      )}
    >
      <TableCell className="w-[40px] px-6 text-center">
        {!isSearchActive && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-2 text-slate-300 hover:text-blue-500 transition-colors"
          >
            <GripVertical className="w-5 h-5" />
          </div>
        )}
      </TableCell>
      <TableCell className="w-[60px] px-2 text-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={toggleSelect}
          aria-label={`เลือก ${partner.name}`}
          className="rounded-md"
        />
      </TableCell>
      <TableCell className="font-mono text-[13px] text-slate-500 px-6 font-medium">
        {partner.sort_order ?? "-"}
      </TableCell>
      <TableCell className="px-6">
        <div className="h-10 w-24 relative bg-slate-50 rounded-lg border border-slate-100 p-1 flex items-center justify-center shadow-inner group-hover:bg-white transition-colors">
          <img
            src={partner.logo_url}
            alt={partner.name}
            className="h-full w-full object-contain"
          />
        </div>
      </TableCell>
      <TableCell className="font-bold text-slate-900 px-6 text-sm">
        {partner.name}
      </TableCell>
      <TableCell className="px-6">
        {partner.website_url ? (
          <a
            href={partner.website_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline text-xs font-bold transition-colors"
          >
            ไปที่เว็บ <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <span className="text-slate-300 italic text-xs">ไม่มีเว็บไซต์</span>
        )}
      </TableCell>
      <TableCell className="px-6">
        {partner.is_active ? (
          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/80 transition-colors text-[10px] uppercase font-bold px-2 py-0.5">
            ใช้งาน
          </Badge>
        ) : (
          <Badge className="bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100/80 transition-colors text-[10px] uppercase font-bold px-2 py-0.5">
            ปิดใช้งาน
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right px-6">
        <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
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
    </TableRow>
  );
}
