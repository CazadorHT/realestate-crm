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

export const propertyCreatedEvent = eventType("property.created", {
  schema: staticSchema<{
    propertyId: string;
    userId: string;
    tenantId?: string;
  }>(),
});

export const userDeleteRequestedEvent = eventType("user.delete.requested", {
  schema: staticSchema<{
    userId: string;
    adminId: string;
    reason?: string;
  }>(),
});

export const storageCleanupRequestedEvent = eventType("storage.cleanup.requested", {
  schema: staticSchema<{
    bucket: string;
    paths: string[];
  }>(),
});

export const blogGenerateRequestedEvent = eventType("blog.generate.requested", {
  schema: staticSchema<{
    taskId: string;
    keyword: string;
    targetAudience: string;
    tone: string;
    length: string;
    imageStyle: string;
    authorId: string;
    tenantId: string | null;
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
    "property.created": propertyCreatedEvent,
    "user.delete.requested": userDeleteRequestedEvent,
    "storage.cleanup.requested": storageCleanupRequestedEvent,
    "blog.generate.requested": blogGenerateRequestedEvent,
  }
});
