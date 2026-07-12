"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAuthContext } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { mapDbError } from "@/lib/db-error";
import { getStatusFromDb } from "../labels";
import { purgeCloudflareCache } from "@/lib/cloudflare";

/**
 * Soft delete a property by setting deleted_at to now
 * Hardened: Enforces tenant isolation and revenue status protection
 */
export async function softDeleteProperty(id: string) {
  try {
    const ctx = await requireAuthContext();
    const { supabase, tenantId, role } = ctx;

    // 🛡️ SECURITY LOCK 1: Always check boundary if scoped, otherwise fetch first
    let query = supabase.from("properties_core").select("status, tenant_id, created_by, assigned_to").eq("id", id);
    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }
    const { data: prop, error: fetchErr } = await query.single();

    if (fetchErr || !prop)
      return {
        success: false,
        error: "ไม่พบข้อมูลทรัพย์สินในเขตพื้นที่ของคุณ",
      };

    // If tenantId is not in context (e.g. ALL mode selected), verify membership
    if (!tenantId && role !== "ADMIN") {
      const targetTenantId = prop.tenant_id;
      if (!targetTenantId) {
        return { success: false, error: "ทรัพย์สินไม่มีข้อมูลสาขา" };
      }
      
      const { data: member, error: memberErr } = await supabase
        .from("tenant_members_v3")
        .select("role")
        .eq("tenant_id", targetTenantId)
        .eq("identity_id", ctx.user.id)
        .single();

      if (memberErr || !member) {
        return {
          success: false,
          error: "คุณไม่มีสิทธิ์เข้าถึงสาขาของทรัพย์สินนี้",
        };
      }
    }

    const propStatusStr = getStatusFromDb(prop.status);
    const isRevenueAsset = ["SOLD", "RENTED"].includes(propStatusStr || "");
    const canBypass = role === "ADMIN" || role === "MANAGER";

    // 🛡️ SECURITY LOCK 1.5: Verify ownership or management override
    const isOwner = prop.created_by === ctx.user.id || prop.assigned_to === ctx.user.id;
    if (!isOwner && !canBypass) {
      return {
        success: false,
        error: "คุณไม่มีสิทธิ์ลบทรัพย์สินของผู้อื่น",
      };
    }

    // 💰 REVENUE PROTECTION: SOLD/RENTED objects are protected
    if (isRevenueAsset && !canBypass) {
      return {
        success: false,
        error:
          "สิทธิ์ไม่เพียงพอ: ทรัพย์สินที่ปิดการขายแล้วต้องให้ระดับ Manager หรือ Admin เป็นผู้ดำเนินการ",
      };
    }

    // 🛡️ SECURITY LOCK 2: Update with strict tenant isolation
    let updateQuery = supabase
      .from("properties_core")
      .update({ 
        deleted_at: new Date().toISOString(),
        status: 6 
      })
      .eq("id", id);

    if (tenantId) {
      updateQuery = updateQuery.eq("tenant_id", tenantId);
    } else if (prop.tenant_id) {
      updateQuery = updateQuery.eq("tenant_id", prop.tenant_id);
    }

    const { error } = await updateQuery;

    if (error) {
      console.error("Error soft deleting property:", error);
      return { success: false, error: mapDbError(error) };
    }

    // 📝 Log Audit
    await logAudit(ctx, {
      action: "property.trash",
      entity: "properties",
      entityId: id,
      metadata: { status: prop.status },
    });

    revalidatePath("/", "layout");
    revalidatePath("/protected/properties");
    revalidateTag("properties", "seconds");
    revalidateTag("public-data", "seconds");
    purgeCloudflareCache().catch(e => console.error("[Cloudflare] Auto-purge failed:", e));
    revalidateTag("popular-areas", "seconds");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: mapDbError(err) };
  }
}

/**
 * Restore a property from trash
 */
