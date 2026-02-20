"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleFavoriteId, isFavorite } from "@/lib/favorite-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface FavoriteButtonProps {
  propertyId: string;
  className?: string;
  showText?: boolean;
}

export function FavoriteButton({
  propertyId,
  className,
  showText = false,
}: FavoriteButtonProps) {
  const { t } = useLanguage();
  const [favorited, setFavorited] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Initial check
    setFavorited(isFavorite(propertyId));

    // Listen for updates
    const handleUpdate = () => {
      setFavorited(isFavorite(propertyId));
    };

    window.addEventListener("favorite-updated", handleUpdate);
    return () => window.removeEventListener("favorite-updated", handleUpdate);
  }, [propertyId]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    toggleFavoriteId(propertyId);

    if (!favorited) {
      toast.success(t("favorites.add_success"));
    } else {
      toast.info(t("favorites.remove_success"));
    }
  };

  return (
    <Button
      variant="outline"
      size={showText ? "default" : "icon"}
      className={cn(
        "rounded-full transition-all duration-300 border-slate-200! hover:border-[hsl(var(--brand-primary)/0.3)]! hover:bg-[hsl(var(--brand-primary)/0.05)]! bg-white!",
        favorited
          ? "text-red-500! border-red-200! bg-red-50!"
          : "text-slate-400! bg-slate-50!",
        className,
      )}
      onClick={handleToggle}
      title={favorited ? t("favorites.title_remove") : t("favorites.title_add")}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-all duration-500",
          favorited ? "fill-current scale-110" : "scale-100",
          isAnimating && "animate-pulse",
        )}
      />
      {showText && (
        <span
          className={cn(
            "ml-2",
            favorited ? "text-red-600! font-medium" : "text-slate-600!",
          )}
        >
          {favorited ? t("favorites.saved_label") : t("favorites.save_label")}
        </span>
      )}
    </Button>
  );
}
