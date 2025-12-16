import { redirect } from "next/navigation";
import { LeadForm } from "@/features/leads/LeadsForm";
import { createLeadAction } from "@/features/leads/actions";

export default function LeadNewPage() {
  async function onSubmitAction(values: any) {
    "use server";
    const res = await createLeadAction(values);
    if (!res.success) throw new Error(res.message);
    redirect(`/protected/leads/${res.leadId}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">เพิ่ม Lead ใหม่</h1>
      <LeadForm onSubmitAction={onSubmitAction} />
    </div>
  );
}