export async function restoreProperty(id: string) {
  try {
    const ctx = await requireAuthContext();
    const { supabase, tenantId, role } = ctx;

    // Fetch the property first to verify access if tenantId is undefined
    let query = supabase.from("properties_core").select("tenant_id, created_by, assigned_to").eq("id", id);
    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }
    const { data: prop, error: fetchErr } = await query.single();
    if (fetchErr || !prop) {
      return { success: false, error: "ไม่พบข้อมูลทรัพย์สิน" };
    }

    if (!tenantId && role !== "ADMIN") {
      const targetTenantId = prop.tenant_id;
      if (!targetTenantId) {
        return { success: false, error: "ทรัพย์สินไม่มีข้อมูลสาขา" };
      }
      
      const { data: member, error: memberErr } = await supabase
        .from("tenant_members_v3")
        .select("role")
        .eq("tenant_id", targetTenantId)
        .eq("identity_id", ctx.user.id)
        .single();

      if (memberErr || !member) {
        return {
          success: false,
          error: "คุณไม่มีสิทธิ์เข้าถึงสาขาของทรัพย์สินนี้",
        };
      }
    }

    const canBypass = role === "ADMIN" || role === "MANAGER";
    const isOwner = prop.created_by === ctx.user.id || prop.assigned_to === ctx.user.id;

    if (!isOwner && !canBypass) {
      return {
        success: false,
        error: "คุณไม่มีสิทธิ์กู้คืนทรัพย์สินของผู้อื่น",
      };
    }

    let updateQuery = supabase
      .from("properties_core")
      .update({ deleted_at: null })
      .eq("id", id);

    if (tenantId) {
      updateQuery = updateQuery.eq("tenant_id", tenantId);
    } else if (prop.tenant_id) {
      updateQuery = updateQuery.eq("tenant_id", prop.tenant_id);
    }

    const { error } = await updateQuery;
    if (error) return { success: false, error: mapDbError(error) };

    await logAudit(ctx, {
      action: "property.restore",
      entity: "properties",
      entityId: id,
    });
    revalidatePath("/", "layout");
    revalidatePath("/protected/properties");
    revalidateTag("properties", "seconds");
    revalidateTag("public-data", "seconds");
    purgeCloudflareCache().catch(e => console.error("[Cloudflare] Auto-purge failed:", e));
    revalidateTag("popular-areas", "seconds");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: mapDbError(err) };
  }
}

/**
 * Permanently delete a property from the database
 * Hardened: Prevents deletion of revenue records by non-admins
 */
export async function permanentDeleteProperty(id: string) {
  try {
    const ctx = await requireAuthContext();
    const { supabase, tenantId, role } = ctx;

    let query = supabase.from("properties_core").select("status, tenant_id, created_by, assigned_to").eq("id", id);
    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }
    const { data: prop, error: fetchErr } = await query.single();

    if (fetchErr || !prop)
      return { success: false, error: "ไม่พบข้อมูลทรัพย์สิน" };

    if (!tenantId && role !== "ADMIN") {
      const targetTenantId = prop.tenant_id;
      if (!targetTenantId) {
        return { success: false, error: "ทรัพย์สินไม่มีข้อมูลสาขา" };
      }
      
      const { data: member, error: memberErr } = await supabase
        .from("tenant_members_v3")
        .select("role")
        .eq("tenant_id", targetTenantId)
        .eq("identity_id", ctx.user.id)
        .single();

      if (memberErr || !member) {
        return {
          success: false,
          error: "คุณไม่มีสิทธิ์เข้าถึงสาขาของทรัพย์สินนี้",
        };
      }
    }

    const propStatusStr = getStatusFromDb(prop.status);
    const isRevenueAsset = ["SOLD", "RENTED"].includes(propStatusStr || "");
    const canBypass = role === "ADMIN" || role === "MANAGER";
    const isOwner = prop.created_by === ctx.user.id || prop.assigned_to === ctx.user.id;

    if (!isOwner && !canBypass) {
      return {
        success: false,
        error: "คุณไม่มีสิทธิ์ลบทรัพย์สินของผู้อื่น",
      };
    }

    if (isRevenueAsset && role !== "ADMIN") {
      return {
        success: false,
        error:
          "สิทธิ์ไม่เพียงพอ: ข้อมูลรายการขาย/เช่าสำเร็จ ห้ามลบออกจากฐานข้อมูลถาวร (ให้ใช้สิทธิ์ Admin เท่านั้น)",
      };
    }

    let deleteQuery = supabase
      .from("properties_core")
      .delete()
      .eq("id", id);

    if (tenantId) {
      deleteQuery = deleteQuery.eq("tenant_id", tenantId);
    } else if (prop.tenant_id) {
      deleteQuery = deleteQuery.eq("tenant_id", prop.tenant_id);
    }

    const { error } = await deleteQuery;
    if (error) return { success: false, error: mapDbError(error) };

    await logAudit(ctx, {
      action: "property.permanent_delete",
      entity: "properties",
      entityId: id,
    });
    revalidatePath("/", "layout");
    revalidatePath("/protected/properties");
    revalidatePath("/protected/properties/trash");
    revalidateTag("properties", "seconds");
    revalidateTag("public-data", "seconds");
    purgeCloudflareCache().catch(e => console.error("[Cloudflare] Auto-purge failed:", e));
    revalidateTag("popular-areas", "seconds");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: mapDbError(err) };
  }
}
