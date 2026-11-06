"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecentlyViewedSection } from "@/components/public/RecentlyViewedSection";
import { SectionBackground } from "@/components/public/SectionBackground";

// New modular components
import { CompareProperty } from "@/components/public/compare/types";
import { COMPARISON_SECTIONS } from "@/components/public/compare/constants";
import { CompareEmptyState } from "@/components/public/compare/CompareEmptyState";
import { CompareLoadingSkeleton } from "@/components/public/compare/CompareLoadingSkeleton";
import { CompareTable } from "@/components/public/compare/CompareTable";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import { readCompareIds, removeCompareId } from "@/lib/compare-store";

import { useLanguage } from "@/components/providers/LanguageProvider";

export default function ComparePageClient() {
  const { t } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 pb-12 md:pb-20 pt-20 md:pt-24 flex items-center justify-center">
          <div className="animate-pulse text-slate-400">
            {t("compare_page.loading")}
          </div>
        </div>
      }
    >
      <ComparePageContent />
    </Suspense>
  );
}

function ComparePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ids = searchParams.get("ids") ?? "";
  const { t, language, langPrefix } = useLanguage();

  const [properties, setProperties] = useState<CompareProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ids) {
      // 🛡️ Fallback: If URL doesn't have ?ids=..., restore from localStorage (e.g. after language switch or direct navigation)
      const stored = readCompareIds();
      if (stored.length > 0) {
        router.replace(`${langPrefix || ""}/compare?ids=${stored.join(",")}`);
        return;
      }
      setProperties([]);
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/public/properties?ids=${ids}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        const results = data.properties || (Array.isArray(data) ? data : []);
        setProperties(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [ids, langPrefix, router]);

  const handleRemove = (id: string) => {
    // Keep localStorage in sync
    removeCompareId(id);

    // Update the URL to reflect the removal
    const currentIds = ids.split(",").filter((x: string) => x && x !== id);
    if (currentIds.length === 0) {
      router.push(`${langPrefix || ""}/compare`);
    } else {
      router.push(`${langPrefix || ""}/compare?ids=${currentIds.join(",")}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 md:pb-20 pt-20 md:pt-24 relative overflow-hidden">
      <SectionBackground pattern="blobs" intensity="low" showDots={true} />

      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <AppBreadcrumbs
          items={[
            { label: t("breadcrumb.home"), href: langPrefix || "/" },
            { label: t("compare_page.title"), href: `${langPrefix}/compare` },
          ]}
          className="mb-4"
        />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B263B] tracking-tight">
              {t("compare_page.title") || "เปรียบเทียบอสังหาริมทรัพย์"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {language === "th"
                ? "เปรียบเทียบระยะทางรถไฟฟ้า ราคา ขนาดห้อง และสิ่งอำนวยความสะดวกเคียงข้างกัน"
                : "Compare transit proximity, pricing, layouts, and amenities side-by-side"}
            </p>
          </div>
        </div>

        {isLoading ? (
          <CompareLoadingSkeleton count={3} />
        ) : properties.length === 0 ? (
          <CompareEmptyState />
        ) : (
          <CompareTable
            properties={properties}
            sections={COMPARISON_SECTIONS}
            onRemove={handleRemove}
          />
        )}
      </div>

      <div className="relative z-10 mt-12 md:mt-20">
        <RecentlyViewedSection
          recommendedProperties={[]}
          containerClassName="max-w-screen-2xl px-4 md:px-6 lg:px-8"
          disableAos
        />
      </div>
    </div>
  );
}
