"use server";

import { requireAuthContext, assertAdmin, assertStaff } from "@/lib/authz";
import {
  createTemplateSchema,
  CreateTemplateInput,
  updateTemplateSchema,
  UpdateTemplateInput,
} from "./schema";
import { revalidatePath } from "next/cache";
import { type Database } from "@/lib/database.types.generated";

// 1. Get All Templates
export async function getTemplatesAction() {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  let query = supabase
    .from("contract_templates")
    .select("id, name, content, description, type, is_active, created_at, tenant_id")
    .eq("is_active", true);

  if (tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Fetch Templates Error:", error);
    return [];
  }

  // Sort by custom business priority
  // 1: ใบจองทรัพย์ (RESERVATION_DOCUMENT)
  // 2: ใบเสร็จค่าเช่า (RENT_RECEIPT)
  // 3: สัญญาเช่า (LEASE_CONTRACT)
  // 4: สัญญาซื้อขาย (SALE_CONTRACT)
  const sortedData = [...(data || [])].sort((a, b) => {
    const weights: Record<string, number> = {
      RESERVATION_DOCUMENT: 1,
      RENT_RECEIPT: 2,
      LEASE_CONTRACT: 3,
      SALE_CONTRACT: 4,
    };
    const wA = weights[a.type] || 99;
    const wB = weights[b.type] || 99;
    return wA - wB;
  });

  if (error) {
    console.error("Fetch Templates Error:", error);
    return [];
  }

  if (sortedData && (!tenantId || tenantId === "ALL")) {
    const seen = new Set();
    return sortedData.filter((item: any) => {
      const key = item.type || item.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return sortedData;
}

// 2. Create Template (Admin only)
export async function createTemplateAction(input: CreateTemplateInput) {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertAdmin(role);

    const validated = createTemplateSchema.parse(input);

    const slug = validated.name
      ? validated.name.toLowerCase().replace(/[^a-z0-9\u0e00-\u0e7f]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString().slice(-4)
      : `template-${Date.now()}`;

    const { data, error } = await supabase
      .from("cms_content_v3")
      .insert({
        content_type: "CONTRACT_TEMPLATE",
        title: { th: validated.name, en: validated.name },
        slug,
        content: { th: validated.content, en: validated.content },
        meta_data: { excerpt: validated.description || "", category: validated.type },
        status: validated.is_active ? "PUBLISHED" : "DRAFT",
        author_id: user.id,
        tenant_id: tenantId && tenantId !== "ALL" ? tenantId : null,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/protected/documents");
    return { success: true, data };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "An error occurred";
    return { success: false, message: msg };
  }
}

// 3. Update Template (Admin only)
export async function updateTemplateAction(
  id: string,
  input: UpdateTemplateInput,
) {
  try {
    const { supabase, role } = await requireAuthContext();
    assertAdmin(role);

    const validated = updateTemplateSchema.parse(input);

    // Fetch existing cms_content record to merge values properly
    const { data: existing, error: fetchErr } = await supabase
      .from("cms_content_v3")
      .select("title, content, meta_data, status")
      .eq("id", id)
      .single();

    if (fetchErr) throw new Error(fetchErr.message);

    const updatePayload: Database["public"]["Tables"]["cms_content_v3"]["Update"] = {};

    if (validated.name !== undefined) {
      const oldTitle = (existing.title as Record<string, any>) || {};
      updatePayload.title = { ...oldTitle, th: validated.name };
      // Also generate a new slug if name changed
      updatePayload.slug = validated.name.toLowerCase().replace(/[^a-z0-9\u0e00-\u0e7f]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString().slice(-4);
    }
    if (validated.content !== undefined) {
      const oldContent = (existing.content as Record<string, any>) || {};
      updatePayload.content = { ...oldContent, th: validated.content };
    }
    if (validated.description !== undefined || validated.type !== undefined) {
      const oldMeta = (existing.meta_data as Record<string, any>) || {};
      updatePayload.meta_data = {
        ...oldMeta,
        ...(validated.description !== undefined ? { excerpt: validated.description } : {}),
        ...(validated.type !== undefined ? { category: validated.type } : {}),
      };
    }
    if (validated.is_active !== undefined) {
      updatePayload.status = validated.is_active ? "PUBLISHED" : "DRAFT";
    }

    const { data, error } = await supabase
      .from("cms_content_v3")
      .update(updatePayload)
      .eq("id", id)
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/protected/documents");
    return { success: true, data };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "An error occurred";
    return { success: false, message: msg };
  }
}

// 4. Delete Template (Soft delete)
export async function deleteTemplateAction(id: string) {
  try {
    const { supabase, role } = await requireAuthContext();
    assertAdmin(role);

    const { error } = await supabase
      .from("cms_content_v3")
      .update({ status: "DRAFT" })
      .eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/protected/documents");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "An error occurred";
    return { success: false, message: msg };
  }
}
