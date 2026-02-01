import { redirect } from "next/navigation";
import { LeadForm } from "@/features/leads/LeadsForm";
import { createLeadAction } from "@/features/leads/actions";
import { LeadFormValues } from "@/features/leads/types";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function LeadNewPage() {
  async function onSubmitAction(values: LeadFormValues) {
    "use server";
    const res = await createLeadAction(values);
    if (!res.success) throw new Error(res.message);
    redirect(`/protected/leads/${res.leadId}`);
  }

  return (
    <div className="space-y-6 p-6">
      <Breadcrumb
        backHref="/protected/leads"
        items={[
          { label: "ลีด", href: "/protected/leads" },
          { label: "เพิ่มลีดใหม่" },
        ]}
      />
      <h1 className="text-xl font-semibold">เพิ่ม Lead ใหม่</h1>
      <LeadForm onSubmitAction={onSubmitAction} />
    </div>
  );
}
