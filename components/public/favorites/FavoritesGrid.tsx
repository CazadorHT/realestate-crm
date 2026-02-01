"use client";

import { PropertyCard } from "@/components/public/PropertyCard";
import { PropertyCardProps } from "@/components/public/PropertyCard";

interface FavoritesGridProps {
  favorites: PropertyCardProps[];
}

export function FavoritesGrid({ favorites }: FavoritesGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in duration-500 slide-in-from-bottom-4 pb-10">
      {favorites.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
