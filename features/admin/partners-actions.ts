"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuthContext, assertStaff } from "@/lib/authz";

import { calculateNewSortOrders } from "./partners-utils";

type CreatePartnerInput = {
  name: string;
  logo_url: string;
  website_url?: string;
  sort_order?: number;
};

type UpdatePartnerInput = {
  id: string;
  name?: string;
  logo_url?: string;
  website_url?: string;
  sort_order?: number;
  is_active?: boolean;
};

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
    const { role } = await requireAuthContext();
    assertStaff(role);

    const supabase = await createClient();
    const { error } = await supabase.from("partners").insert([input]);

    if (error) return { success: false, message: error.message };

    // Clean up order after insert
    await resequencePartners();

    revalidatePath("/admin/partners");
    revalidatePath("/");
    return { success: true, message: "สร้างพาร์ทเนอร์สำเร็จ" };
  } catch (error: any) {
    return { success: false, message: error.message || "เกิดข้อผิดพลาด" };
  }
}

export async function updatePartner(input: UpdatePartnerInput) {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    const supabase = await createClient();
    const { id, ...updates } = input;

    const { error } = await supabase
      .from("partners")
      .update(updates)
      .eq("id", id);
    if (error) return { success: false, message: error.message };

    // Clean up order after update
    await resequencePartners();

    revalidatePath("/admin/partners");
    revalidatePath("/");
    return { success: true, message: "แก้ไขพาร์ทเนอร์สำเร็จ" };
  } catch (error: any) {
    return { success: false, message: error.message || "เกิดข้อผิดพลาด" };
  }
}

export async function deletePartner(id: string) {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    const supabase = await createClient();
    const { error } = await supabase.from("partners").delete().eq("id", id);

    if (error) return { success: false, message: error.message };

    // Re-sequence after delete to fill gaps
    await resequencePartners();

    revalidatePath("/admin/partners");
    revalidatePath("/");
    return { success: true, message: "ลบพาร์ทเนอร์สำเร็จ" };
  } catch (error: any) {
    return { success: false, message: error.message || "เกิดข้อผิดพลาด" };
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
