"use client";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { CategoryManager } from "./CategoryManager";

interface CategoryDialogProps {
  categories: any[];
}

export function CategoryDialog({ categories }: CategoryDialogProps) {
  return (
    <ResponsiveDialog
      title="Category Management"
      description="Add or remove blog categories. Changes will be reflected immediately."
      className="md:max-w-2xl"
      trigger={
        <Button variant="outline" size="sm" className="gap-2 h-9 rounded-xl border-slate-200 hover:bg-slate-50 font-bold">
          <Settings2 className="h-4 w-4 text-indigo-600" />
          Manage Categories
        </Button>
      }
    >
      <div className="py-4 pb-10">
        <CategoryManager initialCategories={categories} />
      </div>
    </ResponsiveDialog>
  );
}
