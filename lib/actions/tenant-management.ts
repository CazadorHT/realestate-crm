"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthContext, assertAdmin, AuthzError } from "@/lib/authz";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";

/**
 * Maps common Database error codes to user-friendly Thai messages
 */
function mapDatabaseError(error: any): string {
  if (!error) return "เกิดข้อผิดพลาดไม่ทราบสาเหตุ";

  const code = error.code;
  switch (code) {
    case "23505": // unique_violation
      return "ข้อมูลนี้มีอยู่ในระบบแล้ว (ซ้ำซ้อน)";
    case "23503": // foreign_key_violation
      return "ไม่สามารถดำเนินการได้ เนื่องจากข้อมูลนี้ยังถูกใช้งานอยู่ในส่วนอื่น";
    case "42P01": // undefined_table
      return "ไม่พบตารางข้อมูลในระบบ";
    case "PGRST116": // multiple_rows_yielded
      return "พบข้อมูลซ้ำซ้อนมากกว่าที่คาดไว้";
    default:
      return error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล";
  }
}

const createTenantSchema = z.object({
  name: z.string().min(2, "ชื่อสาขาต้องมีอย่างน้อย 2 ตัวอักษร"),
  slug: z
    .string()
    .min(2, "Slug ต้องมีอย่างน้อย 2 ตัวอักษร")
    .regex(/^[a-z0-h-]+$/, "Slug ต้องเป็นภาษาอังกฤษตัวเล็กและขีดกลางเท่านั้น"),
});

export async function createTenantAction(
  values: z.infer<typeof createTenantSchema>,
) {
  const ctx = await requireAuthContext();
  assertAdmin(ctx.role);

  const adminSupabase = ctx.supabase;
  const validated = createTenantSchema.parse(values);

  const { data, error } = await adminSupabase
    .from("tenants")
    .insert({
      name: validated.name,
      slug: validated.slug,
    })
    .select()
    .single();

  if (error || !data) {
    return { error: mapDatabaseError(error) };
  }

  revalidatePath("/protected/settings/branches");

  await logAudit(ctx, {
    action: "tenant.create",
    entity: "tenants",
    entityId: data.id,
    metadata: { name: validated.name, slug: validated.slug },
  });

  return { data };
}

export async function getTenantsAction() {
  const { role } = await requireAuthContext();
  assertAdmin(role);

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from("tenants")
    .select("*, member_count:tenant_members(count)")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: mapDatabaseError(error) };
  }

  // Flatten member count if necessary (Supabase return type can be complex)
  const branches = data.map((t: any) => ({
    ...t,
    memberCount: t.member_count?.[0]?.count || 0,
  }));

  return { data: branches };
}

export async function getTenantMembersAction(tenantId: string) {
  const { role } = await requireAuthContext();
  assertAdmin(role);

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from("tenant_members")
    .select(
      `
      id,
      role,
      profile_id,
      profiles (
        id,
        full_name,
        email,
        avatar_url
      )
    `,
    )
    .eq("tenant_id", tenantId);

  if (error) {
    return { error: error.message };
  }

  return { data };
}

const addMemberSchema = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  role: z.enum(["OWNER", "ADMIN", "MANAGER", "AGENT", "VIEWER"]),
});

export async function addTenantMemberAction(
  values: z.infer<typeof addMemberSchema>,
) {
  const { role: myRole } = await requireAuthContext();
  assertAdmin(myRole);

  const adminSupabase = createAdminClient();
  const validated = addMemberSchema.parse(values);

  // 1. Find profile by email
  const { data: profile, error: pError } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("email", validated.email)
    .single();

  if (pError || !profile) {
    return {
      error: "ไม่พบผู้ใช้งานรายนี้ในระบบ (ผู้ใช้งานต้องสมัครสมาชิกก่อน)",
    };
  }

  // 2. Add to tenant_members
  const { error } = await adminSupabase.from("tenant_members").insert({
    tenant_id: validated.tenantId,
    profile_id: profile.id,
    role: validated.role,
  });

  revalidatePath(`/protected/settings/branches/${validated.tenantId}`);

  await logAudit(
    {
      supabase: adminSupabase,
      user: (await adminSupabase.auth.getUser()).data.user!,
      role: myRole,
    } as any,
    {
      action: "member.add",
      entity: "tenant_members",
      entityId: profile.id,
      metadata: {
        tenantId: validated.tenantId,
        role: validated.role,
        email: validated.email,
      },
    },
  );

  return { success: true };
}

export async function removeTenantMemberAction(
  tenantId: string,
  profileId: string,
): Promise<{ success?: boolean; error?: string }> {
  const { role } = await requireAuthContext();
  assertAdmin(role);

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from("tenant_members")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("profile_id", profileId);

  revalidatePath(`/protected/settings/branches/${tenantId}`);

  await logAudit(
    {
      supabase: adminSupabase,
      user: (await adminSupabase.auth.getUser()).data.user!,
      role,
    } as any,
    {
      action: "member.remove",
      entity: "tenant_members",
      entityId: profileId,
      metadata: { tenantId },
    },
  );

  return { success: true };
}

export async function getAllProfilesAction() {
  const { role } = await requireAuthContext();
  assertAdmin(role);

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, role")
    .order("full_name", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data };
}
const transferMemberSchema = z.object({
  profileId: z.string().uuid(),
  fromTenantId: z.string().uuid(),
  toTenantId: z.string().uuid(),
  role: z.enum(["OWNER", "ADMIN", "MANAGER", "AGENT", "VIEWER"]),
});

