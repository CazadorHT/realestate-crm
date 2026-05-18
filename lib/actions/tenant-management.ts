"use server";

import { requireAuthContext, assertAdmin, UserRole } from "@/lib/authz";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { mapDbError } from "@/lib/db-error";

import { createTenantSchema } from "@/lib/validations/tenant";

export async function getTenantCountAction() {
  const ctx = await requireAuthContext();
  assertAdmin(ctx.role);

  const { count, error } = await ctx.supabase
    .from("tenants_v3")
    .select("id", { count: "exact", head: true });

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

  const validated = createTenantSchema.parse(values);

  // 1. Create the tenant
  const { data: tenant, error: tError } = await ctx.supabase
    .from("tenants_v3")
    .insert({
      name: validated.name,
      slug: validated.slug,
    })
    .select("id, name, slug")
    .single();

  if (tError || !tenant) {
    return { error: mapDbError(tError) };
  }

  // 2. Add current admin as OWNER
  await ctx.supabase.from("tenant_members_v3").insert({
    tenant_id: tenant.id,
    identity_id: ctx.user.id,
    role: "OWNER",
  });

  // 3. 🏢 Elite Auto-Provisioning: Create the first branch (Main Branch)
  // V3 requires branch_id for properties and deals.
  const { data: branch } = await ctx.supabase
    .from("branches_v3")
    .insert({
      tenant_id: tenant.id,
      name: { th: "สำนักงานใหญ่", en: "Main Branch" },
      is_active: true,
    })
    .select("id")
    .single();

  revalidatePath("/protected/settings/branches");

  await logAudit(ctx, {
    action: "tenant.create",
    entity: "tenants",
    entityId: tenant.id,
    metadata: { 
      name: validated.name, 
      slug: validated.slug, 
      is_initial: true,
      auto_branch_id: branch?.id 
    },
  });

  return { data: tenant };
}

