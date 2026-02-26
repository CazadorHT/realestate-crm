"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import {
  createDocumentSchema,
  CreateDocumentInput,
  DocumentOwnerType,
} from "./schema";

// 1. Get Documents by Owner
export async function getDocumentsByOwner(
  ownerId: string,
  ownerType: DocumentOwnerType,
) {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("owner_type", ownerType)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch Documents Error:", error);
    return [];
  }

  return data;
}

export async function getAllDocuments(limit = 50) {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Fetch All Documents Error:", error);
    return [];
  }

  // Manually fetch owner data for each document
  const documentsWithOwners = await Promise.all(
    (data || []).map(async (doc: any) => {
      let ownerData = null;

      try {
        if (doc.owner_type === "PROPERTY") {
          const { data: property } = await supabase
            .from("properties")
            .select("id, title")
            .eq("id", doc.owner_id)
            .single();
          ownerData = { property };
        } else if (doc.owner_type === "LEAD") {
          const { data: lead } = await supabase
            .from("leads")
            .select("id, full_name, email")
            .eq("id", doc.owner_id)
            .single();
          ownerData = { lead };
        } else if (doc.owner_type === "DEAL") {
          const { data: deal } = await supabase
            .from("deals")
            .select("id, property:properties(title)")
            .eq("id", doc.owner_id)
            .single();
          ownerData = { deal };
        } else if (doc.owner_type === "RENTAL_CONTRACT") {
          const { data: contract } = await supabase
            .from("rental_contracts")
            .select("id, property:properties(title)")
            .eq("id", doc.owner_id)
            .single();
          ownerData = { rental_contract: contract };
        }
      } catch (err) {
        console.error(`Failed to fetch owner for document ${doc.id}:`, err);
      }

      return { ...doc, ...ownerData };
    }),
  );

  return documentsWithOwners;
}

// 2. Create Document Record (Metadata)
// Note: File upload happens on client (or via separate upload action), this records the metadata
export async function createDocumentRecordAction(input: CreateDocumentInput) {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    const validated = createDocumentSchema.parse(input);

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
      .from("documents")
      .insert({
        ...validated,
        version: finalVersion,
        created_by: user.id,
        is_encrypted: false, // Phase 3 item
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Revalidate paths based on owner type?
    // Hard to map exactly to URL, but usually we are on:
    // /protected/leads/[id], /protected/properties/[id]
    // We can rely on router.refresh() on client side.

    return { success: true, data };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "An error occurred";
    return { success: false, message: msg };
  }
}

// 3. Get Signed URL (for viewing)
export async function getDocumentSignedUrl(
  storagePath: string,
  bucket = "documents",
) {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  // Create a signed URL valid for 1 hour (3600 seconds)
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 3600);

  if (error) return null;
  return data.signedUrl;
}

/**
 * 4. Get Version History
 * Fetches all documents that share the same root ancestor.
 */
export async function getDocumentVersionsAction(documentId: string) {
  try {
    const { supabase, role } = await requireAuthContext();
    assertStaff(role);

    // 1. Get current document to find its parent_id and owner
    const { data: currentDoc, error: cError } = await supabase
      .from("documents")
      .select("id, parent_id, owner_id")
      .eq("id", documentId)
      .single();

    if (cError || !currentDoc) throw new Error("Document not found");

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
        const { data: parent } = await supabase
          .from("documents")
          .select("id, parent_id, owner_id")
          .eq("id", current.parent_id)
          .single();
        if (!parent) break;
        current = parent;
        depth++;
      }
      rootId = current.id;
    }

    // 3. Fetch all documents for this owner to reconstruct potential chains
    // In a production app, we'd use a recursive CTE or a root_id column.
    // Here we fetch all docs for the owner and find those connected to the root.
    const { data: allDocs, error: vError } = await supabase
      .from("documents")
      .select("*")
      .eq("owner_id", currentDoc.owner_id as string) // TypeScript cast for safety
      .order("version", { ascending: false });

    if (vError) throw new Error(vError.message);

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
    const msg = error instanceof Error ? error.message : "An error occurred";
    return { success: false, message: msg };
  }
}

// 4. Delete Document
export async function deleteDocumentAction(id: string, storagePath: string) {
  try {
    const { supabase, role } = await requireAuthContext();
    assertStaff(role);

    // 1. Delete from Storage
    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([storagePath]);

    if (storageError)
      console.error("Storage Delete Error (non-fatal):", storageError);

    // 2. Delete from DB
    const { error: dbError } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (dbError) throw new Error(dbError.message);

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "An error occurred";
    return { success: false, message: msg };
  }
}
