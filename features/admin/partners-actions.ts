"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { mapDbError } from "@/lib/db-error";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { calculateNewSortOrders } from "./partners-utils";
import { z } from "zod";

const partnerSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อพาร์ทเนอร์"),
  logo_url: z.string().url("กรุณาระบุ URL รูปภาพที่ถูกต้อง"),
  website_url: z.string().optional().nullable(),
  sort_order: z.number().optional().default(0),
  is_active: z.boolean().optional().default(true),
});

const updatePartnerSchema = partnerSchema.partial().extend({
  id: z.string().uuid(),
});

type CreatePartnerInput = z.infer<typeof partnerSchema>;
type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>;

export async function getPartners() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getPartner(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function resequencePartners() {
  const supabase = await createClient();

  // Fetch all partners sorted by sort_order, then by updated_at (most recently changed first in case of collision)
  const { data: partners } = await supabase
    .from("partners")
    .select("id, sort_order")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  if (!partners) return;

  const updates = calculateNewSortOrders(partners);


  if (updates.length > 0) {
    const promises = updates.map(u => 
      supabase.from("partners").update({ sort_order: u.sort_order }).eq("id", u.id)
    );
    await Promise.all(promises);
  }
}

export async function createPartner(input: CreatePartnerInput) {
  try {
    const validated = partnerSchema.parse(input);

    const { role } = await requireAuthContext();
    assertStaff(role);

    const supabase = await createClient();
    const { error } = await supabase.from("partners").insert([validated]);

    if (error) throw error;

    // Clean up order after insert
    await resequencePartners();

    revalidatePath("/admin/partners");
    revalidatePath("/");
    return { success: true, message: "สร้างพาร์ทเนอร์สำเร็จ" };
  } catch (error: any) {
    console.error("createPartner error:", error);
    return { 
      success: false, 
      message: error instanceof z.ZodError 
        ? error.issues[0].message 
        : mapDbError(error) 
    };
  }
}

export async function updatePartner(input: UpdatePartnerInput) {
  try {
    const validated = updatePartnerSchema.parse(input);

    const { role } = await requireAuthContext();
    assertStaff(role);

    const supabase = await createClient();
    const { id, ...updates } = validated;

    const { error } = await supabase
      .from("partners")
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    // Clean up order after update
    await resequencePartners();

    revalidatePath("/admin/partners");
    revalidatePath("/");
    return { success: true, message: "แก้ไขพาร์ทเนอร์สำเร็จ" };
  } catch (error: any) {
    console.error("updatePartner error:", error);
    return { 
      success: false, 
      message: error instanceof z.ZodError 
        ? error.issues[0].message 
        : mapDbError(error) 
    };
  }
}

export async function deletePartner(id: string) {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    const supabase = await createClient();
    const { error } = await supabase.from("partners").delete().eq("id", id);

    if (error) throw error;

    // Re-sequence after delete to fill gaps
    await resequencePartners();

    revalidatePath("/admin/partners");
    revalidatePath("/");
    return { success: true, message: "ลบพาร์ทเนอร์สำเร็จ" };
  } catch (error: any) {
    console.error("deletePartner error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

export async function getPartnersDashboardStats() {
  const supabase = await createClient();

  const { count: totalPartners } = await supabase
    .from("partners")
    .select("*", { count: "exact", head: true });

  const { count: activePartners } = await supabase
    .from("partners")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: inactivePartners } = await supabase
    .from("partners")
    .select("*", { count: "exact", head: true })
    .eq("is_active", false);

  return {
    totalPartners: totalPartners || 0,
    activePartners: activePartners || 0,
    inactivePartners: inactivePartners || 0,
  };
}
