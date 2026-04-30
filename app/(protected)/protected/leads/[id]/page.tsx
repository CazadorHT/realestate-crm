import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { UserPlus, Briefcase, History as HistoryIcon, Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import { getLeadWithActivitiesQuery } from "@/features/leads/queries";
import { createLeadActivityAction } from "@/features/leads/actions";
import { requireAuthContext } from "@/lib/authz";
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
import { PDPAStatus } from "@/features/leads/components/PDPAStatus";
import { LeadTransferButton } from "@/features/leads/components/LeadTransferButton";
import { LeadSmartMatch } from "@/features/smart-match/components/LeadSmartMatch";

type LeadActivity = Database["public"]["Tables"]["lead_activities"]["Row"];

import { LeadDetailTour } from "@/features/leads/_components/LeadDetailTour";
import { SuccessAnimation } from "@/components/settings/SuccessAnimation";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { tenantId } = await requireAuthContext();

  if (!tenantId) return notFound();
  
  const { multi_tenant_enabled } = await (await import("@/lib/actions/system-config")).getSystemConfig();

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
          "id, title, price, original_price, rental_price, original_rental_price, listing_type, district, popular_area, commission_sale_percentage, commission_rent_months, images",
        )
        .eq("tenant_id", tenantId)
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
    listing_type: p.listing_type,
    popular_area: p.popular_area,
    commission_sale_percentage: p.commission_sale_percentage,
    commission_rent_months: p.commission_rent_months,
    cover_image: (() => {
      const imagesArr = (p.images as any[]) || [];
      const cover = imagesArr.find((img: any) => img.is_cover) || imagesArr[0];
      return cover?.url || cover?.image_url || null;
    })(),
  }));

  async function onCreateActivity(values: LeadActivityFormValues) {
    "use server";
    const res = await createLeadActivityAction({ leadId: id, values });
    if (!res.success) throw new Error(res.error);
  }
  const propertyIds = ((lead.lead_activities as LeadActivity[] | null) ?? [])
    .map((a) => a.property_id)
    .filter((id): id is string => id !== null);

  const propertiesById = await getPropertySummariesByIdsQuery(propertyIds);

  return (
    <div className="space-y-8 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-4">
      <LeadDetailTour />
      <SuccessAnimation />
      {/* Breadcrumb Navigation */}
      <div className="px-1">
        <Breadcrumb
          backHref="/protected/leads"
          items={[
            { label: "ลีด", href: "/protected/leads" },
            { label: lead.full_name || "รายละเอียดลีด" },
          ]}
        />
      </div>

      {/* Header Card - Premium Modern Design */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl shadow-slate-200/50">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-l from-blue-600/20 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 px-6 py-10 md:px-10">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[10px] font-semibold text-blue-100 uppercase tracking-widest">
                Lead Detail
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">
              K. {lead.full_name}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <div className="px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-400/30 text-xs font-semibold text-blue-200">
                {leadStageLabelNullable(lead.stage)}
              </div>
              <div className="px-3 py-1 rounded-lg bg-slate-700/50 border border-slate-600/50 text-xs font-semibold text-slate-300">
                {leadSourceLabelNullable(lead.source)}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white h-12 px-6 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-lg shadow-black/5"
              href={`/protected/leads/${id}/edit`}
            >
              <Pencil className="h-4 w-4" />
              แก้ไขข้อมูล
            </Link>
            {multi_tenant_enabled && (
              <LeadTransferButton
                leadId={id}
                leadName={lead.full_name ?? "Unknown"}
                currentTenantId={tenantId}
              />
            )}
            <LeadActivityDialog
              leadId={id}
              leadName={lead.full_name ?? "Unknown"}
              onSubmitAction={onCreateActivity}
              tenantId={tenantId}
              triggerClassName="bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/20 border-0 h-12 rounded-xl font-semibold flex-1 sm:flex-none px-6"
            />
          </div>
        </div>
      </div>

      {/* PDPA & AI Summary Section */}
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <PDPAStatus
            leadId={id}
            consent={!!lead.pdpa_consent}
            consentDate={lead.consent_date}
          />
        </div>
        <div className="lg:col-span-2">
          <LeadSummaryCard 
            leadId={id} 
            initialSummary={lead.ai_summary_content}
          />
        </div>
      </div>

      {/* AI Smart Match Section */}
      <LeadSmartMatch 
        leadId={id} 
        leadName={lead.full_name ?? "ลูกค้า"} 
        initialSummary={lead.ai_summary_content ?? undefined}
      />

      {/* Top Row - Contact & Requirements (2 columns) */}
      <div className="grid gap-6 lg:gap-8 md:grid-cols-2">
        <LeadContactCard lead={lead} />
        <LeadRequirementsCard lead={lead} />
      </div>

      {/* Main Content - Dynamic Grid for 3 Section Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* Deals Section */}
        <div className="rounded-2xl border-none bg-white shadow-sm ring-1 ring-slate-100 flex flex-col h-[500px] xl:h-[600px] overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-indigo-900/5">
          <div className="flex items-center justify-between gap-4 p-5 border-b border-slate-50 bg-slate-50/20">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-500 shadow-lg shadow-indigo-100 flex items-center justify-center shrink-0 text-white">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-800 tracking-tight">
                  ดีล ({deals.length})
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">รายการความคืบหน้าของดีล</p>
              </div>
            </div>
            <DealFormDialog
              leadId={id}
              properties={properties || []}
              refreshOnSuccess
            />
          </div>
          <div className="flex-1 overflow-auto p-5 scrollbar-thin">
            <DealList deals={deals} properties={properties} hasActiveFilters={false} />
          </div>
        </div>

        {/* Documents Section */}
        <div className="h-[500px] xl:h-[600px]">
           <DocumentSection ownerId={id} ownerType="LEAD" tenantId={tenantId} />
        </div>

        {/* Timeline */}
        <div className="rounded-2xl border-none bg-white shadow-sm ring-1 ring-slate-100 flex flex-col h-[500px] xl:h-[600px] overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-orange-900/5 sm:col-span-1 lg:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between gap-4 p-5 border-b border-slate-50 bg-slate-50/20">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-orange-500 shadow-lg shadow-orange-100 flex items-center justify-center shrink-0 text-white">
                <HistoryIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-800 tracking-tight">
                  ประวัติกิจกรรม
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">ไทม์ไลน์การติดตามลีด</p>
              </div>
            </div>
            <LeadActivityDialog
              leadId={id}
              leadName={lead.full_name ?? "Unknown"}
              onSubmitAction={onCreateActivity}
              tenantId={tenantId}
            />
          </div>
          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
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
