"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import Link from "next/link";

export function TrashButton() {
  return (
    <Button
      asChild
      variant="outline"
      className="gap-2 text-red-600 border-red-200 hover:border-red-600! hover:bg-red-600! hover:text-white!"
    >
      <Link href="/protected/properties/trash">
        <Trash2 className="h-4 w-4" />
        <span className="hidden sm:inline">ถังขยะ</span>
      </Link>
    </Button>
  );
}
