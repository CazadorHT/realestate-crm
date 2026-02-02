"use server";

import { getRecentNotifications, Notification } from "./queries";

export async function refreshNotificationsAction(): Promise<Notification[]> {
  try {
    const notifications = await getRecentNotifications();
    return notifications;
  } catch (error) {
    console.error("Failed to refresh notifications:", error);
    return [];
  }
}
