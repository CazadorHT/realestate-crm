import { PropertySearchPage } from "@/components/public/PropertySearchPage";
import { PublicNav } from "@/components/public/PublicNav";
import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

export default function PublicPropertiesPage() {
  // Breadcrumb Schema.org
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "หน้าแรก",
        item: "https://your-domain.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "ทรัพย์สิน",
        item: "https://your-domain.com/properties",
      },
    ],
  };

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 pt-20 pb-4">
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
              className="text-slate-900 font-medium"
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

        <PropertySearchPage />
      </div>
    </>
  );
}
