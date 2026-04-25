import { inngest } from "../client";
import { createAdminClient } from "../../supabase/admin";
import { logger } from "../../logger";

/**
 * 🛡️ Security Hardening: Background User Management (Phase 1)
 * This function performs sensitive Auth operations that require Service Role keys,
 * moving them out of the frontend Server Actions.
 */
export const handleUserDeletion = inngest.createFunction(
  { 
    id: "handle-user-deletion", 
    name: "Background User Deletion",
    triggers: [{ event: "user.delete.requested" }] 
  },
  async ({ event, step }) => {
    const { userId, adminId, reason } = event.data;
    const supabase = createAdminClient();

    // 1. Double check the user exists before deletion
    const profile = await step.run("verify-user-existence", async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("id", userId)
        .single();
      return data;
    });

    if (!profile) {
      logger.warn("Attempted to delete non-existent user", { userId, adminId });
      return { status: "skipped", message: "User not found" };
    }

    // 🕵️ SECURITY: Extra safeguard - never delete another ADMIN via background job
    if (profile.role === "ADMIN") {
        logger.error("CRITICAL: Background job attempted to delete an ADMIN account", { userId, adminId });
        throw new Error("Cannot delete ADMIN accounts via background job");
    }

    // 2. Perform Auth deletion (Service Role required)
    await step.run("delete-auth-user", async () => {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) {
        logger.error("Failed to delete user from Auth", error, { userId, adminId });
        throw error;
      }
    });

    // 3. Log the successful deletion (Audit Trail already logged in action, but we confirm here)
    logger.info(`User ${userId} (${profile.email}) successfully deleted by Admin ${adminId}`, { 
        reason: reason || "Manual deletion" 
    });

    return { status: "deleted", userId, email: profile.email };
  }
);
