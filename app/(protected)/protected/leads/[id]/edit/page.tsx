import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLeadById, updateLead } from "@/lib/db/leads";
import { leadFormSchema } from "@/lib/validations/lead";
import { LeadForm } from "@/features/leads/LeadsForm";
import Link from "next/link";

export default async function LeadEditPage({ params }: { params: { id: string } }) {
  const lead = await getLeadById(params.id);
  if (!lead) return notFound();

  async function updateLeadAction(values: any) {
    "use server";
    const parsed = leadFormSchema.safeParse(values);
    if (!parsed.success) throw new Error("ข้อมูลไม่ถูกต้อง");

    await updateLead(params.id, parsed.data);
    revalidatePath(`/protected/leads/${params.id}`);
    // หลังบันทึกให้กลับไปยังหน้า detail
    redirect(`/protected/leads/${params.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">แก้ไข Lead: {lead.full_name}</h1>
          <div className="text-sm text-muted-foreground">แก้ไขข้อมูลลูกค้า</div>
        </div>
        <div>
          <Link href={`/protected/leads/${params.id}`} className="underline">
            ย้อนกลับ
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-1">
        <LeadForm
          initialValues={{
            full_name: lead.full_name,
            phone: lead.phone,
            email: lead.email,
            source: lead.source ?? null,
            stage: lead.stage,
            property_id: lead.property_id,
            assigned_to: lead.assigned_to,
            budget_min: lead.budget_min,
            budget_max: lead.budget_max,
            note: lead.note,
          }}
          onSubmitAction={updateLeadAction}
        />
      </div>
    </div>
  );
}
