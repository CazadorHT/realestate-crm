import { CategoryManager } from "@/components/blog/CategoryManager";
import { getCategoriesAction } from "@/features/blog/actions";
import { MoveLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CategoriesPage() {
  const { categories } = await getCategoriesAction();

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/protected/blogs">
            <MoveLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Category Management</h1>
      </div>

      <div className="max-w-2xl bg-card border rounded-lg p-6">
        <CategoryManager initialCategories={categories || []} />
      </div>
    </div>
  );
}
