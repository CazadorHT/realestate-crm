import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { UserPlus, Briefcase, History as HistoryIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { getLeadWithActivitiesQuery } from "@/features/leads/queries";
import { createLeadActivityAction } from "@/features/leads/actions";
import { LeadTimeline } from "@/components/leads/LeadTimeline";
import { LeadActivityDialog } from "@/components/leads/LeadActivityDialog";
import { getPropertySummariesByIdsQuery } from "@/features/leads/queries";
import {
  leadStageLabelNullable,
  leadSourceLabelNullable,
} from "@/features/leads/labels";
import { getDealsByLeadId } from "@/features/deals/queries";
import { DealList } from "@/features/deals/components/DealList";
import { DealFormDialog } from "@/features/deals/components/DealFormDialog";
import { DocumentSection } from "@/features/documents/components/DocumentSection";
import type { LeadActivityFormValues } from "@/lib/types/leads";
import type { Database } from "@/lib/database.types";

// Components
import { LeadContactCard } from "@/features/leads/components/LeadContactCard";
import { LeadRequirementsCard } from "@/features/leads/components/LeadRequirementsCard";
import { LeadSummaryCard } from "@/features/leads/components/LeadSummaryCard";

type LeadActivity = Database["public"]["Tables"]["lead_activities"]["Row"];

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLeadWithActivitiesQuery(id);

  if (!lead) return notFound();

  // Fetch Deals
  const deals = await getDealsByLeadId(id);

  // Fetch properties for dropdown
  const { data: propertiesRaw } = await (await import("@/lib/supabase/server"))
    .createClient()
    .then((c) =>
      c
        .from("properties")
        .select(
          "id, title, price, original_price, rental_price, original_rental_price, commission_sale_percentage, commission_rent_months, property_images(image_url, is_cover)",
        )
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false })
        .limit(50),
    );

  const properties = (propertiesRaw ?? []).map((p: any) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    original_price: p.original_price,
    rental_price: p.rental_price,
    original_rental_price: p.original_rental_price,
    commission_sale_percentage: p.commission_sale_percentage,
    commission_rent_months: p.commission_rent_months,
    cover_image:
      p.property_images?.find((img: any) => img.is_cover)?.image_url ||
      p.property_images?.[0]?.image_url ||
      null,
  }));

  async function onCreateActivity(values: LeadActivityFormValues) {
    "use server";
    const res = await createLeadActivityAction(id, values);
    if (!res.success) throw new Error(res.message);
  }
  const propertyIds = ((lead.lead_activities as LeadActivity[] | null) ?? [])
    .map((a) => a.property_id)
    .filter((id): id is string => id !== null);

  const propertiesById = await getPropertySummariesByIdsQuery(propertyIds);

  return (
    <div className="space-y-6 max-w-full mx-auto">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        backHref="/protected/leads"
        items={[
          { label: "ลีด", href: "/protected/leads" },
          { label: lead.full_name || "รายละเอียดลีด" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-8 border-b border-slate-200 bg-linear-to-r from-slate-800 to-slate-900 rounded-xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">K. {lead.full_name}</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              {leadStageLabelNullable(lead.stage)}
            </span>
            <span className="text-white">•</span>
            <span className="text-white">
              {leadSourceLabelNullable(lead.source)}
            </span>
          </div>
        </div>

        <div className="flex gap-3 ">
          <Link
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 py-2 px-3 text-sm font-medium text-white hover:bg-white/20 transition-colors shadow-sm"
            href={`/protected/leads/${id}/edit`}
          >
            ✏️ แก้ไข
          </Link>
          <LeadActivityDialog
            leadId={id}
            leadName={lead.full_name}
            onSubmitAction={onCreateActivity}
            triggerClassName="bg-blue-600 hover:bg-blue-500 text-white shadow-sm border-0"
          />
        </div>
      </div>

      {/* AI Summary Section */}
      <LeadSummaryCard leadId={id} />

      {/* Top Row - Contact & Requirements (2 columns) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LeadContactCard lead={lead} />
        <LeadRequirementsCard lead={lead} />
      </div>

      {/* Main Content - 3 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Deals Section */}
        {/* Deals Section */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden h-full">
          <div className="flex items-center justify-between gap-4 p-5 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Briefcase className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">
                  ดีล ({deals.length})
                </h3>
                <p className="text-xs text-slate-500">รายการดีลที่เกี่ยวข้อง</p>
              </div>
            </div>
            <DealFormDialog
              leadId={id}
              properties={properties || []}
              refreshOnSuccess
            />
          </div>
          <div className="flex-1 overflow-auto p-5">
            <DealList deals={deals} properties={properties} />
          </div>
        </div>

        {/* Documents Section */}
        <DocumentSection ownerId={id} ownerType="LEAD" />

        {/* Timeline */}
        {/* Timeline */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden h-full">
          <div className="flex items-center justify-between gap-4 p-5 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                <HistoryIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">
                  ประวัติกิจกรรม
                </h3>
                <p className="text-xs text-slate-500">ไทม์ไลน์การติดตาม</p>
              </div>
            </div>
            <LeadActivityDialog
              leadId={id}
              leadName={lead.full_name}
              onSubmitAction={onCreateActivity}
            />
          </div>
          <div className="flex-1 overflow-y-auto max-h-80 p-5">
            <LeadTimeline
              activities={lead.lead_activities ?? []}
              propertiesById={propertiesById}
              leadId={id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
