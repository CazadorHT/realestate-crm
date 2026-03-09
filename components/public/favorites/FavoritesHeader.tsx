"use client";

import { Heart, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface FavoritesHeaderProps {
  favoriteIds: string[];
  onClearAll: () => void;
}

export function FavoritesHeader({
  favoriteIds,
  onClearAll,
}: FavoritesHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
      {favoriteIds.length > 0 && (
        <ConfirmDialog
          title={t("favorites.clear_all")}
          description={t("favorites.confirm_clear")}
          onConfirm={onClearAll}
          variant="destructive"
          trigger={
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-600 border-red-200 hover:bg-red-50! hover:border-red-300! group/card"
            >
              <Trash2 className="h-4 w-4 mr-2 transition-transform duration-300 group-hover/card:scale-120 group-hover/card:rotate-6" />
              {t("favorites.clear_all")}
            </Button>
          }
        />
      )}
    </div>
  );
}
