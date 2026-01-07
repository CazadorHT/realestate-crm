"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings2 } from "lucide-react";
import { CategoryManager } from "./CategoryManager";

interface CategoryDialogProps {
  categories: any[];
}

export function CategoryDialog({ categories }: CategoryDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Manage Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Category Management</DialogTitle>
          <DialogDescription>
            Add or remove blog categories. Changes will be reflected
            immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <CategoryManager initialCategories={categories} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
