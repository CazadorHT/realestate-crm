"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createCategoryAction,
  deleteCategoryAction,
} from "@/features/blog/actions";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  name_en?: string | null;
  name_cn?: string | null;
  slug: string;
  created_at: string;
}

interface CategoryManagerProps {
  initialCategories: Category[];
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryNameEn, setNewCategoryNameEn] = useState("");
  const [newCategoryNameCn, setNewCategoryNameCn] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!newCategoryName.trim()) return;

    startTransition(async () => {
      const result = await createCategoryAction(
        newCategoryName,
        newCategoryNameEn,
        newCategoryNameCn,
      );
      if (result.success && result.category) {
        setCategories((prev) => [...prev, result.category!]);
        setNewCategoryName("");
        setNewCategoryNameEn("");
        setNewCategoryNameCn("");
        toast.success("สร้างหมวดหมู่สำเร็จ");
        router.refresh();
      } else {
        toast.error(result.error || "สร้างหมวดหมู่ไม่สำเร็จ");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้?")) return;

    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (result.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        toast.success("ลบหมวดหมู่สำเร็จ");
        router.refresh();
      } else {
        toast.error(result.error || "ลบหมวดหมู่ไม่สำเร็จ");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700">
          เพิ่มหมวดหมู่ใหม่
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="ชื่อภาษาไทย (เช่น ข่าวสาร)"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            disabled={isPending}
            className="bg-white"
          />
          <Input
            placeholder="English Name"
            value={newCategoryNameEn}
            onChange={(e) => setNewCategoryNameEn(e.target.value)}
            disabled={isPending}
            className="bg-white"
          />
          <Input
            placeholder="中文名称"
            value={newCategoryNameCn}
            onChange={(e) => setNewCategoryNameCn(e.target.value)}
            disabled={isPending}
            className="bg-white"
          />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleCreate}
            disabled={isPending || !newCategoryName.trim()}
            className="w-full md:w-48 bg-blue-600 hover:bg-blue-700"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            เพิ่มหมวดหมู่
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 shadow-sm p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อหมวดหมู่ (TH)</TableHead>
              <TableHead>English (EN)</TableHead>
              <TableHead>中文 (CN)</TableHead>
              <TableHead>สลัก (Slug)</TableHead>
              <TableHead className="w-[80px] text-right">การจัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="text-slate-600">
                  {category.name_en || "-"}
                </TableCell>
                <TableCell className="text-slate-600">
                  {category.name_cn || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">
                  {category.slug}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive cursor-pointer"
                    onClick={() => handleDelete(category.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-6 text-muted-foreground"
                >
                  ไม่พบหมวดหมู่
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
