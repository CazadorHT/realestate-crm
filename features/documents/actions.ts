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
  ownerType: DocumentOwnerType
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
    })
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

    const { data, error } = await supabase
      .from("documents")
      .insert({
        ...validated,
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
  bucket = "documents"
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
