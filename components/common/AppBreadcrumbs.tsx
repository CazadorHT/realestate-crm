"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { useMemo } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const routeLabels: Record<string, string> = {
  // Common
  home: "breadcrumb.home",
  search: "breadcrumb.search",
  about: "breadcrumb.about",
  contact: "breadcrumb.contact",
  blog: "breadcrumb.blog",
  blogs: "breadcrumb.blog",
  services: "breadcrumb.services",

  // Public Properties
  properties: "breadcrumb.properties",
  projects: "breadcrumb.projects",
  rent: "breadcrumb.rent",
  sale: "breadcrumb.sale",
  "prime-cbd": "breadcrumb.prime_cbd",
  "pet-friendly-condo": "breadcrumb.pet_friendly_condo",
  "office-for-rent": "breadcrumb.office_for_rent",
  "luxury-villa": "breadcrumb.luxury_villa",

  // CRM / Protected (Fallback to nav if breadcrumb section doesn't have it)
  dashboard: "nav.dashboard",
  leads: "nav.leads",
};

interface AppBreadcrumbsProps {
  className?: string;
  variant?: "default" | "on-dark";
  showHome?: boolean;
  items?: { label: string; href?: string; className?: string }[];
}

export function AppBreadcrumbs({
  className,
  variant = "default",
  showHome = true,
  items: customItems,
}: AppBreadcrumbsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const breadcrumbs = useMemo(() => {
    if (customItems) return customItems;

    // Split pathname into segments and filter out empty strings
    const segments = pathname.split("/").filter(Boolean);

    const items: BreadcrumbItem[] = [];

    // Add Home if requested
    if (showHome) {
      items.push({
        label: t("breadcrumb.home"),
        href: "/",
      });
    }

    let currentHref = "";

    segments.forEach((segment) => {
      // Don't show "protected" in breadcrumbs if we show "home" or other segments
      // Or map it to something meaningful if it's the only segment
      if (segment === "protected" && segments.length > 1) {
        currentHref += `/${segment}`;
        return;
      }

      currentHref += `/${segment}`;

      // Try to find a label in the map, otherwise use the capitalized segment
      const key = routeLabels[segment.toLowerCase()];
      const label = key
        ? t(key)
        : decodeURIComponent(segment)
            .replace(/-/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());

      items.push({
        label,
        href: currentHref,
      });
    });

    return items;
  }, [pathname, showHome, customItems, t]);

  // Schema.org for SEO
  const schemaData = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        item: item.href ? `${siteConfig.url}${item.href}` : undefined,
      })),
    };
  }, [breadcrumbs]);

  // If we're on the home page and not showing home explicitly, or if there are no items
  if (pathname === "/" || breadcrumbs.length <= (showHome ? 1 : 0)) {
    return null;
  }

  const parentItem = breadcrumbs.length >= 2 ? breadcrumbs[breadcrumbs.length - 2] : null;
  const parentHref = parentItem?.href || "/";
  const parentLabel = parentItem?.label || t("common.back") || "ย้อนกลับ";

  const handleBack = () => {
    if (typeof window !== "undefined") {
      // If navigated internally within our website, go back to retain search state/filters
      if (
        document.referrer &&
        document.referrer.includes(window.location.host) &&
        window.history.length > 1
      ) {
        router.back();
        return;
      }
    }
    // Fallback gracefully to parent breadcrumb category or home
    if (parentHref) {
      router.push(parentHref);
    } else {
      router.push("/");
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      
      {/* Desktop (lg+): Full Breadcrumbs with Circular Back Arrow */}
      <div className="hidden lg:flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className={cn(
            "flex items-center justify-center h-8 w-8 rounded-full border transition-all duration-200 hover:scale-110 active:scale-95 shadow-2xs cursor-pointer shrink-0 hover:-translate-x-0.5 hover:shadow-md",
            variant === "on-dark"
              ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
              : "bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200/90"
          )}
          title={t("common.back") || "Back"}
          aria-label={t("common.back") || "Back"}
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
        </button>
        <Breadcrumb items={breadcrumbs} variant={variant} className={className} />
      </div>

      {/* Mobile (< lg): App Native Back Button */}
      <div className={cn("block lg:hidden", className)}>
        <button
          type="button"
          onClick={handleBack}
          className={cn(
            "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold shadow-2xs border transition-all active:scale-95 cursor-pointer touch-manipulation",
            variant === "on-dark"
              ? "bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md"
              : "bg-white/90 hover:bg-slate-100 text-slate-700 border-slate-200/80 backdrop-blur-md"
          )}
          aria-label={t("common.back") || "Back"}
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span>{parentLabel}</span>
        </button>
      </div>
    </>
  );
}
