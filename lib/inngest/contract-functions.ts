import { inngest } from "./client";
import { createAdminClient } from "../supabase/admin";
import { formatContractExpiryNotification } from "../telegram-formatters";
import { sendAdminNotification } from "../telegram";

/**
 * ⏰ S-Tier Cron: Daily Contract Expiry Check
 * Runs every day at 08:00 AM (ICT) to find contracts expiring in 30, 14, 7, and 1 days.
 */
export const dailyContractExpiryCheck = inngest.createFunction(
  { 
    id: "daily-contract-expiry-check", 
    name: "Contract Expiry Watchdog",
    // Cron schedule: 01:00 UTC = 08:00 ICT
    triggers: [{ cron: "0 1 * * *" }]
  },
  async ({ step }) => {
    const supabase = createAdminClient();

    // 🕵️ Step 1: Find contracts expiring in defined milestones
    const expiringContracts = await step.run("fetch-expiring-contracts", async () => {
      const now = new Date();
      const milestones = [30, 14, 7, 1];
      
      const targetDates = milestones.map(days => {
        const d = new Date(now);
        d.setDate(d.getDate() + days);
        return d.toISOString().split("T")[0];
      });

      const { data, error } = await supabase
        .from("rental_contracts")
        .select(`
          id,
          end_date,
          status,
          deals (
            id,
            properties (title),
            leads (
              full_name,
              assigned_to,
              agent:profiles!assigned_to (telegram_id)
            )
          )
        `)
        .in("end_date", targetDates)
        .eq("status", "ACTIVE");

      if (error) throw error;
      return data || [];
    });

    // 📢 Step 2: Send notifications (Parallel execution for speed)
    const notifications = await step.run("send-expiry-notifications", async () => {
      let sentCount = 0;
      const now = new Date();

      for (const contract of expiringContracts) {
        const endDate = new Date(contract.end_date);
        const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Extract joined data safely with proper typing
        const deal = Array.isArray(contract.deals) ? contract.deals[0] : contract.deals;
        const propertyName = (deal as any)?.properties?.title || "Unknown Property";
        const customerName = (deal as any)?.leads?.full_name || "Unknown Customer";
        const agentTgId = (deal as any)?.leads?.agent?.telegram_id;

        const message = formatContractExpiryNotification({
          contractId: contract.id,
          propertyName: propertyName as string,
          customerName: customerName as string,
          endDate: contract.end_date,
          daysRemaining: diffDays,
        });

        // Send to specific Agent (Private)
        if (agentTgId) {
          await sendAdminNotification(message, { chatId: agentTgId });
          sentCount++;
        }

        // Standard Practice: If very urgent (<= 7 days), also notify Admin Group
        if (diffDays <= 7) {
          await sendAdminNotification(`⏰ <b>[URGENT]</b> ${message}`);
        }
      }

      return { sentCount };
    });

    return { 
      processed: expiringContracts.length, 
      notificationsSent: notifications.sentCount 
    };
  }
);
