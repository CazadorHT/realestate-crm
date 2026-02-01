import { PropertySearchPage } from "@/components/public/PropertySearchPage";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";

export default function PublicPropertiesPage() {
  return (
    <>
      {/* Schema.org Structured Data */}

      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50 mt-16">
        <div className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 py-4">
          <AppBreadcrumbs />
        </div>
        <PropertySearchPage />
      </div>
    </>
  );
}
