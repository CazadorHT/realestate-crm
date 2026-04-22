"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthContext, assertAdmin, AuthzError, UserRole } from "@/lib/authz";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { mapDbError } from "@/lib/db-error";

import { createTenantSchema } from "@/lib/validations/tenant";

export async function getTenantCountAction() {
  const { role } = await requireAuthContext();
  assertAdmin(role);

  const adminSupabase = createAdminClient();
  const { count, error } = await adminSupabase
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .eq("is_deleted", false);

  if (error) {
    return { error: mapDbError(error) };
  }

  return { count: count || 0 };
}

export async function createInitialTenantAction(
  values: z.infer<typeof createTenantSchema>,
) {
  const ctx = await requireAuthContext();
  assertAdmin(ctx.role);

  const adminSupabase = createAdminClient();
  const validated = createTenantSchema.parse(values);

  // 1. Create the tenant
  const { data: tenant, error: tError } = await adminSupabase
    .from("tenants")
    .insert({
      name: validated.name,
      slug: validated.slug,
    })
    .select()
    .single();

  if (tError || !tenant) {
    return { error: mapDbError(tError) };
  }

  // 2. Add current admin as OWNER
  const { error: mError } = await adminSupabase.from("tenant_members").insert({
    tenant_id: tenant.id,
    profile_id: ctx.user.id,
    role: "OWNER",
  });

  if (mError) {
    // Soft failure for member addition, log it but return tenant
    console.error("Failed to add admin as owner to initial tenant", mError);
  }

  revalidatePath("/protected/settings/branches");

  await logAudit(ctx, {
    action: "tenant.create",
    entity: "tenants",
    entityId: tenant.id,
    metadata: { name: validated.name, slug: validated.slug, is_initial: true },
  });

  return { data: tenant };
}

export async function migrateDataToTenantAction(tenantId: string) {
  const ctx = await requireAuthContext();
  assertAdmin(ctx.role);

  const adminSupabase = createAdminClient();

  try {
    // 1. Migrate Users (Profiles) to this Tenant
    const { data: profiles, error: pError } = await adminSupabase
      .from("profiles")
      .select("id, role");

    if (pError) throw pError;

    if (profiles && profiles.length > 0) {
      const membersToInsert = profiles
        .filter((p) => p.id !== ctx.user.id) // Skip admin since they are already OWNER
        .map((p) => ({
          tenant_id: tenantId,
          profile_id: p.id,
          role: (p.role === "ADMIN" ? "ADMIN" : "AGENT") as UserRole, // fallback mapping
        }));

      if (membersToInsert.length > 0) {
        await adminSupabase.from("tenant_members").insert(membersToInsert);
      }
    }

    // 2. Migrate Tables with tenant_id
    const tablesToMigrate = [
      "properties",
      "contacts",
      "leads",
      "deals",
      "contracts",
      "tasks",
    ];

    for (const table of tablesToMigrate) {
      // We only update rows that are currently NOT assigned to any tenant
      const { error } = await adminSupabase
        .from(table as "properties" | "leads" | "deals")
        .update({ tenant_id: tenantId } as any) // Supabase types for bulk update can be tricky, but we'll use a safer cast if possible
        .is("tenant_id", null);

      if (error) {
        console.error(`Failed to migrate ${table}:`, error);
      }
    }

    await logAudit(ctx, {
      action: "tenant.update",
      entity: "tenants",
      entityId: tenantId,
      metadata: { migrated_tables: tablesToMigrate },
    });

    return { success: true };
  } catch (error) {
    return { error: mapDbError(error) };
  }
}

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
    return { error: mapDbError(error) };
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
    .select(
      "id, name, slug, logo_url, created_at, member_count:tenant_members(count)",
    )
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: mapDbError(error) };
  }

  // Flatten member count if necessary (Supabase return type can be complex)
  const branches = data.map((t) => ({
    ...t,
    memberCount: (t.member_count as unknown as { count: number }[])?.[0]?.count || 0,
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
    return { error: mapDbError(error) };
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
    },
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
    },
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
    return { error: mapDbError(error) };
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
    return { error: mapDbError(error) };
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
    return { error: mapDbError(error) };
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
        link: "/protected/settings/branches", // Link to where Ð¾Ð½Ð¸ can accept/see invitations
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
    return { error: mapDbError(error) };
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
    return { error: mapDbError(error) };
  }

  await logAudit(
    {
      supabase: adminSupabase,
      user: (await adminSupabase.auth.getUser()).data.user!,
      role: ctx.role,
    },
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
    return { error: mapDbError(error) };
  }

  revalidatePath("/protected/settings/branches");
  revalidatePath(`/protected/settings/branches/${id}`);

  await logAudit(
    {
      supabase: adminSupabase,
      user: (await adminSupabase.auth.getUser()).data.user!,
      role,
    },
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
    return { error: mapDbError(error) };
  }

  revalidatePath("/protected/settings/branches");

  await logAudit(
    {
      supabase: adminSupabase,
      user: (await adminSupabase.auth.getUser()).data.user!,
      role,
    },
    {
      action: "tenant.delete",
      entity: "tenants",
      entityId: id,
    },
  );

  return { success: true };
}
export async function acceptInvitationAction(tenantId: string) {
  const ctx = await requireAuthContext();
  const adminSupabase = createAdminClient();

  // 1. Find the pending invitation
  const { data: inv, error: fError } = await adminSupabase
    .from("tenant_invitations")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("email", ctx.user.email!)
    .eq("status", "PENDING")
    .maybeSingle();

  if (fError || !inv) {
    return { success: false, message: "คำเชิญอาจหมดอายุหรือถูกยกเลิกไปแล้ว" };
  }

  // 2. Add to members
  const { error: mError } = await adminSupabase.from("tenant_members").insert({
    tenant_id: tenantId,
    profile_id: ctx.user.id,
    role: inv.role as UserRole,
  });

  if (mError) {
    console.error("Error adding member from invite:", mError);
    return { success: false, message: "ไม่สามารถเข้าร่วมสาขาได้" };
  }

  // 3. Update invite status
  await adminSupabase
    .from("tenant_invitations")
    .update({ status: "ACCEPTED" })
    .eq("id", inv.id);

  revalidatePath("/protected/settings/branches");
  revalidatePath("/");
  
  return { success: true };
}

export async function declineInvitationAction(tenantId: string) {
  const ctx = await requireAuthContext();
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from("tenant_invitations")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("email", ctx.user.email!);

  if (error) {
    return { success: false, message: "เกิดข้อผิดพลาดในการยกเลิกคำเชิญ" };
  }

  revalidatePath("/");
  return { success: true };
}

export async function getBranchStatsAction(tenantId: string) {
  const { role } = await requireAuthContext();
  assertAdmin(role);

  const adminSupabase = createAdminClient();

  try {
    // 1. Members count
    const { count: memberCount, error: mError } = await adminSupabase
      .from("tenant_members")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    if (mError) throw mError;

    // 2. Pending invitations count
    const { count: inviteCount, error: iError } = await adminSupabase
      .from("tenant_invitations")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "PENDING");

    if (iError) throw iError;

    // 3. Properties count
    const { count: propertyCount, error: pError } = await adminSupabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    if (pError) throw pError;

    return {
      data: {
        memberCount: memberCount || 0,
        inviteCount: inviteCount || 0,
        propertyCount: propertyCount || 0,
      },
    };
  } catch (err) {
    return { error: mapDbError(err) };
  }
}
