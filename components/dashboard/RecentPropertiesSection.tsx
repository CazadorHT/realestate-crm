import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { RecentPropertiesTable } from "@/components/dashboard/RecentPropertiesTable";
import { ListSkeleton } from "./skeletons/ListSkeleton";

export async function RecentPropertiesSection() {
  const supabase = await createClient();
  const { data: propertiesResult } = await supabase
    .from("properties")
    .select(
      `
      *,
      property_images (
         image_url,
         storage_path,
         is_cover,
         sort_order
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(5);

  const properties = (propertiesResult ?? []).map((p: any) => ({
    ...p,
    property_images: p.property_images?.sort(
      (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    ),
  })) as any;

  return <RecentPropertiesTable properties={properties} />;
}

export function RecentPropertiesSectionSuspense() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <RecentPropertiesSection />
    </Suspense>
  );
}
