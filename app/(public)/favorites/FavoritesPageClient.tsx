"use client";

import { useEffect, useState } from "react";
import { readFavoriteIds, clearFavorites } from "@/lib/favorite-store";
import { toast } from "sonner";
import { RecentlyViewedClient } from "@/components/public/RecentlyViewedClient";
import { PropertyCardProps } from "@/components/public/PropertyCard";

// Modular components
import { FavoritesHeader } from "@/components/public/favorites/FavoritesHeader";
import { FavoritesEmptyState } from "@/components/public/favorites/FavoritesEmptyState";
import { FavoritesGrid } from "@/components/public/favorites/FavoritesGrid";
import { FavoritesSkeleton } from "@/components/public/favorites/FavoritesSkeleton";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function FavoritesPageClient() {
  const [favorites, setFavorites] = useState<PropertyCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const { t } = useLanguage();
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
    if (confirm(t("favorites.confirm_clear"))) {
      clearFavorites();
      setFavorites([]);
      setFavoriteIds([]);
      toast.success(t("favorites.clear_success"));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-10">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AppBreadcrumbs
          items={[
            { label: t("breadcrumb.home"), href: "/" },
            { label: t("nav.favorites"), href: "/favorites" },
          ]}
          className="mb-6"
        />
        <FavoritesHeader
          favoriteIds={favoriteIds}
          onClearAll={handleClearAll}
        />
        {isLoading ? (
          <FavoritesSkeleton />
        ) : favorites.length === 0 ? (
          <FavoritesEmptyState />
        ) : (
          <FavoritesGrid favorites={favorites} />
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