export async function migrateDataToTenantAction(tenantId: string) {
  const ctx = await requireAuthContext();
  assertAdmin(ctx.role);

  try {
    // 1. Migrate Identities (The Master Source) to this Tenant
    const { data: identities, error: pError } = await ctx.supabase
      .from("identities_v3")
      .select("id, role")
      .is("tenant_id", null); // Only migrate those without a home tenant

    if (pError) throw pError;

    if (identities && identities.length > 0) {
      const membersToInsert = identities
        .filter((p) => p.id !== ctx.user.id)
        .map((p) => ({
          tenant_id: tenantId,
          identity_id: p.id,
          role: (p.role === "ADMIN" ? "ADMIN" : "AGENT") as UserRole,
        }));

      if (membersToInsert.length > 0) {
        await ctx.supabase.from("tenant_members_v3").insert(membersToInsert);
        
        // Update Home Tenant for these identities
        await ctx.supabase
          .from("identities_v3")
          .update({ tenant_id: tenantId })
          .in("id", membersToInsert.map(m => m.identity_id));
      }
    }

    // 2. 🏢 Elite Migration: Assign default Main Branch for this tenant
    const { data: mainBranch } = await ctx.supabase
      .from("branches_v3")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    const tablesToMigrate = ["properties_core", "crm_leads_v3", "financial_ledger_v3"] as const;

    // Migrate properties_core: Tie to Tenant AND the default Main Branch
    await ctx.supabase
      .from("properties_core")
      .update({ 
        tenant_id: tenantId,
        branch_id: mainBranch?.id || null 
      })
      .is("tenant_id", null);

    // Migrate crm_leads_v3
    await ctx.supabase
      .from("crm_leads_v3")
      .update({ tenant_id: tenantId })
      .is("tenant_id", null);

    // Migrate financial_ledger_v3: Ensure branch alignment
    await ctx.supabase
      .from("financial_ledger_v3")
      .update({ 
        tenant_id: tenantId,
        branch_id: mainBranch?.id || null
      })
      .is("tenant_id", null);

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
    .from("tenants_v3")
    .insert({
      name: validated.name,
      slug: validated.slug,
    })
    .select("id, name, slug")
    .single();

  if (error || !data) {
    return { error: mapDbError(error) };
  }

  // 🏢 Elite Auto-Provisioning: Create the first branch for this tenant
  // V3 requires branch_id for properties and deals.
  await adminSupabase.from("branches_v3").insert({
    tenant_id: data.id,
    name: { th: "สำนักงานใหญ่", en: "Main Branch" },
    is_active: true,
  });

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
  const ctx = await requireAuthContext();
  assertAdmin(ctx.role);

  const { data, error } = await ctx.supabase
    .from("tenants_v3")
    .select(
      "id, name, slug, logo_url, created_at, tenant_members_v3(count)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return { error: mapDbError(error) };
  }

  // V3 Precise Mapping: Transform count aggregate safely
  const tenants = (data || []).map((t) => {
    const memberCountData = t.tenant_members_v3 as unknown as Array<{ count: number }>;
    return {
      ...t,
      memberCount: memberCountData?.[0]?.count || 0,
    };
  });

  return { data: tenants };
}

export async function getTenantMembersAction(tenantId: string) {
  const ctx = await requireAuthContext();
  assertAdmin(ctx.role);

  const { data, error } = await ctx.supabase
    .from("tenant_members_v3")
    .select(
      `
      id,
      role,
      identity_id,
      joined_at,
      identity:identities_v3!identity_id (
        id,
        display_name,
        full_name,
        nickname,
        email,
        phone,
        is_active,
        avatar_url,
        line_id,
        whatsapp_user_id,
        wechat_user_id
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
  const ctx = await requireAuthContext();
  assertAdmin(ctx.role);

  const validated = addMemberSchema.parse(values);

  // 1. Find identity by email (The Master Source)
  const { data: identity, error: pError } = await ctx.supabase
    .from("identities_v3")
    .select("id, tenant_id")
    .eq("email", validated.email)
    .single();

  if (pError || !identity) {
    return {
      error: "ไม่พบผู้ใช้งานรายนี้ในระบบ (ผู้ใช้งานต้องสมัครสมาชิกก่อน)",
    };
  }

  // 2. Add to tenant_members_v3
  const { error } = await ctx.supabase.from("tenant_members_v3").insert({
    tenant_id: validated.tenantId,
    identity_id: identity.id,
    role: validated.role,
  });

  if (!error) {
    // 🛡️ If user doesn't have a home tenant, set this one
    if (!identity.tenant_id) {
      await ctx.supabase
        .from("identities_v3")
        .update({ tenant_id: validated.tenantId })
        .eq("id", identity.id);
    }
  }

  revalidatePath(`/protected/settings/branches/${validated.tenantId}`);

  await logAudit(ctx, {
    action: "member.add",
    entity: "tenant_members",
    entityId: identity.id,
    metadata: {
      tenantId: validated.tenantId,
      role: validated.role,
      email: validated.email,
    },
  });

  return { success: true };
}

export async function removeTenantMemberAction(
  tenantId: string,
  profileId: string,
): Promise<{ success?: boolean; error?: string }> {
  const ctx = await requireAuthContext();
  assertAdmin(ctx.role);

  const { error } = await ctx.supabase
    .from("tenant_members_v3")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("identity_id", profileId);

  revalidatePath(`/protected/settings/branches/${tenantId}`);

  await logAudit(ctx, {
    action: "member.remove",
    entity: "tenant_members",
    entityId: profileId,
    metadata: { tenantId },
  });

  return { success: true };
}

const transferMemberSchema = z.object({
  profileId: z.string().uuid(),
  fromTenantId: z.string().uuid(),
  toTenantId: z.string().uuid(),
  role: z.enum(["OWNER", "ADMIN", "MANAGER", "AGENT", "VIEWER"]),
});

export async function getAllProfilesAction() {
  const ctx = await requireAuthContext();
  assertAdmin(ctx.role);

  const { data, error } = await ctx.supabase
    .from("identities_v3")
    .select("id, display_name, full_name, email, avatar_url, role")
    .order("display_name", { ascending: true });

  if (error) {
    return { error: mapDbError(error) };
  }

  return { data };
}

export async function transferTenantMemberAction(
  values: z.infer<typeof transferMemberSchema>,
) {
  const ctx = await requireAuthContext();
  assertAdmin(ctx.role);

  const validated = transferMemberSchema.parse(values);

  // Using p_profile_id as defined in the current DB types (V3 transition)
  const { error } = await ctx.supabase.rpc("transfer_tenant_member", {
    p_profile_id: validated.profileId,
    p_from_tenant_id: validated.fromTenantId,
    p_to_tenant_id: validated.toTenantId,
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

  const validated = inviteSchema.parse(values);

  const { data, error } = await ctx.supabase
    .from("tenant_invitations_v3")
    .insert({
      tenant_id: validated.tenantId,
      email: validated.email,
      role: validated.role,
      invited_by: ctx.user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      token: crypto.randomUUID(),
    })
    .select("id")
    .single();

  if (error) {
    return { error: mapDbError(error) };
  }

  await logAudit(ctx, {
    action: "member.add",
    entity: "tenant_invitations",
    entityId: data.id,
    metadata: {
      email: validated.email,
      role: validated.role,
      tenantId: validated.tenantId,
    },
  });

  // Create Real-time Notification if identity exists
  try {
    const { data: identity } = await ctx.supabase
      .from("identities_v3")
      .select("id")
      .eq("email", validated.email)
      .single();

    if (identity) {
      const { createNotificationAction } =
        await import("@/lib/actions/notifications");
      const { data: tenant } = await ctx.supabase
        .from("tenants_v3")
        .select("name")
        .eq("id", validated.tenantId)
        .single();

      await createNotificationAction({
        userId: identity.id,
        tenantId: validated.tenantId,
        type: "BRANCH_INVITE",
        title: "คำเชิญเข้าร่วมสาขาใหม่",
        message: `คุณได้รับคำเชิญให้เข้าร่วมสาขา "${tenant?.name || "ใหม่"}" ในบทบาท ${validated.role}`,
        link: "/protected/settings/branches",
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

  const { data, error } = await ctx.supabase
    .from("tenant_invitations_v3")
    .select("id, tenant_id, email, role, status, invited_by, created_at")
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

  const { data: inv, error: fetchError } = await ctx.supabase
    .from("tenant_invitations_v3")
    .select("tenant_id")
    .eq("id", invitationId)
    .single();

  if (fetchError || !inv) {
    return { error: "ไม่พบข้อมูลคำเชิญ" };
  }

  const { error } = await ctx.supabase
    .from("tenant_invitations_v3")
    .delete()
    .eq("id", invitationId);

  if (error) {
    return { error: mapDbError(error) };
  }

  await logAudit(ctx, {
    action: "member.remove",
    entity: "tenant_invitations",
    entityId: invitationId,
    metadata: { tenantId: inv.tenant_id },
  });

  revalidatePath(`/protected/settings/branches/${inv.tenant_id}`);
  return { success: true };
}

export async function updateTenantAction(
  id: string,
  values: z.infer<typeof createTenantSchema>,
) {
  const ctx = await requireAuthContext();
  assertAdmin(ctx.role);

  const validated = createTenantSchema.parse(values);

  const { data, error } = await ctx.supabase
    .from("tenants_v3")
    .update({
      name: validated.name,
      slug: validated.slug,
    })
    .eq("id", id)
    .select("id, name, slug")
    .single();

  if (error || !data) {
    return { error: mapDbError(error) };
  }

  revalidatePath("/protected/settings/branches");
  revalidatePath(`/protected/settings/branches/${id}`);

  await logAudit(ctx, {
    action: "tenant.update",
    entity: "tenants",
    entityId: id,
    metadata: { name: validated.name, slug: validated.slug },
  });

  return { data, error: null };
}

export async function deleteTenantAction(id: string) {
  const ctx = await requireAuthContext();
  assertAdmin(ctx.role);

  // Implement Soft Delete
  const { error } = await ctx.supabase
    .from("tenants_v3")
    .update({ is_deleted: true })
    .eq("id", id);

  if (error) {
    return { error: mapDbError(error) };
  }

  revalidatePath("/protected/settings/branches");

  await logAudit(ctx, {
    action: "tenant.delete",
    entity: "tenants",
    entityId: id,
  });

  return { success: true };
}

export async function acceptInvitationAction(tenantId: string) {
  const ctx = await requireAuthContext();

  const { error } = await ctx.supabase.rpc("accept_tenant_invitation", {
    p_tenant_id: tenantId,
  });

  if (error) {
    console.error("Error accepting invite:", error);
    return { success: false, message: "ไม่สามารถเข้าร่วมสาขาได้ หรือคำเชิญหมดอายุ" };
  }

  revalidatePath("/protected/settings/branches");
  revalidatePath("/");
  
  return { success: true };
}

export async function declineInvitationAction(tenantId: string) {
  const ctx = await requireAuthContext();

  const { error } = await ctx.supabase.rpc("decline_tenant_invitation", {
    p_tenant_id: tenantId,
  });

  if (error) {
    return { success: false, message: "เกิดข้อผิดพลาดในการยกเลิกคำเชิญ" };
  }

  revalidatePath("/");
  return { success: true };
}

export async function getBranchStatsAction(tenantId: string) {
  const ctx = await requireAuthContext();
  assertAdmin(ctx.role);

  try {
    // 1. Members count
    const { count: memberCount, error: mError } = await ctx.supabase
      .from("tenant_members_v3")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    if (mError) throw mError;

    // 2. Pending invitations count
    const { count: inviteCount, error: iError } = await ctx.supabase
      .from("tenant_invitations_v3")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "PENDING");

    if (iError) throw iError;

    // 3. Properties count
    const { count: propertyCount, error: pError } = await ctx.supabase
      .from("properties_core")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    if (pError) throw pError;

    // 4. Leads count (Elite V3 Stats)
    const { count: leadCount, error: lError } = await ctx.supabase
      .from("crm_leads_v3")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null);

    if (lError) throw lError;

    return {
      data: {
        memberCount: memberCount || 0,
        inviteCount: inviteCount || 0,
        propertyCount: propertyCount || 0,
        leadCount: leadCount || 0,
      },
    };
  } catch (err) {
    return { error: mapDbError(err) };
  }
}
