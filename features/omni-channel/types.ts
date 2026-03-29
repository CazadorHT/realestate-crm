export interface OmniMessage {
  id: string;
  lead_id?: string | null;
  tenant_id?: string | null;
  content: string | null;
  direction: "INCOMING" | "OUTGOING" | string | null;
  source?: string | null;
  external_message_id?: string | null;
  is_read: boolean | null;
  payload: any;
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
  tenants?: {
    id: string;
    name: string;
  } | null;
}
