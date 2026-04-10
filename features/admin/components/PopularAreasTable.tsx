"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Pencil,
  Trash2,
  Loader2,
  MapPin,
  Languages,
  GripVertical,
  TriangleAlert,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  bulkTranslatePopularAreasAction,
  deletePopularArea,
  reorderPopularAreasAction,
} from "@/features/admin/popular-areas-actions";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeletePopularAreasAction } from "@/features/admin/popular-areas-bulk-actions";
import { cn } from "@/lib/utils";
import { EditPopularAreaDialog } from "./EditPopularAreaDialog";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { PopularAreaPropertiesDialog } from "./PopularAreaPropertiesDialog";
import { useTenant } from "@/components/providers/TenantProvider";
import { Info } from "lucide-react";

// DnD Kit imports
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

export type PopularArea = {
  id: string;
  name: string;
  province?: string | null;
  name_en?: string | null;
  name_cn?: string | null;
  created_at?: string | null;
  property_count?: number | null;
  featured?: boolean | null;
  is_active?: boolean | null;
  slug?: string | null;
  image_url?: string | null;
  sort_order: number | null;
};

interface SortableRowProps {
  item: PopularArea;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (item: PopularArea) => void;
  onDelete: (item: PopularArea) => void;
  onViewProperties: (item: PopularArea) => void;
  isDraggingEnabled: boolean;
  start: number;
}

