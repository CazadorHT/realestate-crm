"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function TrashButton() {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <Button
      asChild
      variant="outline"
      className="gap-2 text-red-600 border-red-200 hover:border-red-600! hover:bg-red-600! hover:text-white!"
    >
      <Link href="/protected/properties/trash">
        <Trash2 className="h-4 w-4" />
        <span className="hidden sm:inline">{isEn ? "Trash" : "ถังขยะ"}</span>
      </Link>
    </Button>
  );
}
