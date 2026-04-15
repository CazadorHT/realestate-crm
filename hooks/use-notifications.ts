"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
  deleteAllNotificationsAction,
  markNotificationsAsReadAction,
  deleteNotificationsAction,
} from "@/lib/actions/notifications";
import { toast } from "sonner";
import { Database } from "@/lib/database.types";
import { differenceInMinutes } from "date-fns";
import { useTenant } from "@/components/providers/TenantProvider";
import { useRealtime } from "@/components/providers/RealtimeProvider";

export type DBNotification =
  Database["public"]["Tables"]["notifications"]["Row"];

export interface GroupedNotification extends DBNotification {
  notifications: DBNotification[];
  isGroup?: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();
  const { subscribe, status } = useRealtime();
  const { activeTenant } = useTenant();
  const tenantId = activeTenant?.id === "ALL" ? undefined : activeTenant?.id;
  const lastStatusRef = useRef(status);

  const fetchNotifications = async () => {
    try {
      const data = await getNotificationsAction(tenantId);
      setNotifications(data as DBNotification[]);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("ไม่สามารถโหลดการแจ้งเตือนได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, [supabase]);

  // Status monitoring is now handled globally by RealtimeProvider

  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    const unsubscribe = subscribe(
      {
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      {
        onData: (payload) => {
          try {
            if (payload.eventType === "INSERT") {
              const newNotification = payload.new as DBNotification;
              
              if (tenantId && newNotification.tenant_id && newNotification.tenant_id !== tenantId) {
                return; 
              }

              setNotifications((prev) => {
                if (prev.some(n => n.id === newNotification.id)) return prev;
                return [newNotification, ...prev];
              });

              toast.info(newNotification.title, {
                description: newNotification.message,
                duration: 5000,
              });
            } else if (payload.eventType === "UPDATE") {
              const updated = payload.new as DBNotification;
              setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
            } else if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as { id: string }).id;
              setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
            }
          } catch (err) {
            console.error("[useNotifications] Payload processing error:", err);
          }
        },
        onRefresh: () => {
          console.log("[useNotifications] Re-fetching gaps due to reconnect...");
          fetchNotifications();
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId, tenantId, subscribe]);

  // --- Intelligent Stacking (Grouping) ---
  const stackedNotifications = useMemo(() => {
    const result: GroupedNotification[] = [];
    const processedIds = new Set<string>();

    const sorted = [...notifications].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      if (processedIds.has(current.id)) continue;

      const group: DBNotification[] = [current];
      processedIds.add(current.id);

      // Look ahead for similar notifications within 5 minutes
      for (let j = i + 1; j < sorted.length; j++) {
        const next = sorted[j];
        if (processedIds.has(next.id)) continue;

        const timeDiff = Math.abs(differenceInMinutes(
          new Date(current.created_at),
          new Date(next.created_at)
        ));

        // Group if same type, same title, and within 5 minutes
        if (timeDiff <= 5 && next.type === current.type && next.title === current.title) {
          group.push(next);
          processedIds.add(next.id);
        } else {
          // Since it's sorted by time, we can stop early
          break;
        }
      }

      if (group.length > 1) {
        result.push({
          ...current,
          message: `${current.title} (${group.length} รายการ)`,
          notifications: group,
          isGroup: true,
        });
      } else {
        result.push({
          ...current,
          notifications: [current],
          isGroup: false,
        });
      }
    }

    return result;
  }, [notifications]);

  // --- Actions ---

  const markAsRead = async (id: string) => {
    const original = [...notifications];
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    
    try {
      const result = await markNotificationAsReadAction(id);
      if (!result.success) throw new Error();
    } catch (err) {
      setNotifications(original);
      toast.error("ไม่สามารถทำเครื่องหมายว่าอ่านแล้วได้");
    }
  };

  const markMultipleAsRead = async (ids: string[]) => {
    const original = [...notifications];
    setNotifications((prev) => prev.map((n) => ids.includes(n.id) ? { ...n, is_read: true } : n));
    
    try {
      const result = await markNotificationsAsReadAction(ids);
      if (!result.success) throw new Error();
    } catch (err) {
      setNotifications(original);
      toast.error("ไม่สามารถทำเครื่องหมายว่าอ่านแล้วได้");
    }
  };

  const markAllAsRead = async () => {
    const original = [...notifications];
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    
    try {
      const result = await markAllNotificationsAsReadAction(tenantId);
      if (!result.success) throw new Error();
    } catch (err) {
      setNotifications(original);
      toast.error("ไม่สามารถทำเครื่องหมายอ่านทั้งหมดได้");
    }
  };

  const deleteNotification = async (id: string) => {
    const original = [...notifications];
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    
    try {
      const result = await deleteNotificationAction(id);
      if (!result.success) throw new Error();
    } catch (err) {
      setNotifications(original);
      toast.error("ไม่สามารถลบการแจ้งเตือนได้");
    }
  };

  const deleteMultiple = async (ids: string[]) => {
    const original = [...notifications];
    setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
    
    try {
      const result = await deleteNotificationsAction(ids);
      if (!result.success) throw new Error();
    } catch (err) {
      setNotifications(original);
      toast.error("ไม่สามารถลบการแจ้งเตือนได้");
    }
  };

  const deleteAll = async () => {
    const original = [...notifications];
    setNotifications([]);
    
    try {
      const result = await deleteAllNotificationsAction(tenantId);
      if (!result.success) throw new Error();
    } catch (err) {
      setNotifications(original);
      toast.error("ไม่สามารถลบการแจ้งเตือนทั้งหมดได้");
    }
  };

  return {
    notifications,
    stackedNotifications,
    unreadCount: notifications.filter((n) => !n.is_read).length,
    loading,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    deleteMultiple,
    deleteAll,
    refresh: fetchNotifications,
  };
}
