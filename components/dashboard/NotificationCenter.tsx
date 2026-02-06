"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, AlertCircle, Clock, Check } from "lucide-react";
import type { Notification } from "@/features/dashboard/queries";

interface NotificationCenterProps {
  notifications: Notification[];
}

export function NotificationCenter({
  notifications: initialNotifications = [],
}: NotificationCenterProps) {
  const [readIds, setReadIds] = useState<Set<string | number>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string | number>>(new Set());
  const [mounted, setMounted] = useState(false);

  // Load state from LocalStorage on mount
  useEffect(() => {
    setMounted(true);

    const storedRead = localStorage.getItem("read_notifications");
    if (storedRead) {
      try {
        const parsed = JSON.parse(storedRead);
        if (Array.isArray(parsed)) setReadIds(new Set(parsed));
      } catch (e) {
        console.error("Failed to parse read_notifications", e);
      }
    }

    const storedDeleted = localStorage.getItem("deleted_notifications");
    if (storedDeleted) {
      try {
        const parsed = JSON.parse(storedDeleted);
        if (Array.isArray(parsed)) setDeletedIds(new Set(parsed));
      } catch (e) {
        console.error("Failed to parse deleted_notifications", e);
      }
    }
  }, []);

  // Filter and merge notifications
  const visibleNotifications = initialNotifications
    .filter((n) => !deletedIds.has(n.id))
    .map((n) => ({
      ...n,
      read: n.read || readIds.has(n.id),
    }));

  const unreadCount = visibleNotifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    const newReadIds = new Set(readIds);
    visibleNotifications.forEach((n) => newReadIds.add(n.id));
    setReadIds(newReadIds);
    localStorage.setItem(
      "read_notifications",
      JSON.stringify(Array.from(newReadIds)),
    );
  };

  if (!mounted) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            การแจ้งเตือน
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-center text-sm text-muted-foreground py-4 px-6">
            กำลังโหลด...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
            )}
          </div>
          การแจ้งเตือน
        </CardTitle>
        <Button
          variant="ghost"
          className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
          onClick={markAllRead}
          disabled={unreadCount === 0}
        >
          Mark all read
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0 max-h-[320px] overflow-y-auto px-6 py-4">
          {visibleNotifications.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              ไม่มีการแจ้งเตือนใหม่
            </div>
          ) : (
            visibleNotifications.map((notif) => {
              const Icon =
                notif.type === "warning"
                  ? AlertCircle
                  : notif.type === "alert"
                    ? Clock
                    : notif.read
                      ? Check
                      : Bell;
              return (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 pb-3 mb-3 border-b border-gray-200 dark:border-gray-800 last:border-0 last:pb-0 ${
                    notif.read ? "opacity-60" : ""
                  }`}
                >
                  <div
                    className={`mt-0.5 rounded-full p-1.5 
                  ${
                    notif.read
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                      : notif.type === "warning"
                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                        : notif.type === "alert"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  }`}
                  >
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="space-y-1 w-full">
                    <div className="flex justify-between items-start">
                      <p
                        className={`text-sm leading-none ${
                          !notif.read ? "font-semibold" : "font-medium"
                        }`}
                      >
                        {notif.message}
                      </p>
                      {!notif.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {notif.time}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
