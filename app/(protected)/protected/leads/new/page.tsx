import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
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
    <div className="space-y-6">
      <Breadcrumb
        backHref="/protected/leads"
        items={[
          { label: "ลูกค้า", href: "/protected/leads" },
          { label: "เพิ่มลูกค้าใหม่" },
        ]}
      />
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
          <UserPlus className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">เพิ่มลูกค้าใหม่</h1>
          <p className="text-sm text-slate-500">
            กรอกข้อมูลเพื่อเพิ่มลูกค้าใหม่เข้าในระบบ
          </p>
        </div>
      </div>
      <LeadForm onSubmitAction={onSubmitAction} />
    </div>
  );
}
