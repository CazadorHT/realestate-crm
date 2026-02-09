"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecentlyViewedClient } from "@/components/public/RecentlyViewedClient";
import { SectionBackground } from "@/components/public/SectionBackground";

// New modular components
import { CompareProperty } from "@/components/public/compare/types";
import { COMPARISON_ROWS } from "@/components/public/compare/constants";
import { CompareEmptyState } from "@/components/public/compare/CompareEmptyState";
import { CompareLoadingSkeleton } from "@/components/public/compare/CompareLoadingSkeleton";
import { CompareTable } from "@/components/public/compare/CompareTable";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";

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
  const { t } = useLanguage();

  const [properties, setProperties] = useState<CompareProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ids) {
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
        setProperties(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [ids]);

  const handleRemove = (id: string) => {
    // We update the URL to reflect the removal
    const currentIds = ids.split(",").filter((x) => x && x !== id);
    if (currentIds.length === 0) {
      router.push("/compare");
    } else {
      router.push(`/compare?ids=${currentIds.join(",")}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 md:pb-20 pt-20 md:pt-24 relative overflow-hidden">
      <SectionBackground pattern="blobs" intensity="low" showDots={true} />

      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <AppBreadcrumbs
          items={[
            { label: t("breadcrumb.home"), href: "/" },
            { label: t("compare_page.title"), href: "/compare" },
          ]}
          className="mb-6"
        />

        {isLoading ? (
          <CompareLoadingSkeleton count={3} />
        ) : properties.length === 0 ? (
          <CompareEmptyState />
        ) : (
          <CompareTable
            properties={properties}
            rows={COMPARISON_ROWS}
            onRemove={handleRemove}
          />
        )}
      </div>

      <div className="relative z-10 mt-12 md:mt-20">
        <RecentlyViewedClient
          recommendedProperties={[]}
          containerClassName="max-w-screen-2xl px-4 md:px-6 lg:px-8"
          disableAos
        />
      </div>
    </div>
  );
}
