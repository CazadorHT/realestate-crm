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

// 🔥 Create Inngest Client
export const inngest = new Inngest({ 
  id: "real-estate-crm" 
});
