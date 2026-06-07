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
        .from("crm_deals_v3")
        .select(`
          id,
          transaction_end_date,
          status,
          properties (
            title
          ),
          leads (
            full_name,
            assigned_to
          )
        `)
        .in("transaction_end_date", targetDates)
        .eq("status", "WON")
        .eq("deal_type", "RENT");

      if (error) throw error;
      return data || [];
    });

    // 📢 Step 2: Send notifications (Parallel execution for speed)
    const notifications = await step.run("send-expiry-notifications", async () => {
      let sentCount = 0;
      const now = new Date();

      // Fetch telegram IDs for agents
      const agentIds = expiringContracts
        .map((c: any) => c.leads?.assigned_to)
        .filter(Boolean) as string[];

      const telegramMap: Record<string, string> = {};
      if (agentIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, telegram_id")
          .in("id", agentIds)
          .not("telegram_id", "is", null);
        
        if (profiles) {
          for (const p of profiles) {
            if (p.telegram_id) {
              telegramMap[p.id] = p.telegram_id;
            }
          }
        }
      }

      for (const contract of expiringContracts) {
        if (!contract.transaction_end_date) continue;
        const endDate = new Date(contract.transaction_end_date);
        const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Extract joined data safely with proper typing
        type JoinedDeal = {
          properties: { title: string } | null;
          leads: { 
            full_name: string | null; 
            assigned_to: string | null;
          } | null;
        };

        const deal = contract as unknown as JoinedDeal | null;
        const propertyName = deal?.properties?.title || "Unknown Property";
        const customerName = deal?.leads?.full_name || "Unknown Customer";
        const agentTgId = deal?.leads?.assigned_to ? telegramMap[deal.leads.assigned_to] : undefined;

        const message = formatContractExpiryNotification({
          contractId: contract.id,
          propertyName,
          customerName,
          endDate: contract.transaction_end_date,
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
