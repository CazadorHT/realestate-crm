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

export async function getPartners(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  const { page = 1, pageSize = 10, search = "" } = params || {};
  const supabase = await createClient();

  try {
    let query = supabase
      .from("partners")
      .select("*", { count: "exact" });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order("sort_order", { ascending: true })
      .range(from, to);

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      totalCount: count || 0,
    };
  } catch (error: any) {
    console.error("getPartners error:", error);
    return {
      success: false,
      message: mapDbError(error),
      data: [],
      totalCount: 0,
    };
  }
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

    // 1. Get the current maximum sort_order to place the new partner at the end
    const { data: maxOrderData } = await supabase
      .from("partners")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrderData?.sort_order || 0) + 1;

    // 2. Insert with the calculated order
    const { error } = await supabase.from("partners").insert([
      {
        ...validated,
        sort_order: nextOrder,
      },
    ]);

    if (error) throw error;

    // 3. Clean up order after insert to ensure no duplicates/gaps
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

export async function reorderPartnersAction(ids: string[], offset: number = 0) {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    const supabase = await createClient();

    // Use a Promise.all to update all partners in the new order
    // We add the offset to ensure correct ordering across pages
    const updates = ids.map((id, index) =>
      supabase
        .from("partners")
        .update({ 
          sort_order: offset + index + 1, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", id),
    );

    const results = await Promise.all(updates);
    const error = results.find((r) => r.error);
    if (error) throw error.error;

    revalidatePath("/admin/partners");
    revalidatePath("/");
    
    return { success: true, message: "ปรับลำดับพาร์ทเนอร์สำเร็จ" };
  } catch (error: any) {
    console.error("reorderPartnersAction error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

export async function uploadPartnerLogoAction(
  formData: FormData,
): Promise<{
  success: boolean;
  message: string;
  data?: { publicUrl: string };
}> {
  try {
    const { role } = await requireAuthContext();
    assertStaff(role);

    const file = formData.get("file") as File | null;
    if (!file) return { success: false, message: "ไม่พบไฟล์ที่อัปโหลด" };

    const { uploadSiteAsset } = await import("@/features/site-settings/storage");
    const result = await uploadSiteAsset(file, file.name, file.type, "partners");

    return result;
  } catch (error: any) {
    console.error("uploadPartnerLogoAction error:", error);
    return { success: false, message: mapDbError(error) };
  }
}
