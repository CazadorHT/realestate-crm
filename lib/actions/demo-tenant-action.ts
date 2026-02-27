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

    const { data: property, error } = await supabase
      .from("properties")
      .insert({
        title: data.title,
        price: data.price,
        tenant_id: tenantId, // Explicitly tagging the data with the tenant
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return property;
  },
);
