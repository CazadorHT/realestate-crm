import { requireAuthContext, assertStaff } from "@/lib/authz";
import { getSystemConfig } from "@/lib/actions/system-config";
import { Conversation } from "./types";
import { decrypt } from "@/lib/crypto";
import { Json } from "@/lib/database.types.generated";

/**
 * Fetch initial conversations (leads with latest omni messages)
 * with branch-aware filtering directly from V3 Core tables.
 */
export async function getInboxConversationsQuery(): Promise<Conversation[]> {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  let query = supabase
    .from("crm_leads_v3")
    .select(
      `
      id,
      source,
      tenant_id,
      utm_data,
      ai_summary,
      identity:identities_v3!crm_leads_v3_identity_id_fkey!inner (
        id,
        display_name,
        line_id,
        phone,
        social_links,
        communications_hub_v3!inner (
          id,
          content,
          created_at,
          direction,
          is_read,
          payload
        )
      ),
      tenants:tenants (
        id,
        name
      )
    `,
    );

  if (isMultiTenant) {
    if (tenantId) {
      // Specific Branch: Filter by selected tenant
      query = query.eq("tenant_id", tenantId);
    }
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(50); // [OPTIMIZATION] Safeguard: Only load 50 active conversations initially for peak performance

  if (error) {
    console.error("Error fetching inbox conversations:", error);
    throw new Error(error.message);
  }

  const leadsData = (data || []) as Array<{
    id: string;
    source: string | null;
    tenant_id: string | null;
    utm_data: Json | null;
    ai_summary: string | null;
    identity: {
      id: string;
      display_name: string | null;
      line_id: string | null;
      phone: string | null;
      social_links: Json | null;
      communications_hub_v3: Array<{
        id: string;
        content: string | null;
        created_at: string | null;
        direction: number;
        is_read: boolean | null;
        payload: Json | null;
      }>;
    } | null;
    tenants: {
      id: string;
      name: string;
    } | null;
  }>;

  return leadsData.map((lead): Conversation => {
    const identity = lead.identity;
    const rawDisplayName = identity?.display_name || "Unknown";
    const rawNote = lead.ai_summary;
    const utmData = (lead.utm_data as Record<string, unknown>) || {};
    
    // Filter out comments (only want direct messages / DMs)
    const comms = (identity?.communications_hub_v3 || []).filter((m: any) => {
      const payload = m.payload || {};
      if (payload.field === "comments" || payload.type === "comment") return false;
      if (payload.field === "feed" && payload.value?.item === "comment") return false;
      if (typeof m.content === "string" && (m.content.startsWith("[FB Comment]:") || m.content.startsWith("[IG Comment]:"))) return false;
      return true;
    });

    // Sort messages newest first
    const sortedComms = [...comms].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    const omniMessages = sortedComms.map((m) => ({
      id: m.id,
      lead_id: lead.id,
      tenant_id: lead.tenant_id,
      content: m.content,
      direction: m.direction === 0 ? "INCOMING" : "OUTGOING",
      source: lead.source,
      external_message_id: null,
      is_read: m.is_read || false,
      payload: (m.payload as any) || null,
      created_at: m.created_at,
      updated_at: m.created_at || new Date().toISOString(),
    }));

    return {
      id: lead.id,
      full_name: decrypt(rawDisplayName) || rawDisplayName,
      source: lead.source,
      tenant_id: lead.tenant_id,
      note: rawNote ? decrypt(rawNote) || rawNote : null,
      communications_hub_v3: omniMessages,
      preferences: (utmData.preferences as Record<string, unknown>) || {
        category: utmData.category as any,
      },
      tenants: lead.tenants,
    };
  }).filter(conv => conv.communications_hub_v3.length > 0);
}
    