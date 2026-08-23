import { getDeletedProperties } from "@/lib/db/properties";
import React from "react";
import { TrashTable } from "./TrashTable";
import { requireAuthContext } from "@/lib/authz";
import { TrashHeader } from "./TrashHeader";

export default async function TrashPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const PAGE_SIZE = 10;

  const { role } = await requireAuthContext();
  const showCreator = role !== "AGENT";

  const { data: deletedProperties, count } = await getDeletedProperties(
    currentPage,
    PAGE_SIZE,
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <TrashHeader count={count} />

      <div className="grid gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-4">
            <TrashTable 
              data={deletedProperties} 
              totalCount={count}
              pageSize={PAGE_SIZE}
              currentPage={currentPage}
              showCreator={showCreator}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
