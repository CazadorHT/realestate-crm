import { RentNotificationRuleInput } from "./schema";

export interface LINEGroup {
  group_id: string;
  group_name: string | null;
  picture_url: string | null;
}

export interface SimpleProperty {
  id: string;
  title: string;
  image: string | null;
}

export interface RentNotificationRule extends Omit<RentNotificationRuleInput, "is_active" | "language" | "notification_hour"> {
  id: string;
  notification_day: number;
  notification_hour: number | null;
  is_active: boolean | null;
  language: string | null;
  last_sent_at: string | null;
  properties?: {
    id: string;
    title: string;
    property_images?: { image_url: string }[];
    deals?: {
      rental_contracts?: {
        end_date: string | null;
      }[];
    }[];
  };
  line_groups?: LINEGroup | LINEGroup[] | null;
  tenants?: {
    name: string;
  } | null;
}
