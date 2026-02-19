// ============================================================
// Active LINE Webhook Route
// URL: /api/webhook/line
// ============================================================
// This is the ACTIVE webhook endpoint configured in LINE Console.
// It re-exports the handler from app/api/line-webhook/route.ts
// to avoid code duplication.
// ============================================================

export { POST } from "@/app/api/line-webhook/route";
