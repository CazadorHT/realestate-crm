import Link from "next/link";
import type { LeadActivityRow } from "@/features/leads/types";
import type { PropertySummary } from "@/features/leads/queries";

import {
  propertyTypeLabel,
  listingTypeLabel,
  propertyStatusLabel,
} from "@/features/properties/labels";
import type { LeadStage, LeadSource } from "@/features/leads/labels";
import { LEAD_STAGE_LABELS, LEAD_SOURCE_LABELS } from "@/features/leads/labels";
import { leadSourceLabelNullable, leadStageLabelNullable } from "@/features/leads/labels";
function fmt(dt: string) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

function fmtMoney(value: any, currency?: string | null) {
  if (value === null || value === undefined || value === "") return "-";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  const formatted = new Intl.NumberFormat("th-TH").format(n);
  return currency ? `${formatted} ${currency}` : formatted;
}

function priceLabel(p: PropertySummary) {
  // listing_type: SALE | RENT | SALE_AND_RENT
  if (String(p.listing_type).toUpperCase() === "RENT") {
    return `เช่า: ${fmtMoney(p.rental_price, p.currency)} /เดือน`;
  }
  if (String(p.listing_type).toUpperCase() === "SALE_AND_RENT") {
    return `ขาย: ${fmtMoney(p.price, p.currency)} • เช่า: ${fmtMoney(p.rental_price, p.currency)} /เดือน`;
  }
  return `ขาย: ${fmtMoney(p.price, p.currency)}`;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

export function LeadTimeline({
  activities,
  propertiesById,
  leadStage,
  leadSource,
}: {
  activities: LeadActivityRow[];
  propertiesById: Record<string, PropertySummary>;
  leadStage: LeadStage | null | undefined;
  leadSource: LeadSource | null | undefined;
}) {
  if (!activities?.length) {
    return (
      <div className="rounded-xl border p-4 text-sm text-muted-foreground">
        ยังไม่มีกิจกรรม
      </div>
    );
  }

  return (
    <div className="rounded-xl border">
      <div className="border-b p-3 font-medium bg-bluebrand-500 text-white rounded-t-xl">
        Timeline
      </div>
      
      <div className="divide-y">
        {activities.map((a: any) => {
          const pid = a.property_id as string | null;
          const p = pid ? propertiesById[pid] : null;

          return (
            <div key={a.id} className="p-3 space-y-2">
              <div className="text-xs text-muted-foreground text-right">
                {fmt(a.created_at)}
              </div>

              {/* Property Card */}
              {p ? (
                <Link
                  href={`/protected/properties/${p.id}`}
                  className="flex gap-3 rounded-xl border p-3 hover:bg-muted/40"
                >
                  <div className="h-16 w-16 overflow-hidden rounded-lg border bg-muted">
                    {p.cover_url ? (
                      <img
                        src={p.cover_url}
                        alt={p.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.title}</div>

                    <div className="mt-1 flex flex-wrap gap-2">
                      <Chip>{propertyTypeLabel(p.property_type)}</Chip>
                      <Chip>{listingTypeLabel(p.listing_type)}</Chip>
                      <Chip>{propertyStatusLabel(p.status)}</Chip>
                    </div>

                    <div className="mt-2 text-sm text-muted-foreground">
                      {priceLabel(p)}
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="text-xs text-muted-foreground">
                  <p>ไม่มีทรัพย์ที่ผูกกับกิจกรรมนี้</p>
                </div>
              )}

              <div className="flex items-center justify-between px-3 py-2">
                <div className="text-sm font-medium">
                  กิจกรรม : {leadStageLabelNullable(leadStage)}
                </div>
              </div>

              <div className="text-sm text-muted-foreground whitespace-pre-wrap px-3">
                รายละเอียดกิจกรรม : {a.note || "-"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
