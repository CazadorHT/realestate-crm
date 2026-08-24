"use client";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { CategoryManager } from "./CategoryManager";
import { useLanguage } from "@/lib/i18n/language-context";

interface CategoryDialogProps {
  categories: any[];
}

export function CategoryDialog({ categories }: CategoryDialogProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <ResponsiveDialog
      title={isEn ? "Manage Categories" : "จัดการหมวดหมู่"}
      description={isEn ? "Add or delete blog categories. Changes take effect immediately." : "เพิ่มหรือลบหมวดหมู่บล็อก การเปลี่ยนแปลงจะแสดงผลทันที"}
      className="md:max-w-2xl"
      trigger={
        <Button variant="outline" size="sm" className="gap-2 h-9 rounded-xl border-slate-200 hover:bg-slate-50 font-bold cursor-pointer">
          <Settings2 className="h-4 w-4 text-indigo-600" />
          {isEn ? "Manage Categories" : "จัดการหมวดหมู่"}
        </Button>
      }
    >
      <div className="py-4 pb-10">
        <CategoryManager initialCategories={categories} />
      </div>
    </ResponsiveDialog>
  );
}