export async function transferTenantMemberAction(
  values: z.infer<typeof transferMemberSchema>,
) {
  const { role: myRole } = await requireAuthContext();
  assertAdmin(myRole);

  const adminSupabase = createAdminClient();
  const validated = transferMemberSchema.parse(values);

  // Use the new atomic RPC function
  const { error } = await adminSupabase.rpc("transfer_tenant_member", {
    p_profile_id: validated.profileId,
    p_from_tenant_id: validated.fromTenantId,
    p_to_tenant_id: validated.toTenantId,
    p_role: validated.role,
    p_admin_id:
      (await adminSupabase.auth.getUser()).data.user?.id || validated.profileId, // Fallback to profileId if null
  });

  if (error) {
    return { error: mapDatabaseError(error) };
  }

  revalidatePath(`/protected/settings/branches/${validated.fromTenantId}`);
  revalidatePath("/protected/settings/branches");
  return { success: true };
}

const inviteSchema = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  role: z.enum(["ADMIN", "MANAGER", "AGENT", "VIEWER"]),
});

export async function createTenantInvitationAction(
  values: z.infer<typeof inviteSchema>,
) {
  const ctx = await requireAuthContext();
  assertAdmin(ctx.role);

  const adminSupabase = createAdminClient();
  const validated = inviteSchema.parse(values);

  const { data, error } = await adminSupabase
    .from("tenant_invitations")
    .insert({
      tenant_id: validated.tenantId,
      email: validated.email,
      role: validated.role,
      invited_by: ctx.user.id,
    })
    .select()
    .single();

  if (error) {
    return { error: mapDatabaseError(error) };
  }

  await logAudit(ctx, {
    action: "member.add", // Using member.add for now as it's an intention to add
    entity: "tenant_invitations",
    entityId: data.id,
    metadata: {
      email: validated.email,
      role: validated.role,
      tenantId: validated.tenantId,
    },
  });

  // Create Real-time Notification if profile exists
  try {
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("id")
      .eq("email", validated.email)
      .single();

    if (profile) {
      const { createNotificationAction } =
        await import("@/lib/actions/notifications");
      const { data: tenant } = await adminSupabase
        .from("tenants")
        .select("name")
        .eq("id", validated.tenantId)
        .single();

      await createNotificationAction({
        userId: profile.id,
        tenantId: validated.tenantId,
        type: "BRANCH_INVITE",
        title: "คำเชิญเข้าร่วมสาขาใหม่",
        message: `คุณได้รับคำเชิญให้เข้าร่วมสาขา "${tenant?.name || "ใหม่"}" ในบทบาท ${validated.role}`,
        link: "/protected/settings/branches", // Link to where они can accept/see invitations
      });
    }
  } catch (notifyErr) {
    console.error("Failed to send invitation notification:", notifyErr);
  }

  revalidatePath(`/protected/settings/branches/${validated.tenantId}`);
  return { success: true };
}

export async function getTenantInvitationsAction(tenantId: string) {
  const ctx = await requireAuthContext();
  assertAdmin(ctx.role);

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from("tenant_invitations")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "PENDING");

  if (error) {
    return { error: mapDatabaseError(error) };
  }

  return { data };
}

export async function cancelTenantInvitationAction(invitationId: string) {
  const ctx = await requireAuthContext();
  assertAdmin(ctx.role);

  const adminSupabase = createAdminClient();
  const { data: inv, error: fetchError } = await adminSupabase
    .from("tenant_invitations")
    .select("tenant_id")
    .eq("id", invitationId)
    .single();

  if (fetchError || !inv) {
    return { error: "ไม่พบข้อมูลคำเชิญ" };
  }

  const { error } = await adminSupabase
    .from("tenant_invitations")
    .delete()
    .eq("id", invitationId);

  if (error) {
    return { error: mapDatabaseError(error) };
  }

  await logAudit(
    {
      supabase: adminSupabase,
      user: (await adminSupabase.auth.getUser()).data.user!,
      role: ctx.role,
    } as any,
    {
      action: "member.remove",
      entity: "tenant_invitations",
      entityId: invitationId,
      metadata: { tenantId: inv.tenant_id },
    },
  );

  revalidatePath(`/protected/settings/branches/${inv.tenant_id}`);
  return { success: true };
}
export async function updateTenantAction(
  id: string,
  values: z.infer<typeof createTenantSchema>,
) {
  const { role } = await requireAuthContext();
  assertAdmin(role);

  const adminSupabase = createAdminClient();
  const validated = createTenantSchema.parse(values);

  const { data, error } = await adminSupabase
    .from("tenants")
    .update({
      name: validated.name,
      slug: validated.slug,
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return { error: mapDatabaseError(error) };
  }

  revalidatePath("/protected/settings/branches");
  revalidatePath(`/protected/settings/branches/${id}`);

  await logAudit(
    {
      supabase: adminSupabase,
      user: (await adminSupabase.auth.getUser()).data.user!,
      role,
    } as any,
    {
      action: "tenant.update",
      entity: "tenants",
      entityId: id,
      metadata: { name: validated.name, slug: validated.slug },
    },
  );

  return { data, error: null };
}

export async function deleteTenantAction(id: string) {
  const { role } = await requireAuthContext();
  assertAdmin(role);

  const adminSupabase = createAdminClient();

  // Implement Soft Delete
  const { error } = await adminSupabase
    .from("tenants")
    .update({ is_deleted: true })
    .eq("id", id);

  if (error) {
    return { error: mapDatabaseError(error) };
  }

  revalidatePath("/protected/settings/branches");

  await logAudit(
    {
      supabase: adminSupabase,
      user: (await adminSupabase.auth.getUser()).data.user!,
      role,
    } as any,
    {
      action: "tenant.delete",
      entity: "tenants",
      entityId: id,
    },
  );

  return { success: true };
}
