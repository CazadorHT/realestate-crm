import { requireAuthContext, assertStaff } from "@/lib/authz";
import { getSystemConfig } from "@/lib/actions/system-config";
import { Conversation } from "./types";
import { decrypt } from "@/lib/crypto";

/**
 * Fetch initial conversations (leads with latest omni messages)
 * with branch-aware filtering.
 */
export async function getInboxConversationsQuery(): Promise<Conversation[]> {
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
      tenant_id,
      note,
      preferences,
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
    if (tenantId) {
      // Specific Branch: Filter by selected tenant
      query = query.eq("tenant_id", tenantId);
    } else {
      // ALL Branches / Global View: No additional filter needed
      // (Bypasses the eq/or that used undefined variables)
    }
  }

  const { data, error } = await query
    .order("created_at", { referencedTable: "omni_messages", ascending: false })
    .limit(1, { referencedTable: "omni_messages" })
    .limit(50); // [OPTIMIZATION] Safeguard: Only load 50 active conversations initially for peak performance

  if (error) {
    console.error("Error fetching inbox conversations:", error);
    throw new Error(error.message);
  }

  return (data || []).map((conv) => ({
    ...conv,
    full_name: decrypt(conv.full_name) || "Unknown",
    line_id: decrypt(conv.line_id),
    note: decrypt(conv.note),
  })) as unknown as Conversation[];
}
    