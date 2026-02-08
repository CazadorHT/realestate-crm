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

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-4 border border-slate-200 shadow-sm rounded-xl">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-600" />
            Popular Areas ({filteredData.length})
          </h2>
          <p className="text-sm text-slate-500">
            จัดการรายชื่อทำเลยอดนิยมในระบบ
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="ค้นหาทำเล..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="rounded-xl bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
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
              <TableHead className="w-[100px]">No.</TableHead>
              <TableHead>THA Name</TableHead>
              <TableHead>ENG Name</TableHead>
              <TableHead>CHN Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center h-24 text-slate-500"
                >
                  {searchQuery ? (
                    <span>
                      ไม่พบผลลัพธ์สำหรับ "
                      <span className="font-semibold text-slate-900">
                        {searchQuery}
                      </span>
                      "
                    </span>
                  ) : (
                    "ยังไม่มีข้อมูล"
                  )}
                </TableCell>
              </TableRow>
            ) : (
              displayData.map((item, index) => (
                <TableRow
                  key={item.id}
                  className={isSelected(item.id) ? "bg-blue-50/50" : ""}
                >
                  <TableCell className="w-[50px]">
                    <Checkbox
                      checked={isSelected(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                      aria-label={`เลือก ${item.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-slate-500">
                    {start + index + 1}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {item.name_en || "-"}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {item.name_cn || "-"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => handleOpenDialog(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => {
                        setDeleteConfirmId(item.id);
                        setDeleteConfirmName(item.name);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
