import { Suspense } from "react";
import { getFeatures } from "@/features/amenities/actions";
import { FeaturesClient } from "@/features/amenities/components/FeaturesClient";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Features Management | Real Estate CRM",
  description: "Manage property features and amenities.",
};

export default async function FeaturesPage() {
  const features = await getFeatures();

  return (
    <div className="container py-8 max-w-6xl">
      <Suspense fallback={<FeaturesLoading />}>
        <FeaturesClient features={features} />
      </Suspense>
    </div>
  );
}

function FeaturesLoading() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  );
}
