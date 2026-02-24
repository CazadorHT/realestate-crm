export type MetaPlatform = "FACEBOOK" | "INSTAGRAM" | "WHATSAPP";

export interface MetaUserProfile {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  profile_pic?: string;
  username?: string; // for Instagram
}

export interface MetaApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  mock?: boolean;
}

// --- Webhook Types ---

export interface MetaWebhookBody {
  object: "page" | "instagram" | "whatsapp_business_account";
  entry: MetaWebhookEntry[];
}

export interface MetaWebhookEntry {
  id: string;
  time: number;
  messaging?: MetaMessagingEvent[];
  changes?: MetaChangeEvent[];
}

export interface MetaMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean;
    attachments?: any[];
  };
  postback?: {
    title: string;
    payload: string;
  };
}

export interface MetaChangeEvent {
  field: "feed" | "comments" | "mentions" | "leadgen" | "messages" | "ratings";
  value: any; // Complex union depending on field
}

export interface FacebookFeedValue {
  item: "comment" | "post" | "status" | "photo";
  verb: "add" | "edited" | "deleted" | "remove";
  message?: string;
  from?: { id: string; name: string };
  comment_id?: string;
  post_id?: string;
  parent_id?: string;
  created_time?: number;
}

export interface InstagramCommentValue {
  id: string;
  text: string;
  from: { id: string; username: string };
  media: { id: string; media_product_type: string };
}

export interface LeadgenValue {
  leadgen_id: string;
  form_id: string;
  page_id: string;
  adgroup_id?: string;
  ad_id?: string;
  created_time: number;
}
