"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Json } from "@/lib/database.types";

export async function logActivityAction(
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Json,
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return; // Only log for authenticated users

    const adminClient = createAdminClient();
    await adminClient.from("audit_logs").insert({
      user_id: user.id,
      action,
      entity,
      entity_id: entityId || null,
      metadata: (metadata || {}) as Json,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
