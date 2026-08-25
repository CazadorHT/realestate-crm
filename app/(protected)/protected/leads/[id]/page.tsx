import { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { UserPlus, Briefcase, History as HistoryIcon, Pencil, UserCheck } from "lucide-react";
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
  getLeadSubSource,
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
import { ConvertLeadToPropertyDialog } from "@/features/leads/components/ConvertLeadToPropertyDialog";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const cookieStore = await cookies();
  const lang = (cookieStore.get("crm-language")?.value || cookieStore.get("language")?.value || "th") as "th" | "en";
  const isEn = lang === "en";

  const lead = await getLeadWithActivitiesQuery(id);
  const identity = (lead as any)?.identity_v3;
  const fullName = identity?.display_name || (lead as any)?.full_name || (isEn ? "Lead Detail" : "รายละเอียดลูกค้า");

  return {
    title: `${fullName} | ${isEn ? "Lead Details" : "รายละเอียดลูกค้า"}`,
    description: isEn
      ? `Lead details for ${fullName}`
      : `รายละเอียดข้อมูลลูกค้า ${fullName}`,
  };
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("crm-language")?.value || cookieStore.get("language")?.value || "th") as "th" | "en";
  const isEn = lang === "en";

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
    })
  ]);

  const properties = (propertiesRaw.data as unknown as PropertyV3Join[])?.map(p => ({
    id: p.id,
    title: p.details?.[0]?.title ?? "Untitled",
    price: p.sale_price ?? p.rent_price ?? null,
    rental_price: p.rent_price ?? null,
    listing_type: p.listing_type,
    main_image_url: p.media?.[0]?.storage_path ?? null,
    branch_id: p.branch_id
  })) || [];

  // V3 Unpack Identity Profile
  const identity = (lead as any).identity || (lead as any).identity_v3;
  const socialLinks = (identity?.social_links as Record<string, any>) || {};
  const fullName = (lead as any).full_name || identity?.display_name || "Unknown";

  const leadV3: LeadV3Mapped = {
    ...lead as any,
    full_name: fullName,
    phone: (lead as any).phone || identity?.phone || null,
    email: (lead as any).email || socialLinks.email || null,
    nationality: (lead as any).nationality || socialLinks.nationality || null,
    is_foreigner: (lead as any).is_foreigner ?? socialLinks.is_foreigner ?? false,
    note: (lead as any).note || socialLinks.note || null,
    line_id: (lead as any).line_id || identity?.line_id || null,
    wechat_id: (lead as any).wechat_id || socialLinks.wechat_id || null,
    whatsapp: (lead as any).whatsapp || socialLinks.whatsapp || null,
    pdpa_consent: (lead as any).pdpa_consent,
    consent_date: (lead as any).consent_date,
    ai_summary_content: (lead as any).ai_summary_content,
    lead_activities: ((lead as any).lead_activities || []) as unknown as LeadActivity[],
    // V3 Preferences Mapping
    preferred_locations: (lead as any).preferences?.locations || (lead as any).preferred_locations || null,
    budget_min: (lead as any).preferences?.budget_min || (lead as any).budget_min || null,
    budget_max: (lead as any).preferences?.budget_max || (lead as any).budget_max || null,
    min_bedrooms: (lead as any).preferences?.min_bedrooms || (lead as any).min_bedrooms || null,
    min_bathrooms: (lead as any).preferences?.min_bathrooms || (lead as any).min_bathrooms || null,
    min_size_sqm: (lead as any).preferences?.min_size_sqm || (lead as any).min_size_sqm || null,
    max_size_sqm: (lead as any).preferences?.max_size_sqm || (lead as any).max_size_sqm || null,
    num_occupants: (lead as any).preferences?.occupants || (lead as any).num_occupants || null,
    has_pets: (lead as any).preferences?.pets ?? (lead as any).has_pets ?? null,
    preferred_property_types: (lead as any).preferences?.property_types 
      || ((lead as any).preferred_property_types)
      || ((lead as any).utm_data?.property_type ? [(lead as any).utm_data.property_type] : null),
    need_company_registration: (lead as any).preferences?.company_registration || (lead as any).need_company_registration || null,
    allow_airbnb: (lead as any).preferences?.allow_airbnb || (lead as any).allow_airbnb || null,
    preferences: (lead as any).preferences as LeadPreferences | null,
  };

  const propertyIdsFromActivities = Array.from(
    new Set(
      (leadV3.lead_activities ?? [])
        .map((a: any) => a.property_id)
        .filter((pid: any): pid is string => typeof pid === "string" && pid.length > 0)
    )
  );

  const propertiesById =
    propertyIdsFromActivities.length > 0
      ? await getPropertySummariesByIdsQuery(propertyIdsFromActivities)
      : {};

  async function onCreateActivity(values: LeadActivityFormValues) {
    "use server";
    const res = await createLeadActivityAction({
      leadId: id,
      values: {
        activity_type: values.activity_type,
        property_id: values.property_id,
        note: values.note || "",
      },
    });
    if (!res.success) {
      throw new Error(res.error || "Failed to create activity");
    }
  }


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
            { label: isEn ? "Leads" : "ลีด", href: "/protected/leads" },
            { label: fullName || (isEn ? "Lead Details" : "รายละเอียดลีด") },
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
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <div className="px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-400/30 text-xs font-semibold text-blue-200">
                {leadStageLabelNullable((lead as any).stage as LeadStage | null, lang)}
              </div>
              <div className="px-3 py-1 rounded-lg bg-slate-700/50 border border-slate-600/50 text-xs font-semibold text-slate-300">
                {leadSourceLabelNullable((lead as any).source as LeadSource | null, lang)}
              </div>
              {getLeadSubSource(leadV3, isEn) && (
                <div className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm border ${
                  getLeadSubSource(leadV3, isEn)?.includes("ฝากทรัพย์") || getLeadSubSource(leadV3, isEn)?.includes("Deposit")
                    ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300 ring-1 ring-emerald-400/20"
                    : "bg-indigo-500/20 border-indigo-400/40 text-indigo-200 ring-1 ring-indigo-400/20"
                }`}>
                  <span>{getLeadSubSource(leadV3, isEn)?.includes("ฝากทรัพย์") || getLeadSubSource(leadV3, isEn)?.includes("Deposit") ? "🏠" : "📌"}</span>
                  <span>{getLeadSubSource(leadV3, isEn)}</span>
                </div>
              )}
              {((leadV3 as any)?.utm_data?.converted_to_owner_id || (leadV3 as any)?.is_converted_to_owner) && (
                <div className="px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm border bg-emerald-500/30 border-emerald-400/50 text-emerald-200 ring-1 ring-emerald-400/30">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-300" />
                  <span>{isEn ? "Converted to Owner" : "แปลงเป็นเจ้าของทรัพย์ (Owner) แล้ว"}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <ConvertLeadToPropertyDialog lead={leadV3} />
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white h-12 px-6 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-lg shadow-black/5 cursor-pointer"
              href={`/protected/leads/${id}/edit`}
            >
              <Pencil className="h-4 w-4" />
              {isEn ? "Edit Lead" : "แก้ไขข้อมูล"}
            </Link>
            {multi_tenant_enabled && (
              <LeadTransferButton
                leadId={id}
                leadName={fullName ?? "Unknown"}
                currentTenantId={tenantId || (lead as any).tenant_id || ""}
                userRole={role}
              />
            )}
            <LeadActivityDialog
              leadId={id}
              leadName={fullName ?? "Unknown"}
              onSubmitAction={onCreateActivity}
              tenantId={tenantId || (lead as any).tenant_id}
              triggerClassName="bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/20 border-0 h-12 rounded-xl font-semibold flex-1 sm:flex-none px-6 cursor-pointer"
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
        leadName={fullName ?? (isEn ? "Lead" : "ลูกค้า")} 
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
                  {isEn ? `Deals (${deals.length})` : `ดีล (${deals.length})`}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  {isEn ? "Deal progress tracking" : "รายการความคืบหน้าของดีล"}
                </p>
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
           <DocumentSection ownerId={id} ownerType="LEAD" tenantId={tenantId || (lead as any).tenant_id} />
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
                  {isEn ? "Activity History" : "ประวัติกิจกรรม"}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  {isEn ? "Lead follow-up timeline" : "ไทม์ไลน์การติดตามลีด"}
                </p>
              </div>
            </div>
            <LeadActivityDialog
              leadId={id}
              leadName={fullName ?? "Unknown"}
              onSubmitAction={onCreateActivity}
              tenantId={tenantId || (lead as any).tenant_id}
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
