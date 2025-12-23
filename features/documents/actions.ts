"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertAuthenticated } from "@/lib/authz";
import {
  createDocumentSchema,
  CreateDocumentInput,
  DocumentOwnerType,
} from "./schema";
import { revalidatePath } from "next/cache";

// 1. Get Documents by Owner
export async function getDocumentsByOwner(
  ownerId: string,
  ownerType: DocumentOwnerType
) {
  const supabase = await createClient();

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

// 2. Create Document Record (Metadata)
// Note: File upload happens on client (or via separate upload action), this records the metadata
export async function createDocumentRecordAction(input: CreateDocumentInput) {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertAuthenticated({ userId: user.id, role });

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
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 3. Get Signed URL (for viewing)
export async function getDocumentSignedUrl(
  storagePath: string,
  bucket = "documents"
) {
  const supabase = await createClient();

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
    const { supabase, user, role } = await requireAuthContext();
    assertAuthenticated({ userId: user.id, role });

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
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
