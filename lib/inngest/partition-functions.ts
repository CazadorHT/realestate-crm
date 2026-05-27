import { inngest } from "./client";
import { createAdminClient } from "../supabase/admin";

/**
 * ⏰ weekly-db-partition-maintenance
 * Runs every Sunday at 03:00 AM (ICT) to call auto_create_partitions_v3()
 * which automatically creates partitions for current and next month/quarter.
 */
export const weeklyPartitionMaintenance = inngest.createFunction(
  { 
    id: "weekly-db-partition-maintenance", 
    name: "Database Partition Maintenance",
    // Cron schedule: 20:00 UTC Saturday = 03:00 AM Sunday ICT
    triggers: [{ cron: "0 20 * * 6" }]
  },
  async ({ step }) => {
    const supabase = createAdminClient();

    const result = await step.run("execute-partition-maintenance", async () => {
      const { data, error } = await supabase.rpc("auto_create_partitions_v3");
      
      if (error) {
        throw new Error(`Failed to execute partition maintenance: ${error.message}`);
      }

      return { success: true };
    });

    return result;
  }
);
