"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { toggleFavoriteId, isFavorite } from "@/lib/favorite-store";

export function FavoriteButton({
  propertyId,
  className = "",
}: {
  propertyId: string;
  className?: string;
}) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    setFavorite(isFavorite(propertyId));

    const handleUpdate = () => setFavorite(isFavorite(propertyId));
    window.addEventListener("favorite-updated", handleUpdate);
    return () => window.removeEventListener("favorite-updated", handleUpdate);
  }, [propertyId]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteId(propertyId);
  };

  return (
    <button
      onClick={toggleFavorite}
      className={`group/fav transition-all duration-300 ${className}`}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={`h-5 w-5 transition-all duration-300 ${
          favorite
            ? "fill-red-500 text-red-500 scale-110"
            : "fill-transparent text-white group-hover/fav:text-red-500 group-hover/fav:scale-110"
        }`}
      />
    </button>
  );
}
