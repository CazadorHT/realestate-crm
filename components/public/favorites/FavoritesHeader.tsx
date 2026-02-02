"use client";

import { Heart, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface FavoritesHeaderProps {
  favoriteIds: string[];
  onClearAll: () => void;
}

export function FavoritesHeader({
  favoriteIds,
  onClearAll,
}: FavoritesHeaderProps) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
      

      {favoriteIds.length > 0 && (
        <Button
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
          onClick={onClearAll}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          ลบทั้งหมด
        </Button>
      )}
    </div>
  );
}
