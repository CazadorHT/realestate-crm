import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLeadById, updateLead } from "@/lib/db/leads";
import { getActivitiesByLeadId, createLeadActivity } from "@/lib/db/lead-activity";
import { leadFormSchema } from "@/lib/validations/lead";
import { leadActivitySchema } from "@/lib/validations/lead-activity";
import { LeadForm } from "@/features/leads/LeadsForm";
import { LeadTimeline } from "@/components/leads/LeadTimeline";
import Link from "next/link";
import { ActivityForm } from "@/components/leads/ActivityForm";
import { createClient } from "@/lib/supabase/server";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const lead = await getLeadById(params.id);
  if (!lead) return notFound();

  const activities = await getActivitiesByLeadId(params.id);

  async function updateLeadAction(values: any) {
    "use server";
    const parsed = leadFormSchema.safeParse(values);
    if (!parsed.success) throw new Error("ข้อมูลไม่ถูกต้อง");

    await updateLead(params.id, parsed.data);
    revalidatePath(`/protected/leads/${params.id}`);
  }

  async function createActivityAction(values: any) {
    "use server";
    const parsed = leadActivitySchema.safeParse(values);
    if (!parsed.success) throw new Error("ข้อมูลกิจกรรมไม่ถูกต้อง");

    // เอา user id จาก session เพื่อ set created_by
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id ?? null;

    await createLeadActivity(params.id, parsed.data, userId);
    revalidatePath(`/protected/leads/${params.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{lead.full_name}</h1>
            <div className="text-sm text-muted-foreground">
              {lead.phone ?? "-"} • {lead.email ?? "-"} • stage: {lead.stage}
            </div>
          </div>

          <div>
            <Link
              href={`/protected/leads/${params.id}/edit`}
              className="text-sm underline underline-offset-4"
            >
              แก้ไข
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LeadForm
          initialValues={{
            full_name: lead.full_name,
            phone: lead.phone,
            email: lead.email,
            source: lead.source ?? null,     // ✅ now allowed
            stage: lead.stage,               // ✅ now allows CLOSED
            property_id: lead.property_id,
            assigned_to: lead.assigned_to,
            budget_min: lead.budget_min,
            budget_max: lead.budget_max,
            note: lead.note,
          }}
          onSubmitAction={updateLeadAction}
        />

        <ActivityForm action={createActivityAction} />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Timeline</div>
        <LeadTimeline activities={activities} />
      </div>
    </div>
  );
}
