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
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!newCategoryName.trim()) return;

    startTransition(async () => {
      const result = await createCategoryAction(newCategoryName);
      if (result.success && result.category) {
        setCategories((prev) => [...prev, result.category!]);
        setNewCategoryName("");
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
      <div className="flex gap-4">
        <Input
          placeholder="ชื่อหมวดหมู่ใหม่ (เช่น 'ข่าวสารอสังหาฯ')"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          disabled={isPending}
        />
        <Button
          onClick={handleCreate}
          disabled={isPending || !newCategoryName.trim()}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          เพิ่มหมวดหมู่
        </Button>
      </div>

      <div className="rounded-md border border-slate-200 shadow-sm p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อหมวดหมู่</TableHead>
              <TableHead>สลัก (Slug)</TableHead>
              <TableHead className="w-[100px] text-right">การจัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="text-muted-foreground">
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
