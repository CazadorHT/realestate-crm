import { redirect, notFound } from "next/navigation";
import { LeadForm } from "@/features/leads/LeadsForm";
import { getLeadByIdQuery } from "@/features/leads/queries";
import { updateLeadAction } from "@/features/leads/actions";
import { leadRowToFormValues } from "@/features/leads/mapper";
import { LeadFormValues } from "@/features/leads/types";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { leadSourceLabelNullable, leadStageLabelNullable } from "@/features/leads/labels";

export default async function LeadEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLeadByIdQuery(id);
  if (!lead) return notFound();

  async function onSubmitAction(values: LeadFormValues) {
    "use server";
    const res = await updateLeadAction(id, values);
    if (!res.success) throw new Error(res.message);
    redirect(`/protected/leads/${id}`);
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        backHref={`/protected/leads/${id}`}
        items={[
          { label: "ลีด", href: "/protected/leads" },
          {
            label: lead.full_name || "รายละเอียด",
            href: `/protected/leads/${id}`,
          },
          { label: "แก้ไขข้อมูล" },
        ]}
      />
      <div className="flex items-center justify-between gap-4 px-4 py-8 border-b border-slate-200 bg-linear-to-r from-slate-800 to-slate-900 rounded-xl">
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
      </div>
      <LeadForm
        leadId={id}
        initialValues={leadRowToFormValues(lead)}
        onSubmitAction={onSubmitAction}
      />
    </div>
  );
}
