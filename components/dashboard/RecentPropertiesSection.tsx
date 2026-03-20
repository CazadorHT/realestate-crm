import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { RecentPropertiesTable } from "@/components/dashboard/RecentPropertiesTable";
import { ListSkeleton } from "./skeletons/ListSkeleton";

export async function RecentPropertiesSection({ tenantId }: { tenantId?: string | null }) {
  const supabase = await createClient();
  let query = supabase
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
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  if (tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  const { data: propertiesResult } = await query;


  const properties = (propertiesResult ?? []).map((p: any) => ({
    ...p,
    property_images: p.property_images?.sort(
      (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    ),
  })) as any;

  return <RecentPropertiesTable properties={properties} />;
}

export function RecentPropertiesSectionSuspense({ tenantId }: { tenantId?: string | null }) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <RecentPropertiesSection tenantId={tenantId} />
    </Suspense>
  );
}
