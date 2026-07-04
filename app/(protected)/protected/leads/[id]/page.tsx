import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { UserPlus, Briefcase, History as HistoryIcon, Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import { getLeadWithActivitiesQuery } from "@/features/leads/queries";
import { createLeadActivityAction } from "@/features/leads/actions";
import { requireAuthContext, isStaff } from "@/lib/authz";
import { LeadTimeline } from "@/components/leads/LeadTimeline";
import { LeadActivityDialog } from "@/components/leads/LeadActivityDialog";
import { getPropertySummariesByIdsQuery } from "@/features/leads/queries";
import {
  leadStageLabelNullable,
  leadSourceLabelNullable,
  type LeadStage,
  type LeadSource,
} from "@/features/leads/labels";
import { getDealsByLeadId } from "@/features/deals/queries";
import { DealList } from "@/features/deals/components/DealList";
import { DealFormDialog } from "@/features/deals/components/DealFormDialog";
import { DocumentSection } from "@/features/documents/components/DocumentSection";
import type { LeadActivityFormValues } from "@/lib/types/leads";
import type { Database } from "@/lib/database.types.generated";
import type { LeadPreferences } from "@/features/leads/types";

// Components
import { LeadContactCard } from "@/features/leads/components/LeadContactCard";
import { LeadRequirementsCard } from "@/features/leads/components/LeadRequirementsCard";
import { LeadSummaryCard } from "@/features/leads/components/LeadSummaryCard";
import { PDPAStatus } from "@/features/leads/components/PDPAStatus";
import { LeadTransferButton } from "@/features/leads/components/LeadTransferButton";
import { LeadSmartMatch } from "@/features/smart-match/components/LeadSmartMatch";

type LeadActivity = Database["public"]["Tables"]["activity_timeline_v3"]["Row"];

// --- V3 Hardened Types ---
interface PropertyV3Join {
  id: string;
  sale_price: number | null;
  rent_price: number | null;
  listing_type: string;
  branch_id: string | null;
  details: { title: any }[]; 
  media: { storage_path: string }[];
}

type LeadV3Row = Database["public"]["Tables"]["crm_leads_v3"]["Row"];

type LeadV3Mapped = Omit<LeadV3Row, "stage"> & {
  stage: LeadStage | null;
  full_name: string;
  pdpa_consent: boolean;
  consent_date: string | null;
  ai_summary_content: string | null;
  lead_activities: LeadActivity[];
  // Unpacked V3 Preferences for Legacy Component Compatibility
  preferred_locations: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  min_bedrooms: number | null;
  min_bathrooms: number | null;
  min_size_sqm: number | null;
  max_size_sqm: number | null;
  num_occupants: number | null;
  has_pets: boolean | null;
  preferred_property_types: string[] | null;
  need_company_registration: boolean | null;
  allow_airbnb: boolean | null;
  preferences: LeadPreferences | null;
  // Contact info
  phone: string | null;
  email: string | null;
  nationality: string | null;
  is_foreigner: boolean | null;
  note: string | null;
  line_id: string | null;
  wechat_id: string | null;
  whatsapp: string | null;
};

import { LeadDetailTour } from "@/features/leads/_components/LeadDetailTour";
import { LeadsMatchingTour } from "@/features/leads/_components/LeadsMatchingTour";
import { SuccessAnimation } from "@/components/settings/SuccessAnimation";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { tenantId, role } = await requireAuthContext();

  if (!tenantId && role !== "ADMIN" && !isStaff(role)) return notFound();
  
  const { multi_tenant_enabled } = await (await import("@/lib/actions/system-config")).getSystemConfig();

  const lead = await getLeadWithActivitiesQuery(id);
  if (!lead) return notFound();

  const [deals, propertiesRaw] = await Promise.all([
    getDealsByLeadId(id),
    (await import("@/lib/supabase/server")).createClient().then(c => {
      let query = c.from("properties_core")
        .select(`
          id, 
          sale_price, 
          rent_price, 
          listing_type, 
          branch_id,
          details:properties_details(title),
          media:property_media_v3(storage_path)
        `)
        .eq("status", 1)
        .eq("media.is_cover", true)
        .order("created_at", { ascending: false })
        .limit(50);
      
      const targetTenantId = tenantId || lead.tenant_id;
      if (targetTenantId) {
        query = query.eq("tenant_id", targetTenantId);
      }
      return query;
    }).then(res => res.data as unknown as PropertyV3Join[])
  ]);

  const properties = (propertiesRaw ?? []).map((p) => {
    const detailsVal = p.details;
    const detailsObj = Array.isArray(detailsVal) ? detailsVal[0] : detailsVal;
    return {
      id: p.id,
      title: (detailsObj?.title as any)?.th || (detailsObj?.title as any)?.en || "Untitled Property", 
      price: p.sale_price,
      rental_price: p.rent_price,
      listing_type: p.listing_type,
      cover_image: p.media?.[0]?.storage_path || null,
    };
  });

  // V3: Explicit Unpacking of JSONB Preferences (Strict Typing)
  const rawLead = lead as any;
  const prefs = (rawLead.preferences as any) || {};

  const leadV3: LeadV3Mapped = {
    ...rawLead,
    stage: (rawLead.stage as LeadStage | null) || null,
    full_name: rawLead.display_name || rawLead.full_name || "Unknown",
    pdpa_consent: rawLead.pdpa_consent !== undefined ? !!rawLead.pdpa_consent : !!prefs.pdpa_consent,
    consent_date: rawLead.consent_date || prefs.consent_date || null,
    ai_summary_content: rawLead.ai_summary_content || rawLead.ai_summary || null,
    lead_activities: rawLead.lead_activities || [],
    // Resilient Fallback Mapping: checks root query mapping first, falls back to legacy nested prefs
    preferred_locations: rawLead.preferred_locations || prefs.locations || null,
    budget_min: rawLead.budget_min !== null && rawLead.budget_min !== undefined ? rawLead.budget_min : (prefs.budget_min || null),
    budget_max: rawLead.budget_max !== null && rawLead.budget_max !== undefined ? rawLead.budget_max : (prefs.budget_max || null),
    min_bedrooms: rawLead.min_bedrooms !== null && rawLead.min_bedrooms !== undefined ? rawLead.min_bedrooms : (prefs.min_bedrooms || null),
    min_bathrooms: rawLead.min_bathrooms !== null && rawLead.min_bathrooms !== undefined ? rawLead.min_bathrooms : (prefs.min_bathrooms || null),
    min_size_sqm: rawLead.min_size_sqm !== null && rawLead.min_size_sqm !== undefined ? rawLead.min_size_sqm : (prefs.min_size || null),
    max_size_sqm: rawLead.max_size_sqm !== null && rawLead.max_size_sqm !== undefined ? rawLead.max_size_sqm : (prefs.max_size || null),
    num_occupants: rawLead.num_occupants !== null && rawLead.num_occupants !== undefined ? rawLead.num_occupants : (prefs.occupants || null),
    has_pets: rawLead.has_pets !== null && rawLead.has_pets !== undefined ? !!rawLead.has_pets : (prefs.has_pets || null),
    preferred_property_types: rawLead.preferred_property_types || prefs.property_types || null,
    need_company_registration: rawLead.need_company_registration !== null && rawLead.need_company_registration !== undefined ? !!rawLead.need_company_registration : (prefs.need_company || null),
    allow_airbnb: rawLead.allow_airbnb !== null && rawLead.allow_airbnb !== undefined ? !!rawLead.allow_airbnb : (prefs.allow_airbnb || null),
    preferences: (prefs as LeadPreferences) || null,
    // Contact Info mapping
    phone: rawLead.phone || null,
    email: rawLead.email || null,
    nationality: rawLead.nationality || null,
    is_foreigner: !!rawLead.is_foreigner,
    note: rawLead.note || null,
    line_id: rawLead.line_id || null,
    wechat_id: rawLead.wechat_id || null,
    whatsapp: rawLead.whatsapp || null,
  };
  
  const fullName = leadV3.full_name;

  async function onCreateActivity(values: LeadActivityFormValues) {
    "use server";
    const res = await createLeadActivityAction({ leadId: id, values });
    if (!res.success) throw new Error(res.error);
  }
  
  // V3 Activity Mapping: Use target_id if target_entity is PROPERTY
  const propertyIds = (leadV3.lead_activities ?? [])
    .filter((a) => a.target_entity === "PROPERTY")
    .map((a) => a.target_id)
    .filter((id): id is string => id !== null);
  const propertiesById = await getPropertySummariesByIdsQuery(propertyIds);

  return (
    <div className="space-y-8 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-4">
      <LeadDetailTour />
      <LeadsMatchingTour />
      <SuccessAnimation />
      {/* Breadcrumb Navigation */}
      <div className="px-1">
        <Breadcrumb
          backHref="/protected/leads"
          items={[
            { label: "ลีด", href: "/protected/leads" },
            { label: fullName || "รายละเอียดลีด" },
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
              K. {fullName}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <div className="px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-400/30 text-xs font-semibold text-blue-200">
                {leadStageLabelNullable(lead.stage as LeadStage | null)}
              </div>
              <div className="px-3 py-1 rounded-lg bg-slate-700/50 border border-slate-600/50 text-xs font-semibold text-slate-300">
                {leadSourceLabelNullable(lead.source as LeadSource | null)}
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
                leadName={fullName ?? "Unknown"}
                currentTenantId={tenantId || lead.tenant_id || ""}
                userRole={role}
              />
            )}
            <LeadActivityDialog
              leadId={id}
              leadName={fullName ?? "Unknown"}
              onSubmitAction={onCreateActivity}
              tenantId={tenantId || lead.tenant_id}
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
            consent={!!leadV3.pdpa_consent}
            consentDate={leadV3.consent_date}
          />
        </div>
        <div className="lg:col-span-2">
          <LeadSummaryCard 
            leadId={id} 
            initialSummary={leadV3.ai_summary_content}
          />
        </div>
      </div>

      {/* AI Smart Match Section */}
      <LeadSmartMatch 
        leadId={id} 
        leadName={fullName ?? "ลูกค้า"} 
        initialSummary={leadV3.ai_summary_content ?? undefined}
      />

      {/* Top Row - Contact & Requirements (2 columns) */}
      <div className="grid gap-6 lg:gap-8 md:grid-cols-2">
        <LeadContactCard lead={leadV3} />
        <LeadRequirementsCard lead={leadV3} />
      </div>

      {/* Main Content - Dynamic Grid for 3 Section Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* Deals Section */}
        <div className="rounded-2xl border-none bg-white shadow-sm ring-1 ring-slate-100 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-indigo-900/5">
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
        <div className="h-auto max-h-[600px]">
           <DocumentSection ownerId={id} ownerType="LEAD" tenantId={tenantId || lead.tenant_id} />
        </div>

        {/* Timeline */}
        <div className="rounded-2xl border-none bg-white shadow-sm ring-1 ring-slate-100 flex flex-col max-h-[600px]  overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-orange-900/5 sm:col-span-1 lg:col-span-2 xl:col-span-1">
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
              leadName={fullName ?? "Unknown"}
              onSubmitAction={onCreateActivity}
              tenantId={tenantId || lead.tenant_id}
            />
          </div>
          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
            <LeadTimeline
              activities={leadV3.lead_activities ?? []}
              propertiesById={propertiesById}
              leadId={id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
