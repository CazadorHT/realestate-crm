"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Realtime Doctor - Server-side diagnostic for database-level issues
 * Checks RLS, Auth, and basic table visibility.
 */
export async function runRealtimeDiagnostic() {
  const supabase = await createClient();
  
  const results = {
    auth: { status: "UNKNOWN", userId: null as string | null },
    notifications_table: { status: "UNKNOWN", can_select: false, error: null as any },
    publication: { status: "UNKNOWN", hint: "Check Supabase Dashboard > Database > Publications" }
  };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      results.auth.status = "AUTHENTICATED";
      results.auth.userId = user.id;
    } else {
      results.auth.status = "ANONYMOUS";
    }
  } catch (e) {
    results.auth.status = "ERROR";
  }

  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("id")
      .limit(1);
    
    if (error) {
      results.notifications_table.status = "FAILED";
      results.notifications_table.error = error.message;
    } else {
      results.notifications_table.status = "OK";
      results.notifications_table.can_select = true;
    }
  } catch (e) {
    results.notifications_table.status = "CRASHED";
  }

  return results;
}
