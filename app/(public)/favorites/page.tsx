"use client";

import { useEffect, useState } from "react";
import { Heart, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/public/PropertyCard";
import { readFavoriteIds } from "@/lib/favorite-store";

type Property = {
  id: string;
  title: string;
  description?: string | null;
  property_type: string | null;
  listing_type: "SALE" | "RENT" | "SALE_AND_RENT" | null;
  price: number | null;
  rental_price?: number | null;
  province: string | null;
  popular_area: string | null;
  image_url: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqm?: number | null;
  parking_slots?: number | null;
  floor?: number | null;
  created_at: string;
  updated_at: string;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    loadFavorites();

    // Listen for favorite updates
    const handleFavoriteUpdate = () => {
      loadFavorites();
    };

    window.addEventListener("favorite-updated", handleFavoriteUpdate);
    return () =>
      window.removeEventListener("favorite-updated", handleFavoriteUpdate);
  }, []);

  async function loadFavorites() {
    const ids = readFavoriteIds();
    setFavoriteIds(ids);

    if (ids.length === 0) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/public/properties", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      const allProperties = Array.isArray(data) ? data : [];

      // Filter only favorited properties
      const favProperties = allProperties.filter((p: Property) =>
        ids.includes(p.id)
      );

      setFavorites(favProperties);
    } catch (error) {
      console.error("Error loading favorites:", error);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับหน้าแรก
            </Button>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center shadow-lg">
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

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[400px] rounded-2xl bg-white border border-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
              <Heart className="h-12 w-12 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              ยังไม่มีรายการโปรด
            </h2>
            <p className="text-slate-600 text-center max-w-md mb-8">
              เริ่มบันทึกทรัพย์ที่คุณสนใจโดยคลิกที่ไอคอนหัวใจบนการ์ดทรัพย์
            </p>
            <Link href="/properties">
              <Button size="lg" className="rounded-xl">
                <Home className="h-5 w-5 mr-2" />
                เริ่มเลือกดูทรัพย์
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
