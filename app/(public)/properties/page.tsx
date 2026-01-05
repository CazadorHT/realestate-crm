import { PropertySearchPage } from "@/components/public/PropertySearchPage";
import { PublicNav } from "@/components/public/PublicNav";
export default function PublicPropertiesPage() {
  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <PublicNav />
  <PropertySearchPage />
  </div>
  );
};
