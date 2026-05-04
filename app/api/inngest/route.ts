import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { processPropertyCreated, scanPropertyImage } from "@/lib/inngest/functions";
import { syncCommissionPayment } from "@/lib/inngest/finance-functions";
import { dailyContractExpiryCheck } from "@/lib/inngest/contract-functions";
import { onLeadCreated, onUserLogin } from "@/lib/inngest/intelligence-functions";
import { onBlogGenerateRequested } from "@/lib/inngest/functions/blog-functions";

// ✅ Export the Inngest API route handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processPropertyCreated,
    scanPropertyImage,
    syncCommissionPayment,
    dailyContractExpiryCheck,
    onLeadCreated,
    onUserLogin,
    onBlogGenerateRequested,
  ],
});
