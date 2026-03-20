import { requireAuthContext, assertStaff } from "@/lib/authz";
import { getSystemConfig } from "@/lib/actions/system-config";

/**
 * Fetch initial conversations (leads with latest omni messages)
 * with branch-aware filtering.
 */
export async function getInboxConversationsQuery() {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  let query = supabase
    .from("leads")
    .select(
      `
      id,
      full_name,
      source,
      line_id,
      note,
      tenants(id, name),
      omni_messages (
        id,
        content,
        created_at,
        direction,
        is_read,
        payload
      )
    `,
    )
    .not("omni_messages", "is", null);

  if (isMultiTenant) {
    if (tenantId === undefined) {
      // ALL Branches: include unassigned or any branch
      query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
    } else {
      query = query.eq("tenant_id", tenantId!);
    }
  }

  const { data, error } = await query
    .order("created_at", { referencedTable: "omni_messages", ascending: false })
    .limit(1, { referencedTable: "omni_messages" });

  if (error) {
    console.error("Error fetching inbox conversations:", error);
    throw new Error(error.message);
  }

  return data || [];
}
