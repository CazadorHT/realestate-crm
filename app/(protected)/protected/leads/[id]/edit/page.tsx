import { redirect, notFound } from "next/navigation";
import { LeadForm } from "@/features/leads/LeadsForm";
import { getLeadByIdQuery } from "@/features/leads/queries";
import { updateLeadAction } from "@/features/leads/actions";
import { leadRowToFormValues } from "@/features/leads/mapper";
import { LeadFormValues } from "@/features/leads/types";
import { Breadcrumb } from "@/components/ui/breadcrumb";

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
    <div className="space-y-6 p-6">
      <Breadcrumb
        backHref={`/protected/leads/${id}`}
        items={[
          { label: "ลีด", href: "/protected/leads" },
          {
            label: lead.full_name || "รายละเอียด",
            href: `/protected/leads/${id}`,
          },
          { label: "แก้ไข" },
        ]}
      />
      <h1 className="text-xl font-semibold">แก้ไข Lead</h1>
      <LeadForm
        leadId={id}
        initialValues={leadRowToFormValues(lead)}
        onSubmitAction={onSubmitAction}
      />
    </div>
  );
}
