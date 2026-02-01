"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Plus, Pencil, Trash2, Loader2, MapPin } from "lucide-react";
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
  created_at: string;
};

export function PopularAreasTable({
  initialData,
}: {
  initialData: PopularArea[];
}) {
  const [data, setData] = useState(initialData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PopularArea | null>(null);
  const [itemName, setItemName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Pagination
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const displayData = data.slice(start, end);

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
    } else {
      setEditingItem(null);
      setItemName("");
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!itemName.trim()) return toast.error("ชื่อทำเลห้ามว่าง");

    setIsLoading(true);
    let res;
    if (editingItem) {
      res = await updatePopularAreaAction(editingItem.id, itemName);
    } else {
      res = await createPopularAreaAction(itemName);
    }
    setIsLoading(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(editingItem ? "แก้ไขสำเร็จ" : "เพิ่มสำเร็จ");
      setIsDialogOpen(false);

      // Ideally we should sync data from server revalidation
      // But for simplicity, we force a reload or we could manually update 'data'
      // Optimistic update isn't strictly needed for this admin tool
      window.location.reload();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`ยืนยันลบทำเล "${name}"?`)) return;

    setIsLoading(true);
    const res = await deletePopularAreaAction(id);
    setIsLoading(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("ลบสำเร็จ");
      setData((prev) => prev.filter((p) => p.id !== id));
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

      <div className="flex justify-between items-center bg-white p-4  border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-600" />
            Popular Areas ({data.length})
          </h2>
          <p className="text-sm text-slate-500">
            จัดการรายชื่อทำเลยอดนิยมในระบบ
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" /> เพิ่มทำเลใหม่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "แก้ไขทำเล" : "เพิ่มทำเลใหม่"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  ชื่อทำเล (Keyword)
                </label>
                <Input
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="เช่น สุขุมวิท, ทองหล่อ"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  บันทึก
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
              <TableHead>Popular Area Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center h-24 text-slate-500"
                >
                  ยังไม่มีข้อมูล
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
                      onClick={() => handleDelete(item.id, item.name)}
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

      <PaginationControls
        totalCount={data.length}
        pageSize={pageSize}
        currentPage={page}
      />
    </div>
  );
}
