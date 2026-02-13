"use client";

import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { siteConfig } from "@/lib/site-config";

interface SearchBreadcrumbsProps {
  breadcrumbSchema: any;
}

export function SearchBreadcrumbs({
  breadcrumbSchema,
}: SearchBreadcrumbsProps) {
  const { t } = useLanguage();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Responsive container padding */}
      <div className="container mx-auto px-4 sm:px-6 pt-4 sm:pt-6 md:pt-8 pb-2">
        <nav
          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600"
          itemScope
          itemType="https://schema.org/BreadcrumbList"
        >
          <Link
            href="/"
            className="hover:text-blue-600 transition-colors flex items-center gap-1 shrink-0"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <meta itemProp="position" content="1" />
            {/* Responsive icon size */}
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span itemProp="name" className="hidden xs:inline sm:inline">
              {t("breadcrumb.home")}
            </span>
            <meta itemProp="item" content={siteConfig.url} />
          </Link>
          {/* Responsive chevron size */}
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
          <span
            className="text-blue-600 font-medium truncate"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <meta itemProp="position" content="2" />
            <span itemProp="name">{t("breadcrumb.properties")}</span>
            <meta itemProp="item" content={`${siteConfig.url}/properties`} />
          </span>
        </nav>
      </div>
    </>
  );
}
