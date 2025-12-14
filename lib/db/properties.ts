import { createClient } from "@/lib/supabase/server";
import { Property } from "@/lib/types/property";
/**
 * Fetch all properties from the database.
 * Returns an empty array if an error occurs (and logs the error).
 */
export async function getAllProperties(): Promise<Property[]> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching properties:", error);
      return [];
    }

    return (data as unknown as Property[]) || [];
  } catch (err) {
    console.error("Unexpected error in getAllProperties:", err);
    return [];
  }
}
