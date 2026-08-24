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
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

interface Category {
  id: string;
  name: string;
  name_en?: string | null;
  name_cn?: string | null;
  name_ru?: string | null;
  slug: string;
  created_at: string;
}

interface CategoryManagerProps {
  initialCategories: Category[];
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryNameEn, setNewCategoryNameEn] = useState("");
  const [newCategoryNameCn, setNewCategoryNameCn] = useState("");
  const [newCategoryNameRu, setNewCategoryNameRu] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!newCategoryName.trim()) return;

    startTransition(async () => {
      const result = await createCategoryAction(
        newCategoryName,
        newCategoryNameEn,
        newCategoryNameCn,
        newCategoryNameRu,
      );
      if (result.success && result.data) {
        setCategories((prev) => [...prev, result.data as Category]);
        setNewCategoryName("");
        setNewCategoryNameEn("");
        setNewCategoryNameCn("");
        setNewCategoryNameRu("");
        toast.success(result.message || (isEn ? "Category created successfully" : "สร้างหมวดหมู่สำเร็จ"));
        const url = new URL(window.location.href);
        url.searchParams.set("success", "true");
        router.push(url.pathname + url.search);
        router.refresh();
      } else {
        toast.error(result.message || (isEn ? "Failed to create category" : "สร้างหมวดหมู่ไม่สำเร็จ"));
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm(isEn ? "Are you sure you want to delete this category?" : "คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้?")) return;

    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (result.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        toast.success(result.message || (isEn ? "Category deleted successfully" : "ลบหมวดหมู่สำเร็จ"));
        const url = new URL(window.location.href);
        url.searchParams.set("success", "true");
        router.push(url.pathname + url.search);
        router.refresh();
      } else {
        toast.error(result.message || (isEn ? "Failed to delete category" : "ลบหมวดหมู่ไม่สำเร็จ"));
      }
    });
  };

  return (
    <div className="space-y-6 ">
      {/* Creation Form */}
      <div className="space-y-4 bg-slate-50 p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm transition-all duration-300 ">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Loader2
              className={cn("h-4 w-4 text-blue-600", !isPending && "hidden")}
            />
            {!isPending && (
              <div className="h-4 w-4 bg-blue-600/20 rounded-sm" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-700">
            {isEn ? "Add New Category" : "เพิ่มหมวดหมู่ใหม่"}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
              {isEn ? "Thai Name" : "ชื่อภาษาไทย"}
            </label>
            <Input
              placeholder={isEn ? "e.g. News, Promotions" : "เช่น ข่าวสาร, โปรโมชั่น"}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={isPending}
              className="bg-white h-11 border-slate-200 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
              {isEn ? "English Name" : "ชื่อภาษาอังกฤษ"}
            </label>
            <Input
              placeholder="e.g. News, Promotions"
              value={newCategoryNameEn}
              onChange={(e) => setNewCategoryNameEn(e.target.value)}
              disabled={isPending}
              className="bg-white h-11 border-slate-200 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
              {isEn ? "Chinese Name" : "ชื่อภาษาจีน"}
            </label>
            <Input
              placeholder="例如：新闻、促销"
              value={newCategoryNameCn}
              onChange={(e) => setNewCategoryNameCn(e.target.value)}
              disabled={isPending}
              className="bg-white h-11 border-slate-200 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
              {isEn ? "Russian Name" : "ชื่อภาษารัสเซีย"}
            </label>
            <Input
              placeholder="напр. Новости, Акции"
              value={newCategoryNameRu}
              onChange={(e) => setNewCategoryNameRu(e.target.value)}
              disabled={isPending}
              className="bg-white h-11 border-slate-200 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleCreate}
            disabled={isPending || !newCategoryName.trim()}
            className="w-full lg:w-auto lg:min-w-[160px] bg-blue-600 hover:bg-blue-700 h-11 shadow-lg shadow-blue-500/20 transition-all cursor-pointer font-semibold"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <div className="mr-2 h-2 w-2 bg-white rounded-full animate-pulse" />
            )}
            {isEn ? "Add Category" : "เพิ่มหมวดหมู่"}
          </Button>
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            {isEn ? "Existing Categories" : "หมวดหมู่ที่มีอยู่"}
            <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full border border-slate-200 font-bold">
              {categories.length}
            </span>
          </h3>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4">{isEn ? "Thai Name" : "ภาษาไทย"}</TableHead>
                <TableHead>English</TableHead>
                <TableHead>中文</TableHead>
                <TableHead>Русский</TableHead>
                <TableHead>URL Slug</TableHead>
                <TableHead className="w-[80px] text-right">{isEn ? "Actions" : "จัดการ"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow
                  key={category.id}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="font-medium py-4">
                    {category.name}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {category.name_en || (
                      <span className="text-slate-300 italic">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {category.name_cn || (
                      <span className="text-slate-300 italic">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {category.name_ru || (
                      <span className="text-slate-300 italic">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-400 font-mono text-[10px]">
                    {category.slug}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
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
                    colSpan={6}
                    className="text-center py-12 text-slate-400"
                  >
                    {isEn ? "No categories found" : "ไม่พบหมวดหมู่"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="grid grid-cols-1 gap-3 lg:hidden">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    Thai Name
                  </span>
                  <h4 className="font-bold text-slate-900">{category.name}</h4>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-red-500 bg-red-50 rounded-lg"
                  onClick={() => handleDelete(category.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    English
                  </span>
                  <p className="text-xs text-slate-600 truncate">
                    {category.name_en || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Chinese
                  </span>
                  <p className="text-xs text-slate-600 truncate">
                    {category.name_cn || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Russian
                  </span>
                  <p className="text-xs text-slate-600 truncate">
                    {category.name_ru || "-"}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 px-3 py-2 rounded-lg">
                <span className="text-[10px] font-mono text-slate-400 truncate block">
                  slug: {category.slug}
                </span>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400">
              {isEn ? "No categories found" : "ไม่พบหมวดหมู่"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
