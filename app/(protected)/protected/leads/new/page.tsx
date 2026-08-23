import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { UserPlus } from "lucide-react";
import { LeadForm } from "@/features/leads/LeadsForm";
import { createLeadAction } from "@/features/leads/actions";
import { LeadFormValues } from "@/features/leads/types";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("crm-language")?.value || cookieStore.get("language")?.value || "th") as "th" | "en";
  const isEn = lang === "en";

  return {
    title: isEn ? "Add New Lead" : "เพิ่มลูกค้าใหม่",
    description: isEn
      ? "Fill in the details to add a new lead into the system"
      : "กรอกข้อมูลเพื่อเพิ่มลูกค้าใหม่เข้าในระบบ",
  };
}

export default async function LeadNewPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("crm-language")?.value || cookieStore.get("language")?.value || "th") as "th" | "en";
  const isEn = lang === "en";

  async function onSubmitAction(values: LeadFormValues) {
    "use server";
    const res = await createLeadAction(values);
    if (!res.success) {
      const cStore = await cookies();
      const currentIsEn = (cStore.get("crm-language")?.value || cStore.get("language")?.value || "th") === "en";
      return { success: false, message: res.error || (currentIsEn ? "Error creating lead" : "เกิดข้อผิดพลาดในการสร้างลีด") };
    }
    redirect(`/protected/leads/${res.data.leadId}?success=true`);
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        backHref="/protected/leads"
        items={[
          { label: isEn ? "Leads" : "ลูกค้า", href: "/protected/leads" },
          { label: isEn ? "Add New Lead" : "เพิ่มลูกค้าใหม่" },
        ]}
      />
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
          <UserPlus className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEn ? "Add New Lead" : "เพิ่มลูกค้าใหม่"}
          </h1>
          <p className="text-sm text-slate-500">
            {isEn
              ? "Fill in the details to add a new lead into the system"
              : "กรอกข้อมูลเพื่อเพิ่มลูกค้าใหม่เข้าในระบบ"}
          </p>
        </div>
      </div>
      <LeadForm onSubmitAction={onSubmitAction} />
    </div>
  );
}
