"use client";

import { useState, useMemo, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Pencil, Trash2, Loader2, MapPin, Check, Search } from "lucide-react";
import { toast } from "sonner";
import {
  createPopularAreaAction,
  deletePopularAreaAction,
  updatePopularAreaAction,
} from "@/features/admin/popular-areas-actions";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeletePopularAreasAction } from "@/features/admin/popular-areas-bulk-actions";
import { cn } from "@/lib/utils";

type PopularArea = {
  id: string;
  name: string;
  name_en?: string | null;
  name_cn?: string | null;
  created_at: string;
};

export function PopularAreasTable({
  initialData,
}: {
  initialData: PopularArea[];
}) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PopularArea | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemNameEn, setItemNameEn] = useState("");
  const [itemNameCn, setItemNameCn] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    return data.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()),
    );
  }, [data, searchQuery]);

  // Pagination
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Reset page to 1 when searching
  useEffect(() => {
    if (searchQuery) {
      const params = new URLSearchParams(searchParams);
      if (params.get("page") !== "1") {
        params.set("page", "1");
        router.replace(`${pathname}?${params.toString()}`);
      }
    }
  }, [searchQuery, searchParams, pathname, router]);

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const displayData = filteredData.slice(start, end);

  // Bulk selection
  const allIds = useMemo(
    () => displayData.map((item) => item.id),
    [displayData],
  );
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
    const result = await bulkDeletePopularAreasAction(ids);
    if (result.success) {
      toast.success(result.message);
      clearSelection();
      setData((prev) => prev.filter((p) => !ids.includes(p.id)));
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาด");
    }
  };

  // --- Helpers ---
  const handleOpenDialog = (item?: PopularArea) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemNameEn(item.name_en || "");
      setItemNameCn(item.name_cn || "");
    } else {
      setEditingItem(null);
      setItemName("");
      setItemNameEn("");
      setItemNameCn("");
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!itemName.trim()) return toast.error("ชื่อทำเลห้ามว่าง");

    setIsLoading(true);
    let res;
    if (editingItem) {
      res = await updatePopularAreaAction(
        editingItem.id,
        itemName,
        itemNameEn,
        itemNameCn,
      );
    } else {
      res = await createPopularAreaAction(itemName, itemNameEn, itemNameCn);
    }
    setIsLoading(false);

    if (res?.success === false) {
      toast.error(res.message || "เกิดข้อผิดพลาด");
    } else {
      toast.success(
        res?.message || (editingItem ? "แก้ไขสำเร็จ" : "เพิ่มสำเร็จ"),
      );
      setIsDialogOpen(false);
      window.location.reload();
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    const res = await deletePopularAreaAction(id);
    setIsLoading(false);

    if (res?.success === false) {
      toast.error(res.message || "เกิดข้อผิดพลาด");
    } else {
      toast.success(res?.message || "ลบสำเร็จ");
      setData((prev) => prev.filter((p) => p.id !== id));
      clearSelection();
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        entityName="ทำเล"
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-5 border border-slate-200 shadow-sm rounded-2xl animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              ทำเลยอดนิยม ({filteredData.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              จัดการรายชื่อทำเลยอดนิยมในระบบ
            </p>
          </div>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="ค้นหาทำเล..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all rounded-xl"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-xl bg-white overflow-hidden shadow-sm border border-slate-200 animate-in fade-in duration-500">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
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
              <TableHead className="w-[80px] font-bold text-slate-900 px-6">
                ลำดับ
              </TableHead>
              <TableHead className="font-bold text-slate-900 px-6">
                ชื่อภาษาไทย (THA)
              </TableHead>
              <TableHead className="font-bold text-slate-900 px-6">
                ชื่อภาษาอังกฤษ (ENG)
              </TableHead>
              <TableHead className="font-bold text-slate-900 px-6">
                ชื่อภาษาจีน (CHN)
              </TableHead>
              <TableHead className="text-right font-bold text-slate-900 px-6">
                จัดการ
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-20 text-slate-400 bg-white"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-slate-50 rounded-full">
                      <Search className="h-10 w-10 text-slate-200" />
                    </div>
                    <div>
                      {searchQuery ? (
                        <>
                          <p className="font-semibold text-slate-600">
                            ไม่พบผลลัพธ์
                          </p>
                          <p className="text-sm">
                            ไม่พบทำเลที่ตรงกับ "{searchQuery}"
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-slate-600">
                            ยังไม่มีข้อมูล
                          </p>
                          <p className="text-sm">เริ่มต้นเพิ่มทำเลใหม่ได้เลย</p>
                        </>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayData.map((item, index) => (
                <TableRow
                  key={item.id}
                  className={`group hover:bg-slate-50/80 transition-all duration-200 ${isSelected(item.id) ? "bg-blue-50/50" : ""}`}
                >
                  <TableCell className="px-6 py-4">
                    <Checkbox
                      checked={isSelected(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                      aria-label={`เลือก ${item.name}`}
                      className="rounded-md"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm text-slate-500 px-6">
                    {start + index + 1}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900 px-6">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-slate-600 px-6 font-medium">
                    {item.name_en || <span className="text-slate-300">-</span>}
                  </TableCell>
                  <TableCell className="text-slate-600 px-6 font-medium">
                    {item.name_cn || <span className="text-slate-300">-</span>}
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleOpenDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => {
                          setDeleteConfirmId(item.id);
                          setDeleteConfirmName(item.name);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
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
      <div className="lg:hidden space-y-4  animate-in fade-in duration-500">
        {filteredData.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 font-medium">
            <div className="flex flex-col items-center gap-3">
              <Search className="h-10 w-10 text-slate-200" />
              <p>ไม่พบข้อมูลทำเล</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayData.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  "p-5 bg-white rounded-2xl border transition-all active:scale-[0.98] shadow-sm",
                  isSelected(item.id)
                    ? "border-indigo-200 bg-indigo-50/30"
                    : "border-slate-200",
                )}
                onClick={() => toggleSelect(item.id)}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Checkbox
                      checked={isSelected(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-md shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 block w-fit mb-1">
                        #{start + index + 1}
                      </span>
                      <h4 className="font-bold text-slate-900 leading-tight truncate">
                        {item.name}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-50 rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(item);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 text-rose-600 border-rose-100 bg-rose-50/50 hover:bg-rose-50 rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(item.id);
                        setDeleteConfirmName(item.name);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      English
                    </span>
                    <p className="text-xs font-semibold text-slate-600 truncate">
                      {item.name_en || (
                        <span className="text-slate-300 font-normal">N/A</span>
                      )}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Chinese
                    </span>
                    <p className="text-xs font-semibold text-slate-600 truncate">
                      {item.name_cn || (
                        <span className="text-slate-300 font-normal">N/A</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบทำเล</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบทำเล "
              <strong className="text-foreground">{deleteConfirmName}</strong>"?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              disabled={isLoading}
              onClick={(e) => {
                e.preventDefault();
                if (deleteConfirmId) handleDelete(deleteConfirmId);
                setDeleteConfirmId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
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

      <PaginationControls
        totalCount={filteredData.length}
        pageSize={pageSize}
        currentPage={page}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "แก้ไขทำเล" : "เพิ่มทำเลใหม่"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">ชื่อทำเล (ไทย)</label>
                <Input
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="เช่น สุขุมวิท, ทองหล่อ"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Name (English)</label>
                <Input
                  value={itemNameEn}
                  onChange={(e) => setItemNameEn(e.target.value)}
                  placeholder="Sukhumvit, Thong Lo"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">名称 (Chinese)</label>
                <Input
                  value={itemNameCn}
                  onChange={(e) => setItemNameCn(e.target.value)}
                  placeholder="素坤逸, 通罗"
                  className="h-11"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  isLoading ||
                  !itemName.trim() ||
                  (editingItem !== null &&
                    itemName.trim() === editingItem.name &&
                    itemNameEn.trim() === (editingItem.name_en || "") &&
                    itemNameCn.trim() === (editingItem.name_cn || ""))
                }
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed px-8"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                บันทึก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
