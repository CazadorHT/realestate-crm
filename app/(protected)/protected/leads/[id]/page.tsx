import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
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

  // Fetch properties for the dropdown with all fields needed for DealFormDialog
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

  // Map to include cover_image for DealPropertyOption compatibility
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
      <div className="flex items-center justify-between gap-4 p-4 border-b border-slate-200 bg-linear-to-r from-slate-800 to-slate-900 rounded-xl">
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
            className="inline-flex items-center gap-1.5 rounded-lg py-2 px-3 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            href="/protected/leads"
          >
            ← ย้อนกลับ
          </Link>
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

      {/* Top Row - Contact & Requirements (2 columns) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact Card */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-semibold text-base flex items-center gap-2  text-slate-800">
              📞 ข้อมูลติดต่อ
            </h3>
          </div>
          <div className="p-5">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">สถานะลูกค้า</span>
                <span className="font-medium bg-slate-100 px-2.5 py-1 rounded-md text-xs">
                  {leadStageLabelNullable(lead.stage)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">เบอร์โทรศัพท์</span>
                <span className="font-medium">
                  {lead.phone ? (
                    <a
                      href={`tel:${lead.phone}`}
                      className="hover:underline text-blue-600"
                    >
                      {lead.phone}
                    </a>
                  ) : (
                    "-"
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">อีเมล</span>
                <span className="font-medium truncate max-w-[200px]">
                  {lead.email ? (
                    <a
                      href={`mailto:${lead.email}`}
                      className="hover:underline text-blue-600"
                    >
                      {lead.email}
                    </a>
                  ) : (
                    "-"
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Line ID</span>
                <span className="font-medium">
                  {(lead.preferences as any)?.line_id ? (
                    <span className="text-emerald-600 font-bold">
                      {(lead.preferences as any).line_id}
                    </span>
                  ) : (
                    "-"
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">ติดต่อออนไลน์</span>
                <span className="font-medium">
                  {(lead.preferences as any)?.online_contact || "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">สัญชาติ</span>
                <span className="font-medium">
                  {lead.nationality
                    ? `${lead.nationality} ${
                        lead.is_foreigner ? "(ต่างชาติ)" : "(ไทย)"
                      }`
                    : lead.is_foreigner
                      ? "ต่างชาติ"
                      : "ไทย"}
                </span>
              </div>
              {lead.note && (
                <div className="pt-3 border-t border-slate-200 mt-2">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1.5">
                    บันทึกเพิ่มเติม
                  </span>
                  <p className="text-sm bg-slate-50 p-3 rounded-lg text-slate-600">
                    {lead.note}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Requirements Card */}
        <div className="rounded-xl border border-slate-200 bg-white  shadow-sm space-y-4">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-semibold text-base flex items-center gap-2 text-slate-800">
              🎯 ความต้องการ
            </h3>
          </div>
          <div className="p-5">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">ทำเลที่สนใจ</span>
                <span className="font-medium text-right max-w-[60%] leading-snug">
                  {lead.preferred_locations &&
                  lead.preferred_locations.length > 0
                    ? lead.preferred_locations.join(", ")
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">งบประมาณ</span>
                <span className="font-semibold text-green-600">
                  {lead.budget_min || lead.budget_max ? (
                    <>
                      {lead.budget_min
                        ? `฿${lead.budget_min.toLocaleString()}`
                        : "0"}
                      {" - "}
                      {lead.budget_max
                        ? `฿${lead.budget_max.toLocaleString()}`
                        : "∞"}
                    </>
                  ) : (
                    "-"
                  )}
                </span>
              </div>

              {/* Room Requirements */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-lg flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">
                    ห้องนอน (ขั้นต่ำ)
                  </span>
                  <span className="font-bold text-xl text-slate-800">
                    {lead.min_bedrooms ?? "-"}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">
                    ห้องน้ำ (ขั้นต่ำ)
                  </span>
                  <span className="font-bold text-xl text-slate-800">
                    {lead.min_bathrooms ?? "-"}
                  </span>
                </div>
              </div>

              {(lead.min_size_sqm || lead.max_size_sqm) && (
                <div className="flex justify-between items-center pt-1">
                  <span className="text-muted-foreground">ขนาดพื้นที่</span>
                  <span className="font-medium">
                    {lead.min_size_sqm ?? 0} - {lead.max_size_sqm ?? "∞"} ตร.ม.
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-6">
                <span className="text-muted-foreground">ผู้พักอาศัย</span>
                <span className="font-medium">
                  {lead.num_occupants ? `${lead.num_occupants} คน` : "-"}
                </span>
              </div>

              {/* Preferences */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 ">
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <span className="text-xs text-muted-foreground block mb-1">
                    เลี้ยงสัตว์
                  </span>
                  <span className="font-medium text-sm">
                    {lead.has_pets ? "✅ เลี้ยงได้" : "❌ ไม่เลี้ยง"}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <span className="text-xs text-muted-foreground block mb-1">
                    สูบบุหรี่
                  </span>
                  <span className="font-medium text-sm">
                    {(lead.preferences as any)?.is_smoker
                      ? "✅ สูบ"
                      : "❌ ไม่สูบ"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 3 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Deals Section */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-base flex items-center gap-2">
              💼 ดีล ({deals.length})
            </h3>
            <DealFormDialog
              leadId={id}
              properties={properties || []}
              refreshOnSuccess
            />
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            รายการดีล (เช่า/ขาย) ที่เกี่ยวข้องกับลูกค้ารายนี้
          </p>
          <div className="flex-1 overflow-auto">
            <DealList deals={deals} properties={properties} />
          </div>
        </div>

        {/* Documents Section - uses its own wrapper */}
        <DocumentSection ownerId={id} ownerType="LEAD" />

        {/* Timeline */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-base flex items-center gap-2">
              📋 ประวัติกิจกรรม
            </h3>
            <LeadActivityDialog
              leadId={id}
              leadName={lead.full_name}
              onSubmitAction={onCreateActivity}
            />
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            บันทึกกิจกรรมที่เกี่ยวข้องกับลูกค้ารายนี้
          </p>
          <div className="flex-1 overflow-y-auto max-h-80">
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
