"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PropertyStatusBadge } from "@/components/properties/PropertyStatusBadge";
import { DocumentList } from "@/features/documents/components/DocumentList";

interface PropertyCRMDetailsProps {
  property: {
    status: string | null;
    agent?: {
      full_name: string | null;
    } | null;
  };
  relatedDeal: {
    id: string;
    lead?: {
      full_name: string;
    } | null;
  } | null;
  relatedContract: {
    id: string;
  } | null;
  commissionLabel: string;
  tenantId: string | undefined;
}

export function PropertyCRMDetails({
  property,
  relatedDeal,
  relatedContract,
  commissionLabel,
  tenantId,
}: PropertyCRMDetailsProps) {
  if (!relatedDeal) return null;

  return (
    <section className="space-y-6 rounded-2xl border p-5 sm:p-8 bg-slate-50/50 mt-8 sm:mt-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-lg sm:text-xl font-bold flex flex-wrap items-center gap-2 text-slate-800">
          <PropertyStatusBadge
            status={property.status || "DRAFT"}
            className="text-[10px] sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1"
            language="th"
          />
          CRM ดีลสถานะสำเร็จ
        </h3>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="w-full sm:w-auto rounded-xl"
        >
          <Link href={`/protected/deals/${relatedDeal.id}`}>
            ไปยังหน้า Deal
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-4">
        <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-sm">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
            ค่าคอมมิชชั่น
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-600">
            {commissionLabel}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-sm">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
            ลูกค้า (Lead)
          </div>
          <div className="font-bold text-slate-900 text-base sm:text-lg">
            {relatedDeal.lead?.full_name ?? "-"}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-sm">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
            เคสโดย
          </div>
          <div className="font-bold text-slate-900 text-base sm:text-lg">
            {property.agent?.full_name ?? "-"}
          </div>
        </div>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-200">
        <div>
          <div className="text-xs sm:text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            เอกสารสัญญา (Contract)
          </div>
          {relatedContract?.id ? (
            <div className="overflow-x-auto no-scrollbar">
              <DocumentList
                ownerId={relatedContract.id}
                ownerType="RENTAL_CONTRACT"
                tenantId={tenantId}
              />
            </div>
          ) : (
            <div className="text-center py-8 sm:py-10 text-slate-400 border border-dashed rounded-xl bg-white text-sm">
              ยังไม่มีสัญญา
            </div>
          )}
        </div>
        <div>
          <div className="text-xs sm:text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            เอกสารดีล (Documents)
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <DocumentList
              ownerId={relatedDeal.id}
              ownerType="DEAL"
              tenantId={tenantId}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
