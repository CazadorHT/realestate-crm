import { requireAuthContext, assertStaff } from "@/lib/authz";
import { getSystemConfig } from "@/lib/actions/system-config";
import { PropertyWithImages } from "../types";

/**
 * ✅ PROTECTED: ใช้ใน CRM เท่านั้น
 * - require auth
 * - authenticated user (Agent/Admin)
 * - query ด้วย id
 */
export async function getProtectedPropertyWithImagesById(
  id: string,
): Promise<PropertyWithImages> {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  let query = supabase
    .from("properties")
    .select(
      `
      *,
      property_images (
        id,
        property_id,
        image_url,
        storage_path,
        is_cover,
        sort_order,
        created_at
      )
    `,
    )
    .eq("id", id)
    .is("deleted_at", null);

  if (isMultiTenant && tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query.single();

  if (error || !data) throw error;

  if (data.property_images) {
    data.property_images.sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );
  }

  return data as unknown as PropertyWithImages;
}
