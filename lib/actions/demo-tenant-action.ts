"use server";

import { createSafeAction } from "./safe-action";
import { z } from "zod";

/**
 * Example Schema for creating a property with tenant awareness
 */
const CreatePropertySchema = z.object({
  tenantId: z.string().uuid(),
  title: z.string().min(3, "ชื่อทรัพย์สินสั้นเกินไป"),
  price: z.number().positive("ราคาต้องมากกว่า 0"),
});

/**
 * Example Safe Action
 */
export const createPropertySafe = createSafeAction(
  CreatePropertySchema,
  async (data, { supabase, userId, tenantId }) => {
    // tenantId is automatically validated by createSafeAction before this handler runs

    // 1. Insert into properties_core
    const { data: core, error: coreError } = await supabase
      .from("properties_core")
      .insert({
        tenant_id: tenantId,
        status: 0, // DRAFT
        listing_type: 0, // SALE
        property_type: 1, // CONDO
        sale_price: data.price,
        created_by: userId,
      })
      .select("id")
      .single();

    if (coreError || !core) throw new Error(coreError?.message || "Failed to insert property core");

    // 2. Insert into properties_details
    const { error: detailsError } = await supabase
      .from("properties_details")
      .insert({
        property_id: core.id!,
        title: { th: data.title, en: data.title, cn: data.title, ru: data.title },
        description: { th: "", en: "", cn: "", ru: "" },
      });

    if (detailsError) {
      // rollback properties_core
      await supabase.from("properties_core").delete().eq("id", core.id);
      throw new Error(detailsError.message);
    }

    return {
      id: core.id,
      title: data.title,
      price: data.price,
    };
  },
);
