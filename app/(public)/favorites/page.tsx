"use client";

import { useEffect, useState } from "react";
import { Heart, ArrowLeft, Home, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/public/PropertyCard";
import { PropertyCardSkeleton } from "@/components/public/PropertyCardSkeleton";
import { readFavoriteIds, clearFavorites } from "@/lib/favorite-store";
import { toast } from "sonner";
import { RecentlyViewedClient } from "@/components/public/RecentlyViewedClient";

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
      // Optimize: Fetch only specific IDs using the API
      const res = await fetch(`/api/public/properties?ids=${ids.join(",")}`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      const loadedProperties = Array.isArray(data) ? data : [];

      setFavorites(loadedProperties);
    } catch (error) {
      console.error("Error loading favorites:", error);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClearAll() {
    if (confirm("คุณต้องการลบรายการโปรดทั้งหมดใช่หรือไม่?")) {
      clearFavorites();
      setFavorites([]);
      setFavoriteIds([]);
      toast.success("ลบรายการโปรดทั้งหมดเรียบร้อยแล้ว");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-10">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
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
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
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
              onClick={handleClearAll}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              ลบทั้งหมด
            </Button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 bg-white rounded-3xl border border-slate-100 shadow-sm text-center animate-in fade-in zoom-in duration-500">
            <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center mb-6">
              <Heart className="h-10 w-10 text-slate-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              ยังไม่มีรายการโปรด
            </h2>
            <p className="text-slate-500 text-center max-w-md mb-8">
              เริ่มบันทึกทรัพย์ที่คุณสนใจโดยคลิกที่ไอคอนหัวใจบนการ์ดทรัพย์
              <br />
              เพื่อเก็บไว้เปรียบเทียบหรือดูภายหลัง
            </p>
            <Link href="/properties">
              <Button
                size="lg"
                className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Home className="h-5 w-5 mr-2" />
                <span>ไปที่หน้าค้นหาทรัพย์</span>
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in duration-500 slide-in-from-bottom-4 pb-10">
            {favorites.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
      <div>
        <RecentlyViewedClient
          recommendedProperties={[]}
          containerClassName="max-w-screen-2xl px-4 sm:px-6 lg:px-8"
          disableAos
        />
      </div>
    </div>
  );
}
