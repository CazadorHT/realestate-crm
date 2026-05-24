"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { mapDbError } from "@/lib/db-error";
import { updateDealAction } from "@/features/deals/actions";

/**
 * E-Signature Statuses
 */
export type ESignStatus = "DRAFT" | "SENT" | "SIGNED" | "DECLINED" | "EXPIRED";

// Input Validation Schema
const markAsSignedSchema = z.object({
  documentId: z.string().uuid("ID เอกสารไม่ถูกต้อง"),
});

/**
 * Manually mark a document as signed (Simple mode)
 * This is used when the signature is collected manually or outside the automated system.
 * Now integrated: If the document is a contract related to a DEAL, it updates the deal to CLOSED_WIN.
 */
export async function markAsSignedAction(documentId: string) {
  try {
    const { supabase, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    // 1. Validate Input
    const validated = markAsSignedSchema.parse({ documentId });

    // 2. Fetch document metadata to check owner and type
    let fetchQuery = supabase
      .from("documents")
      .select("id, owner_id, owner_type, document_type, esign_status")
      .eq("id", validated.documentId);

    if (tenantId && tenantId !== "ALL") {
      fetchQuery = fetchQuery.eq("tenant_id", tenantId);
    }

    const { data: doc, error: fetchErr } = await fetchQuery.single();

    if (fetchErr) throw new Error(mapDbError(fetchErr));
    if (!doc) throw new Error("หาเอกสารไม่พบ");

    // 3. Prevent redundant marking
    if (doc.esign_status === "SIGNED") {
      return { success: true, status: "SIGNED" as const };
    }

    // 4. Update document status
    let updateQuery = supabase
      .from("documents_v3")
      .update({
        esign_status: "SIGNED",
        esign_signed_at: new Date().toISOString(),
      })
      .eq("id", validated.documentId);

    if (tenantId && tenantId !== "ALL") {
      updateQuery = updateQuery.eq("tenant_id", tenantId);
    }

    const { error: updateErr } = await updateQuery;

    if (updateErr) throw new Error(mapDbError(updateErr));

    let warning: string | undefined;

    // 5. Automation: If it's a LEASE_CONTRACT/SALE_CONTRACT for a DEAL, mark deal as WON
    if (
      doc.owner_type === "DEAL" &&
      (doc.document_type === "LEASE_CONTRACT" ||
        doc.document_type === "SALE_CONTRACT")
    ) {
      try {
        const dealRes = await updateDealAction({
          id: doc.owner_id,
          status: "CLOSED_WIN",
        });

        if (!dealRes.success) {
          warning = `บันทึกการเซ็นสำเร็จ แต่ไม่สามารถอัปเดตสถานะดีลได้โดยอัตโนมัติ: ${dealRes.message}`;
        }
      } catch (dealErr) {
        console.error("Deal Auto-update unexpected error:", dealErr);
        warning = "บันทึกการเซ็นสำเร็จ แต่เกิดข้อผิดพลาดในการอัปเดตสถานะดีล";
      }
    }

    revalidatePath("/protected/documents");
    revalidatePath("/protected/deals");
    if (doc.owner_type === "DEAL") {
      revalidatePath(`/protected/deals/${doc.owner_id}`);
    }

    return { success: true, status: "SIGNED" as const, warning };
  } catch (error: unknown) {
    console.error("Manual Sign Error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.issues[0].message };
    }
    const msg =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึก";
    return { success: false, message: msg };
  }
}