function SortableRow({
  item,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onViewProperties,
  isDraggingEnabled,
  start,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    position: "relative" as any,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        "group hover:bg-slate-50/80 transition-all duration-200",
        isSelected ? "bg-blue-50/50" : "",
        isDragging ? "bg-white shadow-2xl opacity-40 scale-[1.01] pointer-events-none" : ""
      )}
    >
      <TableCell className="px-6 py-4">
        <div className="flex items-center gap-3">
          {isDraggingEnabled && (
            <div
              {...attributes}
              {...listeners}
              className="p-2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-600 transition-colors rounded-lg hover:bg-white border border-transparent hover:border-slate-100 shrink-0"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(item.id)}
            className="rounded-md"
          />
        </div>
      </TableCell>
      <TableCell className="font-mono text-[10px] text-slate-400 px-6">
        #{start + index + 1}
      </TableCell>
      <TableCell className="px-6">
        <div className="flex items-center gap-3">
          {item.image_url ? (
            <div className="h-10 w-10 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shrink-0 shadow-sm">
              <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shrink-0">
               <MapPin className="h-5 w-5" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 leading-none truncate max-w-[150px]">{item.name}</span>
            <span className="text-[10px] text-blue-600 font-bold mt-1 uppercase tracking-tight">{item.province}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-slate-600 px-6 font-medium text-sm">
        {item.name_en || <span className="text-slate-300">-</span>}
      </TableCell>
      <TableCell className="text-slate-600 px-6 font-medium text-sm">
        {item.name_cn || <span className="text-slate-300">-</span>}
      </TableCell>
      <TableCell className="px-6 text-center">
        <button
          type="button"
          disabled={(item.property_count || 0) === 0}
          onClick={(e) => {
            e.stopPropagation();
            onViewProperties(item);
          }}
          className={cn(
            "inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset transition-all duration-200",
            (item.property_count || 0) > 0
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 cursor-pointer hover:scale-110 hover:shadow-sm active:scale-95"
              : "bg-slate-50 text-slate-500 ring-slate-400/20 cursor-not-allowed opacity-60",
          )}
        >
          {item.property_count || 0}
        </button>
      </TableCell>
      <TableCell className="text-right px-6">
        <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
            onClick={() => onEdit(item)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function PopularAreasTable({
  initialData,
  totalCount: initialTotal,
}: {
  initialData: PopularArea[];
  totalCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { activeTenant, isMultiTenantEnabled } = useTenant();
  const isGlobalMode = activeTenant?.id === "ALL";

  // URL-driven state
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page")) || 1;
  const sortBy = searchParams.get("sort") || "sort_order";
  const sortOrder = searchParams.get("order") || "asc";
  const pageSize = 10;

  const [data, setData] = useState(initialData);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setData(initialData);
    setTotalCount(initialTotal);
  }, [initialData, initialTotal]);

  // Dialog & Active states
  const [editingItem, setEditingItem] = useState<PopularArea | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<PopularArea | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAllAcrossSelected, setIsAllAcrossSelected] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [viewingAreaProperties, setViewingAreaProperties] = useState<PopularArea | null>(null);

  // Selection
  const allIds = useMemo(() => data.map((item) => item.id), [data]);
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

  useEffect(() => {
    if (!isAllSelected) setIsAllAcrossSelected(false);
  }, [isAllSelected, page, search]);

  // Sorting
  const toggleSort = (column: string) => {
    const params = new URLSearchParams(searchParams);
    if (sortBy === column) {
      params.set("order", sortOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sort", column);
      params.set("order", "asc");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />;
    return sortOrder === "asc" ? (
      <ChevronUp className="ml-2 h-3 w-3 text-indigo-600" />
    ) : (
      <ChevronDown className="ml-2 h-3 w-3 text-indigo-600" />
    );
  };

  // Drag & Drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = data.findIndex((item) => item.id === active.id);
      const newIndex = data.findIndex((item) => item.id === over?.id);
      const newData = arrayMove(data, oldIndex, newIndex);
      setData(newData);

      const offset = (page - 1) * pageSize;
      const ids = newData.map((item) => item.id);
      const res = await reorderPopularAreasAction(ids, offset);
      if (res.success) toast.success(res.message);
      else {
        toast.error(res.message);
        setData(initialData);
      }
    }
  };

  // Action Handlers
  const handleDelete = async () => {
    if (!deleteConfirmItem) return;
    setIsDeleting(true);
    const res = await deletePopularArea(deleteConfirmItem.id);
    setIsDeleting(false);
    if (res.success) {
      toast.success(res.message);
      setDeleteConfirmItem(null);
      router.refresh();
    } else toast.error(res.message);
  };

  const handleBulkDelete = async () => setIsBulkDeleteOpen(true);

  const executeBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    setIsDeleting(true);
    toast.promise(bulkDeletePopularAreasAction(ids, isAllAcrossSelected, search), {
      loading: "กำลังลบข้อมูลหลายรายการ...",
      success: (res) => {
        setIsDeleting(false);
        setIsBulkDeleteOpen(false);
        if (res.success) {
          clearSelection();
          setIsAllAcrossSelected(false);
          router.refresh();
          return res.message;
        }
        throw new Error(res.message);
      },
      error: (err) => {
        setIsDeleting(false);
        return err.message;
      },
    });
  };

  const handleBulkTranslate = async () => {
    setIsTranslating(true);
    const ids = isAllAcrossSelected ? undefined : Array.from(selectedIds);
    toast.promise(bulkTranslatePopularAreasAction(ids, isAllAcrossSelected, search), {
      loading: "กำลังใช้ AI แปลข้อมูล...",
      success: (res) => {
        setIsTranslating(false);
        if (res.success) {
          setIsAllAcrossSelected(false);
          clearSelection();
          router.refresh();
          return res.message;
        }
        throw new Error(res.message);
      },
      error: (err) => {
        setIsTranslating(false);
        return err.message;
      },
    });
  };

  const start = (page - 1) * pageSize;
  const isDraggingEnabled = !search && sortBy === "sort_order";

  return (
    <div className="space-y-4">
      {/* Selection Toolbar */}
      <BulkActionToolbar
        selectedCount={isAllAcrossSelected ? totalCount : selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        entityName="ทำเล"
        extraActions={
          <Button
            variant="outline"
            className="h-10 px-4 border-indigo-100 bg-white hover:text-indigo-600 text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl gap-2 text-xs"
            onClick={handleBulkTranslate}
            disabled={isTranslating}
          >
            <Languages className="h-4 w-4" />
            แปล ({isAllAcrossSelected ? totalCount : selectedCount})
          </Button>
        }
      />

      {/* Mode Indicator */}
      {isMultiTenantEnabled && (
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border animate-in slide-in-from-top-2 duration-500",
          isGlobalMode 
            ? "bg-indigo-50 border-indigo-100 text-indigo-700" 
            : "bg-emerald-50 border-emerald-100 text-emerald-700"
        )}>
          <Info className="h-3.5 w-3.5" />
          <span>
            กำลังแสดงยอดทรัพย์แบบ 
            <span className="font-bold underline underline-offset-2 mx-1">
              {isGlobalMode ? "ภาพรวมทุกสาขา (Global)" : `เฉพาะสาขา ${activeTenant?.name || "ปัจจุบัน"}`}
            </span>
            {isGlobalMode ? " • ตัวเลขรวมจากทรัพย์ที่มีอยู่ในทุกสาขา" : " • ตัวเลขเฉพาะทรัพย์ที่สังกัดสาขานี้เท่านั้น"}
          </span>
        </div>
      )}

     

      {/* Desktop Table */}
      <div className="hidden lg:block rounded-xl bg-white overflow-hidden shadow-sm border border-slate-200 animate-in fade-in duration-500">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className={cn("px-6", isDraggingEnabled ? "w-[120px]" : "w-[60px]")}>
                  <div className="flex items-center gap-3">
                    {isDraggingEnabled && <div className="w-8 shrink-0" />}
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={(checked) => {
                        toggleSelectAll(allIds);
                        if (!checked) setIsAllAcrossSelected(false);
                      }}
                      className={isPartialSelected ? "data-[state=checked]:bg-primary/50" : "rounded-md"}
                    />
                  </div>
                </TableHead>
                <TableHead className="w-[80px] font-bold text-slate-900 px-6 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSort("sort_order")}>
                  <div className="flex items-center">ลำดับ <SortIcon column="sort_order" /></div>
                </TableHead>
                <TableHead className="font-bold text-slate-900 px-6 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSort("name")}>
                  <div className="flex items-center">ชื่อพื้นที่ / จังหวัด <SortIcon column="name" /></div>
                </TableHead>
                <TableHead className="font-bold text-slate-900 px-6 text-sm">English (EN)</TableHead>
                <TableHead className="font-bold text-slate-900 px-6 text-sm">中文 (CN)</TableHead>
                <TableHead className="font-bold text-slate-900 px-6 text-center cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleSort("property_count")}>
                  <div className="flex items-center justify-center">จำนวนทรัพย์ <SortIcon column="property_count" /></div>
                </TableHead>
                <TableHead className="text-right font-bold text-slate-900 px-6">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isAllSelected && totalCount > data.length && (
                <TableRow className="bg-indigo-50/50 border-b border-indigo-100 hover:bg-indigo-50/80 transition-colors">
                  <TableCell colSpan={8} className="py-3 px-6 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <span className="text-slate-600 font-medium">เลือกทำเล {data.length} รายการในหน้านี้แล้ว</span>
                      <button 
                        onClick={() => setIsAllAcrossSelected(!isAllAcrossSelected)}
                        className="text-indigo-600 hover:text-indigo-700 font-bold underline underline-offset-4 cursor-pointer"
                      >
                        {isAllAcrossSelected ? "ยกเลิกการเลือกทั้งหมด" : `เลือกทำเลทั้งหมด ${totalCount} รายการ`}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-20 text-slate-400 bg-white font-medium">ไม่พบข้อมูลที่ต้องการ</TableCell></TableRow>
              ) : (
                <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
                  {data.map((item, index) => (
                    <SortableRow
                      key={item.id}
                      item={item}
                      index={index}
                      isSelected={isSelected(item.id)}
                      onSelect={toggleSelect}
                      onEdit={setEditingItem}
                      onDelete={setDeleteConfirmItem}
                      onViewProperties={setViewingAreaProperties}
                      isDraggingEnabled={!search && sortBy === "sort_order"}
                      start={start}
                    />
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3 animate-in fade-in duration-500">
        {data.map((item, index) => (
          <div key={item.id} className={cn("p-4 bg-white rounded-2xl border transition-all shadow-sm", isSelected(item.id) ? "border-indigo-200 bg-indigo-50/30" : "border-slate-200")} onClick={() => toggleSelect(item.id)}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3 min-w-0">
                <Checkbox checked={isSelected(item.id)} className="rounded-md mt-1" />
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-mono text-slate-400">#{start + index + 1}</span>
                       <button
                         type="button"
                         disabled={(item.property_count || 0) === 0}
                         onClick={(e) => {
                           e.stopPropagation();
                           setViewingAreaProperties(item);
                         }}
                         className={cn(
                           "text-[10px] px-2 py-0.5 rounded-full font-bold transition-all",
                           (item.property_count || 0) > 0
                             ? "bg-emerald-50 text-emerald-700 cursor-pointer active:scale-95"
                             : "bg-slate-50 text-slate-400 cursor-not-allowed"
                         )}
                       >
                         {item.property_count || 0} ทรัพย์
                       </button>
                    </div>
                   <h4 className="font-bold text-slate-900 truncate mt-1">{item.name}</h4>
                   <p className="text-xs text-blue-600 font-bold">{item.province}</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600 border-blue-50" onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}><Pencil className="h-3 w-3" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 text-rose-600 border-rose-50" onClick={(e) => { e.stopPropagation(); setDeleteConfirmItem(item); }}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalCount > pageSize && (
        <div className="pt-4"><PaginationControls currentPage={page} totalCount={totalCount} pageSize={pageSize} /></div>
      )}

      {/* Advanced Dialogs */}
      <PopularAreaPropertiesDialog
        area={viewingAreaProperties}
        open={!!viewingAreaProperties}
        onOpenChange={(open) => !open && setViewingAreaProperties(null)}
      />

      <EditPopularAreaDialog area={editingItem} open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)} onSuccess={() => router.refresh()} />

      <ResponsiveDialog open={!!deleteConfirmItem} onOpenChange={(open) => !open && setDeleteConfirmItem(null)} title="ยืนยันการลบทำเล" className="md:max-w-md">
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-2"><TriangleAlert className="h-6 w-6" /></div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">คุณแน่ใจหรือไม่?</h3>
            <p className="text-sm text-slate-500 mt-1">กำลังจะลบทำเล "<span className="font-bold text-slate-900">{deleteConfirmItem?.name}</span>" ข้อมูลนี้จะไม่สามารถกู้คืนได้</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl h-11 font-bold" onClick={() => setDeleteConfirmItem(null)}>ยกเลิก</Button>
            <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-11 font-bold" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยันการลบ"}
            </Button>
          </div>
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog open={isBulkDeleteOpen} onOpenChange={(open) => !open && !isDeleting && setIsBulkDeleteOpen(false)} title={isAllAcrossSelected ? "⚠️ ยืนยันการลบข้อมูลทั้งหมด" : "ยืนยันการลบหลายรายการ"} className="md:max-w-md">
        <div className="p-6 text-center space-y-4">
          <div className={cn("mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-2 animate-pulse", isAllAcrossSelected ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600")}><TriangleAlert className="h-8 w-8" /></div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">{isAllAcrossSelected ? "ลบข้อมูลทั้งหมดในระบบ!" : "ยืนยันการลบที่เลือก"}</h3>
            <p className="text-sm text-slate-500 mt-2">คุณกำลังจะลบทำเลจำนวน <span className="font-bold text-rose-600 text-lg">{isAllAcrossSelected ? totalCount : selectedCount}</span> รายการ {isAllAcrossSelected && "จากทุกหน้าเพจ"} ข้อมูลเบสนี้จะถูกลบออกถาวรและไม่สามารถกู้คืนได้</p>
            {isAllAcrossSelected && <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-bold font-mono uppercase tracking-widest">High Risk Action Required</div>}
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold" onClick={() => setIsBulkDeleteOpen(false)} disabled={isDeleting}>ยกเลิก</Button>
            <Button className={cn("flex-1 text-white rounded-xl h-12 font-bold shadow-lg shadow-rose-200 transition-all", isAllAcrossSelected ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-900 hover:bg-black")} onClick={executeBulkDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยันการลบ"}
            </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
