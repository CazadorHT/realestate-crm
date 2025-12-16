import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeadWithActivitiesQuery } from "@/features/leads/queries";
import { createLeadActivityAction } from "@/features/leads/actions";
import { LeadTimeline } from "@/components/leads/LeadTimeline";
import { LeadActivityForm } from "@/components/leads/LeadActivityForm";
import { getPropertySummariesByIdsQuery } from "@/features/leads/queries";
import { leadStageLabelNullable ,leadSourceLabelNullable } from "@/features/leads/labels";
import type { LeadStage, LeadSource } from "@/features/leads/labels";
export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLeadWithActivitiesQuery(id);
  if (!lead) return notFound();

  async function onCreateActivity(values: any) {
    "use server";
    const res = await createLeadActivityAction(id, values);
    if (!res.success) throw new Error(res.message);
  }
const propertyIds =
    (lead.lead_activities ?? [])
      .map((a: any) => a.property_id)
      .filter(Boolean) as string[];

  const propertiesById = await getPropertySummariesByIdsQuery(propertyIds);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{lead.full_name}</h1>
          <div className="text-sm text-muted-foreground">
            {leadStageLabelNullable(lead.stage)} • {leadSourceLabelNullable(lead.source)}
          </div>
        </div>

        <div className="flex gap-2">
          <Link className="rounded-md border px-3 py-2 text-sm" href="/protected/leads">
            Back
          </Link>
          <Link className="rounded-md bg-primary px-3 py-2 text-sm text-white" href={`/protected/leads/${id}/edit`}>
            Edit
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4 space-y-2">
          <div className="font-medium">Contact</div>
          <div>สถานะลูกค้า : <span className="font-semibold">{leadStageLabelNullable(lead.stage)}</span></div>
          <div>Phone: <span className="font-semibold">{lead.phone ?? "-"}</span></div>
          <div>Email: <span className="font-semibold">{lead.email ?? "-"}</span></div>
          <div>Note: <span className="font-semibold">{lead.note ?? "-"}</span></div>
        </div>

        <LeadActivityForm onSubmitAction={onCreateActivity} />
      </div>

      <LeadTimeline
        activities={lead.lead_activities ?? []}
        propertiesById={propertiesById}
        leadStage={lead.stage}
        leadSource={lead.source}
      />


    </div>
  );
}
