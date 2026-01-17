import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeadWithActivitiesQuery } from "@/features/leads/queries";
import { createLeadActivityAction } from "@/features/leads/actions";
import { LeadTimeline } from "@/components/leads/LeadTimeline";
import { LeadActivityForm } from "@/components/leads/LeadActivityForm";
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

  // Fetch properties for the dropdown (simple list)
  // Optimization: In real app, might want to search async, but for MVP fetching all (or limit) is okay.
  // Using getAllPropertiesQuery or writing a new specific query.
  // Let's assume we have a query for this or use basic supabase call here for speed if query not found.
  const { data: properties } = await (await import("@/lib/supabase/server"))
    .createClient()
    .then((c) =>
      c
        .from("properties")
        .select(
          "id, title, price, rental_price, commission_sale_percentage, commission_rent_months"
        )
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false })
        .limit(50)
    );

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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{lead.full_name}</h1>
          <div className="text-sm text-muted-foreground">
            {leadStageLabelNullable(lead.stage)} •{" "}
            {leadSourceLabelNullable(lead.source)}
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            className="rounded-md border px-3 py-2 text-sm"
            href="/protected/leads"
          >
            Back
          </Link>
          <Link
            className="rounded-md bg-primary px-3 py-2 text-sm text-white"
            href={`/protected/leads/${id}/edit`}
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4 space-y-2">
          <div className="font-medium">Contact</div>
          <div>
            สถานะลูกค้า :{" "}
            <span className="font-semibold">
              {leadStageLabelNullable(lead.stage)}
            </span>
          </div>
          <div>
            Phone: <span className="font-semibold">{lead.phone ?? "-"}</span>
          </div>
          <div>
            Email: <span className="font-semibold">{lead.email ?? "-"}</span>
          </div>
          <div>
            Note: <span className="font-semibold">{lead.note ?? "-"}</span>
          </div>
        </div>

        <LeadActivityForm onSubmitAction={onCreateActivity} />
      </div>

      {/* Deals Section */}
      <div className="space-y-4 rounded-xl border p-4 bg-muted/5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Deals ({deals.length})
          </h2>
          <DealFormDialog
            leadId={id}
            properties={properties || []}
            refreshOnSuccess
          />
        </div>
        <DealList deals={deals} />
      </div>

      {/* Documents Section */}
      {/* Documents Section (client-side upload + list with refresh) */}
      <DocumentSection ownerId={id} ownerType="LEAD" />

      <LeadTimeline
        activities={lead.lead_activities ?? []}
        propertiesById={propertiesById}
        leadStage={lead.stage}
        leadSource={lead.source}
      />
    </div>
  );
}
