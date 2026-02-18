"use server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Increments the view count for a specific property.
 * This is called from the client-side to track actual user visits.
 */
export async function incrementPropertyView(propertyId: string) {
  if (!propertyId) return;

  const supabase = createAdminClient();

  try {
    // We use rpc for atomic increment if available,
    // but a simple select + update is fine for this scale
    // since we use admin client to bypass RLS for this specific update.

    const { data: current, error: fetchError } = await supabase
      .from("properties")
      .select("view_count")
      .eq("id", propertyId)
      .single();

    if (fetchError) throw fetchError;

    const newCount = (current?.view_count || 0) + 1;

    const { error: updateError } = await supabase
      .from("properties")
      .update({ view_count: newCount })
      .eq("id", propertyId);

    if (updateError) throw updateError;

    return { success: true, count: newCount };
  } catch (error) {
    console.error("Error incrementing property view:", error);
    return { success: false };
  }
}

/**
 * Resets view count for ALL properties to 0.
 * Restricted to admins via RLS or by being a server action.
 * Using Admin client to ensure it can override existing values.
 */
export async function resetAllPropertyViews() {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .from("properties")
      .update({ view_count: 0 })
      .neq("view_count", 0); // Only update those with views > 0 for efficiency

    if (error) throw error;

    return { success: true, message: "All property views have been reset." };
  } catch (error) {
    console.error("Error resetting property views:", error);
    return { success: false, message: "Failed to reset views" };
  }
}
