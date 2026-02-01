"use client";

import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

interface SearchBreadcrumbsProps {
  breadcrumbSchema: any;
}

export function SearchBreadcrumbs({
  breadcrumbSchema,
}: SearchBreadcrumbsProps) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="container mx-auto px-4 pt-8 pb-2">
        <nav
          className="flex items-center gap-2 text-sm text-slate-600"
          itemScope
          itemType="https://schema.org/BreadcrumbList"
        >
          <Link
            href="/"
            className="hover:text-blue-600 transition-colors flex items-center gap-1"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <meta itemProp="position" content="1" />
            <Home className="w-4 h-4" />
            <span itemProp="name">หน้าแรก</span>
            <meta itemProp="item" content="https://your-domain.com" />
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span
            className="text-blue-600 font-medium"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            <meta itemProp="position" content="2" />
            <span itemProp="name">ทรัพย์สิน</span>
            <meta
              itemProp="item"
              content="https://your-domain.com/properties"
            />
          </span>
        </nav>
      </div>
    </>
  );
}
