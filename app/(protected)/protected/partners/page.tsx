import { Suspense } from "react";
import { PartnersContent } from "@/features/admin/components/PartnersContent";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { requireAuthContext } from "@/lib/authz";

import { getPartners } from "@/features/admin/partners-actions";

export default async function PartnersPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ page?: string; q?: string }> 
}) {
  const [authContext, sp] = await Promise.all([
    requireAuthContext(),
    searchParams
  ]);

  const { role } = authContext;
  const isSuperAdmin = role === "ADMIN";
  const page = Number(sp.page) || 1;
  const q = sp.q || "";

  // [PERFORMANCE] Pre-fetch initial data on server for better LCP
  const initialResult = await getPartners({
    page,
    pageSize: 10,
    search: q,
  });

  return (
    <Suspense fallback={<TableSkeleton rowCount={10} columnCount={5} />}>
      <PartnersContent 
        isSuperAdmin={isSuperAdmin} 
        initialData={initialResult.success ? initialResult.data : []}
        initialCount={initialResult.success ? initialResult.totalCount : 0}
      />
    </Suspense>
  );
}

