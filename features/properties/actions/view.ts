"use server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Increment property view count
 * Publicly accessible action (no auth required)
 */
export async function incrementPropertyView(propertyId: string) {
  const supabase = createAdminClient();

  // Call the secure database function
  const { error } = await supabase.rpc("increment_property_view", {
    property_id: propertyId,
  });

  if (error) {
    console.error("Error incrementing view count:", error);
  }
}
