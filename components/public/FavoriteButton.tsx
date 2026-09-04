"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleFavoriteId, isFavorite } from "@/lib/favorite-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { updateAIScore } from "@/lib/analytics-utils";

interface FavoriteButtonProps {
  propertyId: string;
  propertyTitle?: string;
  className?: string;
  showText?: boolean;
}

export function FavoriteButton({
  propertyId,
  propertyTitle,
  className,
  showText = false,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { t } = useLanguage();

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
      toast.success(t("property.favorite.added"));
      pushToDataLayer(GTM_EVENTS.ADD_FAVORITE, {
        item_id: propertyId,
        item_name: propertyTitle,
        // Meta Pixel
        content_ids: [propertyId],
        content_name: propertyTitle,
        content_type: "product",
        currency: "THB",
      });
      updateAIScore(30);
    } else {
      toast.info(t("property.favorite.removed"));
    }
  };

  return (
    <Button
      variant="ghost"
      size={showText ? "default" : "icon"}
      className={cn(
        "rounded-full transition-all duration-300 shadow-sm border cursor-pointer",
        favorited
          ? "bg-red-500 text-white border-red-500 shadow-md hover:bg-red-600 hover:border-red-600 hover:text-white"
          : "bg-white/80 text-[#1B263B] border-white/40 hover:bg-red-500 hover:text-white hover:border-red-500",
        className,
      )}
      onClick={handleToggle}
      title={
        favorited ? t("property.favorite.remove") : t("property.favorite.save")
      }
      aria-label={
        favorited ? t("property.favorite.remove") : t("property.favorite.save")
      }
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-all duration-300",
          favorited ? "fill-current scale-110" : "scale-100",
          isAnimating && "animate-pulse",
        )}
      />
      {showText && (
        <span
          className={cn(
            "ml-2 font-medium",
            favorited ? "text-white" : "text-inherit",
          )}
        >
          {favorited
            ? t("property.favorite.saved")
            : t("property.favorite.save_btn")}
        </span>
      )}
    </Button>
  );
}
