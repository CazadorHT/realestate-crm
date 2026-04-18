import { inngest } from "./client";
import { performAccountingSync } from "@/features/finance/services/accounting-sync";

/**
 * 💰 Background Worker: Sync Commission Payment to Accounting Software
 * Triggers when a commission is marked as PAID.
 */
export const syncCommissionPayment = inngest.createFunction(
  { 
    id: "sync-commission-payment", 
    name: "Accounting Sync (PEAK/FlowAccount)", 
    triggers: [{ event: "finance.commission_paid" }]
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { 
      commissionId, 
      agentName, 
      amount, 
      taxAmount, 
      netAmount, 
      dealId, 
      reference, 
      paidAt 
    } = event.data;

    // 🔄 Step 1: Perform the external sync (PEAK Account)
    const syncResult = await step.run("external-accounting-sync", async () => {
      return await performAccountingSync({
        agentName,
        amount,
        taxAmount,
        netAmount,
        dealId,
        reference,
        paidAt,
        idempotencyKey: event.data.idempotencyKey
      });
    });

    // 📱 Step 2: Send LINE Notification (If agent has linked ID)
    if (event.data.lineUserId) {
      await step.run("send-line-notification", async () => {
        const { sendLineNotification } = await import("@/lib/line");
        
        // Build a professional Flex Message
        const flexMessage = {
          type: "flex",
          altText: "💰 แจ้งโอนเงินคอมมิชชันสำเร็จ",
          contents: {
            type: "bubble",
            styles: { header: { backgroundColor: "#0f172a" }, footer: { separator: true } },
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "PAYOUT SUCCESSFUL", weight: "bold", color: "#10b981", size: "sm" },
                { type: "text", text: `฿${netAmount.toLocaleString()}`, weight: "bold", color: "#ffffff", size: "xxl", margin: "md" }
              ]
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "ยินดีด้วยครับ! รายได้ของคุณถูกโอนเข้าบัญชีแล้ว", size: "xs", color: "#64748b", wrap: true },
                {
                  type: "box", layout: "vertical", margin: "lg", spacing: "sm",
                  contents: [
                    {
                      type: "box", layout: "baseline", spacing: "sm",
                      contents: [
                        { type: "text", text: "เลขอ้างอิง", color: "#94a3b8", size: "xs", flex: 2 },
                        { type: "text", text: reference, wrap: true, color: "#1e293b", size: "xs", flex: 4, weight: "bold" }
                      ]
                    },
                    {
                      type: "box", layout: "baseline", spacing: "sm",
                      contents: [
                        { type: "text", text: "เอเยนต์", color: "#94a3b8", size: "xs", flex: 2 },
                        { type: "text", text: agentName, wrap: true, color: "#1e293b", size: "xs", flex: 4 }
                      ]
                    }
                  ]
                }
              ]
            },
            footer: {
              type: "box", layout: "vertical", spacing: "sm",
              contents: [
                {
                  type: "button", style: "link", height: "sm",
                  action: { type: "uri", label: "ดูสลิปและใบ 50 ทวิ", uri: `https://${process.env.NEXT_PUBLIC_SITE_URL}/protected/wallet` }
                }
              ]
            }
          }
        };

        return await sendLineNotification(flexMessage as any);
      });
    }

    return { 
      message: `Commission ${commissionId} synced to ${syncResult.provider}`,
      externalId: syncResult.externalId,
      lineSent: !!event.data.lineUserId
    };
  }
);
