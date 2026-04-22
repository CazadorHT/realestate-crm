import { eventType, Inngest, staticSchema } from "inngest";

/**
 * 🎫 S-Tier Event Definitions (v4 Compatible)
 */
export const leadCreatedEvent = eventType("lead.created", {
  schema: staticSchema<{
    leadId: string;
    tenantId?: string;
  }>(),
});

export const authLoginEvent = eventType("auth.login", {
  schema: staticSchema<{
    userId: string;
    email: string;
    role: string;
    metadata?: {
      userAgent?: string;
      location?: string;
      [key: string]: any;
    };
  }>(),
});

export const financeCommissionPaidEvent = eventType("finance.commission_paid", {
  schema: staticSchema<{
    commissionId: string;
    agentName: string;
    amount: number;
    taxAmount: number;
    netAmount: number;
    dealId: string;
    reference: string;
    paidAt: string;
    idempotencyKey?: string;
    lineUserId?: string | null;
    telegramId?: string | null;
  }>(),
});

export const propertyProactiveTriggerEvent = eventType("property.proactive_trigger", {
  schema: staticSchema<{
    propertyId: string;
    visitorId: string;
    userId?: string | null;
    tenantId?: string;
  }>(),
});

// 🔥 Create Inngest Client
export const inngest = new Inngest({ 
  id: "real-estate-crm",
  schemas: {
    "lead.created": leadCreatedEvent,
    "auth.login": authLoginEvent,
    "finance.commission_paid": financeCommissionPaidEvent,
    "property.proactive_trigger": propertyProactiveTriggerEvent,
  }
});
