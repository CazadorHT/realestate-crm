import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { processPropertyCreated } from "@/lib/inngest/functions";
import { syncCommissionPayment } from "@/lib/inngest/finance-functions";

// ✅ Export the Inngest API route handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processPropertyCreated,
    syncCommissionPayment,
  ],
});
