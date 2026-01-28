import { PropertySearchPage } from "@/components/public/PropertySearchPage";

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

      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50">
        <PropertySearchPage />
      </div>
    </>
  );
}
