import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createLeadActivity } from "@/lib/db/lead-activity";
import { leadFormSchema } from "@/lib/validations/lead";
import { LeadForm } from "@/features/leads/LeadsForm";

export default function LeadNewPage() {
  async function createLeadAction(values: any) {
    "use server";
    const parsed = leadFormSchema.safeParse(values);
    if (!parsed.success) throw new Error("ข้อมูลไม่ถูกต้อง");

    const newLead = await createLeadActivity;
    revalidatePath(`/protected/leads`);
    redirect(`/protected/leads/${newLead.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">เพิ่ม Lead ใหม่</h1>
          <div className="text-sm text-muted-foreground">สร้างลูกค้าใหม่ในระบบ</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-1">
        <LeadForm initialValues={{}} onSubmitAction={createLeadAction} />
      </div>
    </div>
  );
}
