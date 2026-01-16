import { Suspense } from "react";
import { getFeatures } from "@/features/amenities/actions";
import { FeaturesClient } from "@/features/amenities/components/FeaturesClient";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "จัดการสิ่งอำนวยความสะดวก | Real Estate CRM",
  description: "จัดการรายการสิ่งอำนวยความสะดวก ไอคอน และหมวดหมู่",
};

export default async function FeaturesPage() {
  const features = await getFeatures();

  return (
    <div className="space-y-6">
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
