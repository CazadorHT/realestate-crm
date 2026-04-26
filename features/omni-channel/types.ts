export interface OmniMessagePayload {
  field?: "comments" | string;
  type?: "comment" | string;
  comment_reply?: boolean;
  parent_id?: string | null;
  pictureUrl?: string | null;
  profile?: {
    pictureUrl?: string | null;
    name?: string | null;
  };
  [key: string]: unknown;
}

export interface OmniMessage {
  id: string;
  lead_id?: string | null;
  tenant_id?: string | null;
  content: string | null;
  direction: "INCOMING" | "OUTGOING" | string | null;
  source?: string | null;
  external_message_id?: string | null;
  is_read: boolean | null;
  payload: OmniMessagePayload | null;
  created_at: string | null;
  updated_at?: string;
}

export interface Conversation {
  id: string;
  full_name: string;
  source: string | null;
  tenant_id: string | null;
  note: string | null;
  omni_messages: OmniMessage[];
  preferences: {
    category?: "CUSTOMER" | "AGENT" | "OWNER";
  } | Record<string, unknown>;
  tenants?: {
    id: string;
    name: string;
  } | null;
}
