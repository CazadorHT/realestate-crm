import { inngest } from "../client";
import { createAdminClient } from "../../supabase/admin";
import { logger } from "../../logger";

/**
 * 🛡️ Security Hardening: Background Storage Cleanup (Phase 1)
 * This function handles bulk deletion of files from Supabase Storage buckets
 * without requiring the main application actions to have service role access.
 */
export const handleStorageCleanup = inngest.createFunction(
  { 
    id: "handle-storage-cleanup", 
    name: "Background Storage Cleanup",
    triggers: [{ event: "storage.cleanup.requested" }] 
  },
  async ({ event, step }) => {
    const { bucket, paths } = event.data;
    
    if (!paths || paths.length === 0) return { status: "skipped", message: "No paths provided" };

    const supabase = createAdminClient();

    // 📦 Perform deletion in chunks to avoid timeout or payload limits if necessary
    // Supabase storage .remove() handles multiple paths at once.
    const result = await step.run("delete-storage-files", async () => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove(paths);
      
      if (error) {
        logger.error(`Failed to cleanup storage in bucket ${bucket}`, error, { paths });
        throw error;
      }
      return data;
    });

    logger.info(`Successfully cleaned up ${paths.length} files from bucket: ${bucket}`, { 
        count: result?.length 
    });

    return { status: "completed", deletedCount: result?.length, bucket };
  }
);
