"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendAdminNotification } from "@/lib/telegram";
import { sendLineNotification } from "@/lib/line";

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

  const { error } = await supabase.from("notifications_v3").insert({
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
    .from("notifications_v3")
    .select("id, user_id, tenant_id, type, title, message, link, is_read, created_at")
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
    .from("notifications_v3")
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
    .from("notifications_v3")
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
    .from("notifications_v3")
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
    .from("notifications_v3")
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
    .from("notifications_v3")
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
    .from("notifications_v3")
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

export async function notifyAdminsAction({
  type,
  title,
  message,
  link,
}: {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  const supabase = await createClient();

  // 1. Get all ADMIN users with their notification preferences
  // Future-proof: We can later join with a notification_settings table
  const { data: admins, error: fetchError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "ADMIN");

  if (fetchError || !admins) {
    console.error("Error fetching admins for notification:", fetchError);
    return { success: false };
  }

  // 2. Filter admins based on their future preferences (Placeholder for now)
  const targetAdmins = admins;

  // --- FUTURE PROOF: RATE LIMITING ---
  // To prevent spamming (e.g. rapid login failures), we check if a similar 
  // notification was sent recently. 
  // For now, we'll implement a simple server-side throttle check if needed.
  // ------------------------------------

  // 3. Create notification for each targeted admin using bulk insert
  const notifications = (targetAdmins as { id: string }[]).map((admin) => ({
    user_id: admin.id,
    type,
    title,
    message,
    link,
    // Add metadata for potential debugging or grouping
    metadata: {
      generated_at: new Date().toISOString(),
      bulk: targetAdmins.length > 5,
      version: "2.0", // Tracking version for future migrations
    } as Record<string, unknown>,
  }));

  if (notifications.length === 0) return { success: true };

  const { error: insertError } = await supabase
    .from("notifications_v3")
    .insert(notifications);

  if (insertError) {
    console.error("Error sending notifications to admins:", insertError);
    return { success: false };
  }

  // 4. Send External Notifications (Line & Telegram)
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    const detailLink = link ? `${siteUrl}${link}` : "";
    const htmlMessage = `🔔 <b>${title}</b>\n━━━━━━━━━━━━━━━━━━\n\n${message}${detailLink ? `\n\n🔗 <a href="${detailLink}">ดูรายละเอียดในระบบ CRM</a>` : ""}`;
    const plainTextForLine = `🔔 ${title}\n\n${message}${detailLink ? `\n\nดูรายละเอียดในระบบ CRM: ${detailLink}` : ""}`;

    // Fire-and-forget background notification tasks
    // Using Promise.allSettled to ensure failure of one doesn't crash the other
    Promise.allSettled([
      sendAdminNotification(htmlMessage),
      sendLineNotification(plainTextForLine)
    ]).catch(err => {
      console.error("Error triggering external admin notifications:", err);
    });
  } catch (externalErr) {
    console.error("External notification payload error:", externalErr);
  }

  return { success: true };
}
