"use server";
import { createClient } from "@/lib/supabase/server";

/**
 * Increments the view count for a specific property.
 * This is called from the client-side to track actual user visits.
 */
export async function incrementPropertyView(propertyId: string) {
  if (!propertyId) return;

  const supabase = await createClient();

  try {
    // 🛡️ [PHASE 1] Use Security Definer RPC for atomic increment
    // This allows public users to increment without having UPDATE permission on the table.
    const { data: newCount, error } = await supabase.rpc("increment_property_view", {
      p_id: propertyId
    });

    if (error) throw error;

    return { success: true, count: newCount };
  } catch (error) {
    console.error("Error incrementing property view:", error);
    return { success: false };
  }
}

/**
 * Resets view count for ALL properties to 0.
 * Restricted to admins via RPC check.
 */
export async function resetAllPropertyViews() {
  const supabase = await createClient();

  try {
    // 🛡️ [PHASE 1] Use Security Definer RPC for admin-only reset
    const { error } = await supabase.rpc("reset_all_property_views");

    if (error) throw error;

    return { success: true, message: "All property views have been reset." };
  } catch (error) {
    console.error("Error resetting property views:", error);
    return { success: false, message: "Failed to reset views" };
  }
}
