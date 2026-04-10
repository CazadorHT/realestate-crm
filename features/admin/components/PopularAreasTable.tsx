"use client";

import { useState, useMemo, useEffect, useCallback, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Pencil,
  Trash2,
  Loader2,
  MapPin,
  Search,
  Languages,
  GripVertical,
  TriangleAlert,
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

// DnD Kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  defaultAnnouncements,
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

type PopularArea = {
  id: string;
  name: string;
  province: string | null;
  name_en?: string | null;
  name_cn?: string | null;
  created_at: string;
  property_count?: number;
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
            <span className="font-bold text-slate-900 leading-none">{item.name}</span>
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
        <span
          className={cn(
            "inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset",
            (item.property_count || 0) > 0
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
              : "bg-slate-50 text-slate-500 ring-slate-400/20",
          )}
        >
          {item.property_count || 0}
        </span>
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

  // URL-driven state
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

  const [data, setData] = useState(initialData);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setData(initialData);
    setTotalCount(initialTotal);
  }, [initialData, initialTotal]);

  // Dialog states
  const [editingItem, setEditingItem] = useState<PopularArea | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<PopularArea | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // Search handling
  const [searchValue, setSearchValue] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== search) {
        const params = new URLSearchParams(searchParams);
        if (searchValue) params.set("search", searchValue);
        else params.delete("search");
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchValue, search, searchParams, pathname, router]);

  // Bulk selection
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

  // Reordering (DnD)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = data.findIndex((item) => item.id === active.id);
      const newIndex = data.findIndex((item) => item.id === over?.id);

      const newData = arrayMove(data, oldIndex, newIndex);
      setData(newData);

      // Persist reorder (Atomic Upsert)
      const offset = (page - 1) * pageSize;
      const ids = newData.map((item) => item.id);
      
      const res = await reorderPopularAreasAction(ids, offset);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
        setData(initialData); // Rollback on error
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmItem) return;
    setIsDeleting(true);
    const res = await deletePopularArea(deleteConfirmItem.id);
    setIsDeleting(false);
    if (res.success) {
      toast.success(res.message);
      setDeleteConfirmItem(null);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    toast.promise(bulkDeletePopularAreasAction(ids), {
      loading: "กำลังลบข้อมูล...",
      success: (res) => {
        if (res.success) {
          clearSelection();
          router.refresh();
          return res.message;
        }
        throw new Error(res.message);
      },
      error: (err) => err.message,
    });
  };

  const handleBulkTranslate = async () => {
    setIsTranslating(true);
    const ids = selectedCount > 0 ? Array.from(selectedIds) : undefined;
    toast.promise(bulkTranslatePopularAreasAction(ids), {
      loading: "กำลังใช้ AI แปลข้อมูล...",
      success: (res) => {
        setIsTranslating(false);
        if (res.success) {
          router.refresh();
          clearSelection();
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

  return (
    <div className="space-y-4">
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        entityName="ทำเล"
        extraActions={
           <Button
            variant="outline"
            className="h-10 px-4 border-indigo-100 bg-white text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl gap-2 text-xs"
            onClick={handleBulkTranslate}
            disabled={isTranslating}
          >
            <Languages className="h-4 w-4" />
            แปลภาษา ({selectedCount})
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-5 border border-slate-200 shadow-sm rounded-2xl animate-in fade-in duration-500">
        <div className="flex items-center gap-4 text-left">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              ทำเลยอดนิยม ({totalCount})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              จัดการลำดับและข้อมูลสำคัญสำหรับหน้าบ้าน
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!search && selectedCount === 0 && (
            <Button
              variant="outline"
              className="hidden md:flex h-11 px-5 border-indigo-100 bg-indigo-50/30 text-indigo-600 hover:bg-indigo-50 cursor-pointer rounded-xl transition-all shadow-sm items-center gap-2 group font-bold"
              onClick={handleBulkTranslate}
              disabled={isTranslating || data.length === 0}
            >
              <Languages className="h-4 w-4" />
              แปลภาษาทั้งหมด
            </Button>
          )}

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ค้นหาทำเล..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="hidden lg:block rounded-xl bg-white overflow-hidden shadow-sm border border-slate-200 animate-in fade-in duration-500">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[100px] px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 shrink-0" /> {/* Grip spacer */}
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={() => toggleSelectAll(allIds)}
                      className={isPartialSelected ? "data-[state=checked]:bg-primary/50" : "rounded-md"}
                    />
                  </div>
                </TableHead>
                <TableHead className="w-[80px] font-bold text-slate-900 px-6">ลำดับ</TableHead>
                <TableHead className="font-bold text-slate-900 px-6">ชื่อพื้นที่ / จังหวัด</TableHead>
                <TableHead className="font-bold text-slate-900 px-6 text-sm">English (EN)</TableHead>
                <TableHead className="font-bold text-slate-900 px-6 text-sm">中文 (CN)</TableHead>
                <TableHead className="font-bold text-slate-900 px-6 text-center">จำนวนทรัพย์</TableHead>
                <TableHead className="text-right font-bold text-slate-900 px-6">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-slate-400 bg-white">
                    ไม่พบข้อมูลที่ต้องการ
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
                  {data.map((item, index) => (
                    <SortableRow
                      key={item.id}
                      item={item}
                      index={index}
                      start={start}
                      isSelected={isSelected(item.id)}
                      onSelect={toggleSelect}
                      onEdit={setEditingItem}
                      onDelete={setDeleteConfirmItem}
                      isDraggingEnabled={!search}
                    />
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4 animate-in fade-in duration-500">
        {data.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "p-5 bg-white rounded-2xl border transition-all shadow-sm",
              isSelected(item.id) ? "border-indigo-200 bg-indigo-50/30" : "border-slate-200"
            )}
            onClick={() => toggleSelect(item.id)}
          >
            <div className="flex items-start justify-between gap-4">
               <div className="flex gap-4 min-w-0">
                  <div className="pt-1">
                    <Checkbox checked={isSelected(item.id)} className="rounded-md" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-slate-400">#{start + index + 1}</span>
                    <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                    <p className="text-xs text-blue-600 font-bold">{item.province}</p>
                    <div className="flex gap-2 mt-2">
                       <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                        {item.property_count || 0} ทรัพย์
                       </span>
                    </div>
                  </div>
               </div>
               <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-blue-600 border-blue-50"
                    onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-rose-600 border-rose-50"
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmItem(item); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
               </div>
            </div>
          </div>
        ))}
      </div>

      {totalCount > pageSize && (
        <div className="pt-4 border-t border-slate-100">
          <PaginationControls
            currentPage={page}
            totalCount={totalCount}
            pageSize={pageSize}
          />
        </div>
      )}

      {/* Dialogs */}
      <EditPopularAreaDialog
        area={editingItem}
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onSuccess={() => router.refresh()}
      />

      <ResponsiveDialog
        open={!!deleteConfirmItem}
        onOpenChange={(open) => !open && setDeleteConfirmItem(null)}
        title="ยืนยันการลบทำเล"
        className="md:max-w-md"
      >
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-2">
            <TriangleAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">คุณแน่ใจหรือไม่?</h3>
            <p className="text-sm text-slate-500 mt-1">
              กำลังจะลบทำเล "<span className="font-bold text-slate-900">{deleteConfirmItem?.name}</span>" ข้อมูลนี้จะไม่สามารถกู้คืนได้
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl h-11 font-bold"
              onClick={() => setDeleteConfirmItem(null)}
              disabled={isDeleting}
            >
              ยกเลิก
            </Button>
            <Button
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-11 font-bold"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยันการลบ"}
            </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
