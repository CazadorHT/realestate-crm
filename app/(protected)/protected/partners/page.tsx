import { Suspense } from "react";
import { PartnersContent } from "@/features/admin/components/PartnersContent";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { requireAuthContext } from "@/lib/authz";

export default async function PartnersPage() {
  const { role } = await requireAuthContext();
  const isSuperAdmin = role === "ADMIN";

  return (
    <Suspense fallback={<TableSkeleton rowCount={10} columnCount={5} />}>
      <PartnersContent isSuperAdmin={isSuperAdmin} />
    </Suspense>
  );
}
