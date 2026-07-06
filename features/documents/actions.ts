"use server";

import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import {
  createDocumentSchema,
  CreateDocumentInput,
  DocumentOwnerType,
} from "./schema";

import { mapDbError } from "@/lib/db-error";
import { revalidatePath } from "next/cache";
import { DocumentWithRelations } from "./types";

// 1. Get Documents by Owner
export async function getDocumentsByOwner(
  ownerId: string,
  ownerType: DocumentOwnerType,
  tenantId?: string | null,
) {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  let query = supabase
    .from("documents")
    .select("id, owner_id, owner_type, document_type, file_name, storage_path, mime_type, size_bytes, version, parent_id, created_at, tenant_id, tenant:tenants(id, name), ai_summary, ai_verified_status, esign_status, esign_envelope_id, esign_signed_at")
    .eq("owner_id", ownerId)
    .eq("owner_type", ownerType);

  if (tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch Documents Error:", error);
    return [];
  }

  return (data || []).map((doc) => {
    let parsedAnalysis = null;
    let summaryText = doc.ai_summary;
    if (doc.ai_summary) {
      try {
        const parsed = JSON.parse(doc.ai_summary);
        if (parsed && typeof parsed === "object" && "summary" in parsed) {
          parsedAnalysis = parsed;
          summaryText = parsed.summary;
        }
      } catch (e) {
        // Not JSON
      }
    }
    return {
      ...doc,
      ai_summary: summaryText,
      ai_analysis: parsedAnalysis,
    };
  });
}

