"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type NotificationType =
  | "LEAD_TRANSFER"
  | "BRANCH_INVITE"
  | "SYSTEM"
  | "INFO"
  | "WARNING";

export async function createNotificationAction({
  userId,
  tenantId,
  type,
  title,
  message,
  link,
}: {
  userId: string;
  tenantId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    tenant_id: tenantId,
    type,
    title,
    message,
    link,
  });

  if (error) {
    console.error("Error creating notification:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getNotificationsAction(tenantId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id);

  // If tenantId is provided, filter by it OR get global notifications (where tenant_id is null)
  // This allows seeing both branch-specific alerts and personal/system alerts.
  if (tenantId) {
    query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return data;
}

export async function markNotificationAsReadAction(notificationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error marking notification as read:", error);
    return { success: false };
  }

  revalidatePath("/");
  return { success: true };
}

export async function markAllNotificationsAsReadAction(tenantId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false };

  let query = supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { error } = await query;

  if (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false };
  }

  revalidatePath("/");
  return { success: true };
}

export async function markNotificationsAsReadAction(notificationIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .in("id", notificationIds)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error marking notifications as read:", error);
    return { success: false };
  }

  revalidatePath("/");
  return { success: true };
}

export async function deleteNotificationAction(notificationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false };

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting notification:", error);
    return { success: false };
  }

  revalidatePath("/");
  return { success: true };
}

export async function deleteNotificationsAction(notificationIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false };

  const { error } = await supabase
    .from("notifications")
    .delete()
    .in("id", notificationIds)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting notifications:", error);
    return { success: false };
  }

  revalidatePath("/");
  return { success: true };
}
export async function deleteAllNotificationsAction(tenantId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false };

  let query = supabase
    .from("notifications")
    .delete()
    .eq("user_id", user.id);

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { error } = await query;

  if (error) {
    console.error("Error deleting all notifications:", error);
    return { success: false };
  }

  revalidatePath("/");
  return { success: true };
}
