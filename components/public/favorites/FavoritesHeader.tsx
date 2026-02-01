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
      <div>
        <Link href="/">
          <Button
            variant="ghost"
            className="mb-4 -ml-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับหน้าแรก
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-pink-500 to-red-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Heart className="h-6 w-6 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              รายการโปรด
            </h1>
            <p className="text-slate-600 mt-1">
              {favoriteIds.length > 0
                ? `คุณมี ${favoriteIds.length} ทรัพย์ที่บันทึกไว้`
                : "ยังไม่มีทรัพย์ที่บันทึกไว้"}
            </p>
          </div>
        </div>
      </div>

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