export async function getAllDocuments(
  page = 1,
  pageSize = 50,
  tenantId?: string | null,
  search?: string,
  typeFilter?: string,
) {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  const offset = (page - 1) * pageSize;

  let searchOwnerIds: string[] = [];

  if (search) {
    const q = `%${search}%`;
    // 1. Find matching Leads and Properties first
    const [matchingLeads, matchingProps] = await Promise.all([
      supabase.from("leads").select("id").ilike("full_name", q),
      supabase.from("properties").select("id").ilike("title", q),
    ]);

    const leadIds = (matchingLeads.data?.map((l) => l.id).filter(Boolean) || []) as string[];
    const propIds = (matchingProps.data?.map((p) => p.id).filter(Boolean) || []) as string[];
    searchOwnerIds = [...leadIds, ...propIds];
  }

  let query = supabase
    .from("documents")
    .select("id, owner_id, owner_type, document_type, file_name, storage_path, mime_type, size_bytes, version, parent_id, created_at, tenant_id, tenant:tenants(id, name), ai_summary, ai_verified_status, esign_status, esign_envelope_id, esign_signed_at", { count: "exact" });

  if (tenantId && tenantId !== "ALL") {
    query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
  }

  if (search) {
    const q = `%${search}%`;
    // Deep Search condition: filename OR type OR owner_id is in matching leads/props
    let orCondition = `file_name.ilike.${q},document_type.ilike.${q}`;
    if (searchOwnerIds.length > 0) {
      orCondition += `,owner_id.in.(${searchOwnerIds.join(",")})`;
    }
    query = query.or(orCondition);
  }

  // Server-side type filtering
  if (typeFilter && typeFilter !== "ALL") {
    if (typeFilter === "SLIP") {
      query = query.eq("document_type", "SLIP");
    } else if (typeFilter === "DOCUMENT") {
      query = query.neq("document_type", "SLIP");
    }
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error("Fetch All Documents Error:", error);
    throw new Error(mapDbError(error));
  }

  // --- Optimization: Calculate Global Total Size (Enterprise Scalability via RPC) ---
  const { data: statsData, error: statsError } = await (
    supabase.rpc as unknown as (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{
      data: { total_size_bytes: number; total_count: number }[] | null;
      error: unknown;
    }>
  )("get_documents_stats", {
    p_tenant_id: tenantId && tenantId !== "ALL" ? tenantId : null,
    p_search: search || null,
    p_type_filter: typeFilter || "ALL",
    p_owner_ids: searchOwnerIds.length > 0 ? searchOwnerIds : null,
  });

  if (statsError) {
    const err = statsError as {
      message?: string;
      code?: string;
      details?: string;
      hint?: string;
    };
    // Hardening: Provide detailed diagnostic info instead of empty object
    console.error("Fetch Document Stats Error (RPC failed, falling back):", {
      message: err.message,
      code: err.code,
      details: err.details,
      hint: err.hint,
    });
    // Silent fallback to avoid crashing display if RPC isn't deployed yet
  }

  // Type safe extraction from RPC table result
  const stats = (statsData || [])[0] || {};
  const globalTotalSize =
    (stats as { total_size_bytes?: number }).total_size_bytes || 0;
  const globalTotalCount =
    (stats as { total_count?: number }).total_count ?? count ?? 0;

  // Use RPC count if available, otherwise fallback to standard count
  const finalTotalCount = Number(globalTotalCount);

  const rawDocs = data || [];

  // --- Optimization: Batch Fetch Owners (Solve N+1) ---
  const ownerIdsByType: Record<string, Set<string>> = {
    PROPERTY: new Set(),
    LEAD: new Set(),
    DEAL: new Set(),
    RENTAL_CONTRACT: new Set(),
  };

  rawDocs.forEach((doc) => {
    if (doc.owner_id && ownerIdsByType[doc.owner_type]) {
      ownerIdsByType[doc.owner_type].add(doc.owner_id);
    }
  });

  // Batch queries for each type
  const [properties, leads, deals, contracts] = await Promise.all([
    ownerIdsByType.PROPERTY.size > 0
      ? supabase
          .from("properties")
          .select("id, title")
          .in("id", Array.from(ownerIdsByType.PROPERTY))
      : Promise.resolve({ data: [] }),
    ownerIdsByType.LEAD.size > 0
      ? supabase
          .from("leads")
          .select("id, full_name, email")
          .in("id", Array.from(ownerIdsByType.LEAD))
      : Promise.resolve({ data: [] }),
    ownerIdsByType.DEAL.size > 0
      ? supabase
          .from("deals")
          .select(
            "id, property:properties(title), lead:leads(id, full_name, email)",
          )
          .in("id", Array.from(ownerIdsByType.DEAL))
      : Promise.resolve({ data: [] }),
    ownerIdsByType.RENTAL_CONTRACT.size > 0
      ? supabase
          .from("rental_contracts")
          .select(
            "id, deal:deals(id, property:properties(title), lead:leads(id, full_name, email))",
          )
          .in("id", Array.from(ownerIdsByType.RENTAL_CONTRACT))
      : Promise.resolve({ data: [] }),
  ]);

  // Create lookup maps
  const propMap = new Map(properties.data?.map((p) => [p.id, p]));
  const leadMap = new Map(leads.data?.map((l) => [l.id, l]));
  const dealMap = new Map(deals.data?.map((d) => [d.id, d]));
  const contractMap = new Map(contracts.data?.map((c) => [c.id, c]));

  // Map results back to docs
  const documentsWithOwners = rawDocs.map((doc) => {
    let ownerData: any = null;
    if (doc.owner_type === "PROPERTY") {
      ownerData = { property: propMap.get(doc.owner_id) };
    } else if (doc.owner_type === "LEAD") {
      ownerData = { lead: leadMap.get(doc.owner_id) };
    } else if (doc.owner_type === "DEAL") {
      ownerData = { deal: dealMap.get(doc.owner_id) };
    } else if (doc.owner_type === "RENTAL_CONTRACT") {
      ownerData = { rental_contract: contractMap.get(doc.owner_id) };
    }

    let parsedAnalysis = null;
    let summaryText = doc.ai_summary;
    if (doc.ai_summary) {
      try {
        const parsed = JSON.parse(doc.ai_summary);
        if (parsed && typeof parsed === "object" && "summary" in parsed) {
          parsedAnalysis = parsed;
          summaryText = parsed.summary;
        }
      } catch (e) {
        // Not JSON
      }
    }

    return {
      ...doc,
      id: doc.id!,
      file_name: doc.file_name ?? "Untitled",
      storage_path: doc.storage_path ?? "",
      created_at: doc.created_at ?? new Date().toISOString(),
      owner_type: doc.owner_type ?? "PROPERTY",
      owner_id: doc.owner_id ?? "",
      size_bytes: doc.size_bytes ? Number(doc.size_bytes) : null,
      document_type: doc.document_type ?? "DOCUMENT",
      tenant: doc.tenant as any,
      ai_summary: summaryText,
      ai_analysis: parsedAnalysis,
      ...ownerData,
    } as unknown as DocumentWithRelations;
  });

  return {
    data: documentsWithOwners,
    count: finalTotalCount,
    globalTotalSize: Number(globalTotalSize),
  };
}

// 2. Create Document Record (Metadata)
// Note: File upload happens on client (or via separate upload action), this records the metadata
export async function createDocumentRecordAction(input: CreateDocumentInput) {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    const validated = createDocumentSchema.parse(input);

    const canBypass = role === "ADMIN" || role === "MANAGER";

    if (!canBypass) {
      if (validated.owner_type === "PROPERTY") {
        const { data: prop } = await supabase.from("properties_core").select("created_by, assigned_to").eq("id", validated.owner_id).single();
        const isOwner = prop && (prop.created_by === user.id || prop.assigned_to === user.id);
        if (!isOwner) {
          return { success: false, message: "คุณไม่มีสิทธิ์จัดการเอกสารของทรัพย์สินผู้อื่น" };
        }
      } else if (validated.owner_type === "LEAD") {
        const { data: lead } = await supabase.from("leads").select("created_by, assigned_to").eq("id", validated.owner_id).single();
        const isOwner = lead && (lead.created_by === user.id || lead.assigned_to === user.id);
        if (!isOwner) {
          return { success: false, message: "คุณไม่มีสิทธิ์จัดการเอกสารของลีดผู้อื่น" };
        }
      } else if (validated.owner_type === "DEAL" || validated.owner_type === "RENTAL_CONTRACT") {
        const { data: deal } = await supabase.from("crm_deals_v3").select("created_by, agent_id").eq("id", validated.owner_id).single();
        const isOwner = deal && (deal.created_by === user.id || deal.agent_id === user.id);
        if (!isOwner) {
          return { success: false, message: "คุณไม่มีสิทธิ์จัดการเอกสารของดีล/สัญญาผู้อื่น" };
        }
      }
    }

    // If parent_id is provided, we might want to automatically increment the version
    // based on the parent's version if not provided in input
    let finalVersion = validated.version || 1;
    if (validated.parent_id && !input.version) {
      const { data: parentDoc } = await supabase
        .from("documents")
        .select("version")
        .eq("id", validated.parent_id)
        .single();
      if (parentDoc) {
        finalVersion = (parentDoc.version || 1) + 1;
      }
    }

    const { data, error } = await supabase
      .from("documents_v3")
      .insert({
        owner_id: validated.owner_id,
        owner_entity: validated.owner_type,
        document_type: validated.document_type,
        file_name: validated.file_name,
        storage_path: validated.storage_path,
        tenant_id:
          tenantId && tenantId !== "ALL" ? tenantId : validated.tenant_id,
        is_encrypted: false,
        size_bytes: validated.size_bytes || 0,
        mime_type: validated.mime_type || null,
      })
      .select("id, file_name, storage_path")
      .single();

    if (error) throw new Error(mapDbError(error));

    // Revalidate paths based on owner type?
    // Hard to map exactly to URL, but usually we are on:
    // /protected/leads/[id], /protected/properties/[id]
    // We can rely on router.refresh() on client side.

    return { 
      success: true, 
      data: {
        id: data.id,
        title: data.file_name,
        storage_path: data.storage_path,
      } 
    };
  } catch (error: unknown) {
    console.error("Document Action error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

// 3. Get Signed URL (for viewing)
export async function getDocumentSignedUrl(
  storagePath: string,
  bucket = "documents",
) {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  // Verify document existence/access first
  const { data: doc, error: docErr } = await (
    tenantId && tenantId !== "ALL"
      ? supabase
          .from("documents")
          .select("id")
          .eq("storage_path", storagePath)
          .eq("tenant_id", tenantId)
      : supabase.from("documents").select("id").eq("storage_path", storagePath)
  ).single();

  if (docErr || !doc) return null;

  // Create a signed URL valid for 1 hour (3600 seconds)
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.storage
    .from(bucket)
    .createSignedUrl(storagePath, 3600, {
      download: false,
    });

  if (error) return null;
  return data.signedUrl;
}

/**
 * 4. Get Version History
 * Fetches all documents that share the same root ancestor.
 */
export async function getDocumentVersionsAction(documentId: string) {
  try {
    const { supabase, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    // 1. Get current document to find its parent_id and owner
    let qInitial = supabase
      .from("documents")
      .select("id, parent_id, owner_id")
      .eq("id", documentId);

    if (tenantId && tenantId !== "ALL") {
      qInitial = qInitial.eq("tenant_id", tenantId);
    }

    const { data: currentDoc, error: cError } = await qInitial.single();

    if (cError || !currentDoc) throw new Error("ไม่พบเอกสารที่ระบุ");

    // 2. Find the root parent
    let rootId = documentId;
    if (currentDoc.parent_id) {
      // Simple approach: find the document where parent_id is null in the chain
      // Or more reliably, if we always link to the immediate parent, we can recurse.
      // For this MVP, let's assume parent_id might point to the absolute root or just the previous version.
      // Let's fetch all related and find the root.

      // Optimization: In a more complex system, we might want a 'root_id' column.
      // For now, let's just find the root by traversing up once or assuming all versions point to the same parent_id if it's the root.

      // For simplicity, let's search for the one document that has no parent_id and is connected to this chain.
      // Actually, let's just fetch all where (parent_id = currentDoc.parent_id OR id = currentDoc.parent_id OR parent_id = rootId)
      // The best way is probably to find the root first.

      let current = currentDoc;
      let depth = 0;
      const MAX_DEPTH = 20; // Safety limit

      while (current.parent_id && depth < MAX_DEPTH) {
        let qParent = supabase
          .from("documents")
          .select("id, parent_id, owner_id")
          .eq("id", current.parent_id);

        if (tenantId && tenantId !== "ALL") {
          qParent = qParent.eq("tenant_id", tenantId);
        }

        const { data: parent } = await qParent.single();
        if (!parent) break;
        current = parent;
        depth++;
      }
      rootId = current.id;
    }

    // 3. Fetch all documents for this owner to reconstruct potential chains
    // In a production app, we'd use a recursive CTE or a root_id column.
    // Here we fetch all docs for the owner and find those connected to the root.
    let vQuery = supabase
      .from("documents")
      .select("id, parent_id, owner_id, version, created_at")
      .eq("owner_id", currentDoc.owner_id as string); // TypeScript cast for safety

    if (tenantId && tenantId !== "ALL") {
      vQuery = vQuery.eq("tenant_id", tenantId);
    }

    const { data: allDocs, error: vError } = await vQuery.order("version", {
      ascending: false,
    });

    if (vError) throw new Error(mapDbError(vError));

    // 4. Filter documents that are part of this chain
    // A document is in the chain if:
    // - It is the root
    // - Its parent is in the chain
    const inChain = new Set<string>([rootId]);
    let added = true;
    while (added) {
      added = false;
      for (const d of allDocs || []) {
        if (d.parent_id && inChain.has(d.parent_id) && !inChain.has(d.id)) {
          inChain.add(d.id);
          added = true;
        }
      }
    }

    const versions = (allDocs || []).filter((d) => inChain.has(d.id));

    return { success: true, data: versions };
  } catch (error: unknown) {
    console.error("Document Action error:", error);
    return { success: false, message: mapDbError(error) };
  }
}

// 4. Delete Document
export async function deleteDocumentAction(id: string, storagePath: string) {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    const { data: doc, error: fetchDocErr } = await supabase
      .from("documents")
      .select("owner_id, owner_type")
      .eq("id", id)
      .single();

    if (fetchDocErr || !doc) {
      return { success: false, message: "ไม่พบเอกสารที่ต้องการลบ" };
    }

    const canBypass = role === "ADMIN" || role === "MANAGER";

    if (!canBypass) {
      if (doc.owner_type === "PROPERTY") {
        const { data: prop } = await supabase.from("properties_core").select("created_by, assigned_to").eq("id", doc.owner_id).single();
        const isOwner = prop && (prop.created_by === user.id || prop.assigned_to === user.id);
        if (!isOwner) {
          return { success: false, message: "คุณไม่มีสิทธิ์ลบเอกสารของทรัพย์สินผู้อื่น" };
        }
      } else if (doc.owner_type === "LEAD") {
        const { data: lead } = await supabase.from("leads").select("created_by, assigned_to").eq("id", doc.owner_id).single();
        const isOwner = lead && (lead.created_by === user.id || lead.assigned_to === user.id);
        if (!isOwner) {
          return { success: false, message: "คุณไม่มีสิทธิ์ลบเอกสารของลีดผู้อื่น" };
        }
      } else if (doc.owner_type === "DEAL" || doc.owner_type === "RENTAL_CONTRACT") {
        const { data: deal } = await supabase.from("crm_deals_v3").select("created_by, agent_id").eq("id", doc.owner_id).single();
        const isOwner = deal && (deal.created_by === user.id || deal.agent_id === user.id);
        if (!isOwner) {
          return { success: false, message: "คุณไม่มีสิทธิ์ลบเอกสารของดีล/สัญญาผู้อื่น" };
        }
      }
    }

    // 1. Delete from Storage
    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([storagePath]);

    if (storageError)
      console.error("Storage Delete Error (non-fatal):", storageError);

    const { error: dbError } = await (tenantId && tenantId !== "ALL"
      ? supabase
          .from("documents_v3")
          .delete()
          .eq("id", id)
          .eq("tenant_id", tenantId)
      : supabase.from("documents_v3").delete().eq("id", id));

    if (dbError) throw new Error(mapDbError(dbError));

    return { success: true };
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? mapDbError(error)
        : "เกิดข้อผิดพลาดในการลบเอกสาร";
    return { success: false, message: msg };
  }
}

/**
 * 5. Download Document Content (for in-app preview)
 */
export async function downloadDocumentAction(storagePath: string) {
  try {
    const { supabase, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    const { data: doc, error: docErr } = await (
      tenantId && tenantId !== "ALL"
        ? supabase
            .from("documents")
            .select("id")
            .eq("storage_path", storagePath)
            .eq("tenant_id", tenantId)
        : supabase
            .from("documents")
            .select("id")
            .eq("storage_path", storagePath)
    ).single();

    if (docErr || !doc)
      throw new Error("ไม่พบเอกสาร หรือคุณไม่มีสิทธิ์เข้าถึง");

    const { data, error } = await supabase.storage
      .from("documents")
      .download(storagePath);

    if (error) throw error;

    // Convert Blob to text
    const text = await data.text();
    return { success: true, data: text };
  } catch (error: unknown) {
    console.error("Download Document Error:", error);
    return { success: false, message: (error as Error).message };
  }
}
// 6. Search Owner records
export async function searchOwnerAction(
  type: DocumentOwnerType,
  query: string,
  tenantId?: string | null,
) {
  try {
    const { supabase, role } = await requireAuthContext();
    assertStaff(role);

    const q = query.trim();
    const isInitialFetch = !q;

    if (type === "LEAD") {
      let qry = supabase
        .from("crm_leads_v3")
        .select("id, identity:identities_v3!crm_leads_v3_identity_id_fkey(display_name, email)");

      if (!isInitialFetch) {
        qry = qry.or(`display_name.ilike.%${q}%,email.ilike.%${q}%`, { foreignTable: "identities_v3" });
      }

      if (tenantId && tenantId !== "ALL") {
        qry = qry.eq("tenant_id", tenantId);
      }

      const { data, error } = await qry
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []).map((l: any) => {
        const name = decrypt(l.identity?.display_name) || "Unknown Lead";
        const email = decrypt(l.identity?.email) || "N/A";
        return {
          id: l.id as string,
          label: `${name} (${email})`,
        };
      });
    } else if (type === "PROPERTY") {
      let qry = supabase
        .from("properties")
        .select("id, title")
        .is("deleted_at", null);

      if (!isInitialFetch) {
        qry = qry.ilike("title", `%${q}%`);
      }

      if (tenantId && tenantId !== "ALL") {
        qry = qry.eq("tenant_id", tenantId);
      }

      const { data, error } = await qry
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []).map((p) => ({
        id: p.id as string,
        label: p.title || "Unnamed Property",
      }));
    } else if (type === "DEAL") {
      let qry = supabase
        .from("crm_deals_v3")
        .select("id, lead:crm_leads_v3(identity:identities_v3(display_name)), property:properties(title)");

      if (tenantId && tenantId !== "ALL") {
        qry = qry.eq("tenant_id", tenantId);
      }

      const { data, error } = await qry
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;

      let results = (data || []).map((d: any) => {
        const leadName = decrypt(d.lead?.identity?.display_name) || "Unknown Lead";
        const propTitle = d.property?.title || "Unknown Property";
        return {
          id: d.id as string,
          label: `${leadName} - ${propTitle}`,
        };
      });

      if (q) {
        results = results.filter(r => r.label.toLowerCase().includes(q.toLowerCase()));
      }
      return results;
    } else if (type === "RENTAL_CONTRACT") {
      let qry = supabase
        .from("crm_deals_v3")
        .select("id, lead:crm_leads_v3(identity:identities_v3(display_name)), property:properties(title)")
        .eq("deal_type", "RENT");

      if (tenantId && tenantId !== "ALL") {
        qry = qry.eq("tenant_id", tenantId);
      }

      const { data, error } = await qry
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;

      let results = (data || []).map((d: any) => {
        const leadName = decrypt(d.lead?.identity?.display_name) || "Unknown Lead";
        const propTitle = d.property?.title || "Unknown Property";
        return {
          id: d.id as string,
          label: `สัญญาเช่า: ${leadName} - ${propTitle}`,
        };
      });

      if (q) {
        results = results.filter(r => r.label.toLowerCase().includes(q.toLowerCase()));
      }
      return results;
    }

    return [];
  } catch (err) {
    console.error("Search Owner Error:", err);
    return [];
  }
}

import { aiAnalysisSchema, ActionResponse, AIAnalysisResult } from "./schema";

/**
 * 7. Verify AI Analysis
 * Saves the AI analysis results after human confirmation.
 */
export async function verifyAiAnalysisAction(
  documentId: string,
  summary: string,
  analysis: AIAnalysisResult,
): Promise<ActionResponse> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    // Final Validation before save (Hardening)
    const validatedData = aiAnalysisSchema.parse({
      ...analysis,
      summary,
    });

    let updateQuery = supabase
      .from("documents_v3")
      .update({
        ai_summary: JSON.stringify(validatedData),
        ai_verified_status: "VERIFIED",
      })
      .eq("id", documentId);

    if (tenantId && tenantId !== "ALL") {
      updateQuery = updateQuery.eq("tenant_id", tenantId);
    }

    const { error } = await updateQuery;

    if (error) throw new Error(mapDbError(error));

    revalidatePath("/protected/documents");
    return { success: true };
  } catch (error: unknown) {
    console.error("Verify AI Analysis Error:", error);
    return {
      success: false,
      message: (error as Error).message || "เกิดข้อผิดพลาดในการยืนยันข้อมูล AI",
    };
  }
}
