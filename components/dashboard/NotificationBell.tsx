"use client";

import { useState, useEffect } from "react";
import { refreshNotificationsAction } from "@/features/dashboard/actions";

import { Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { Notification } from "@/features/dashboard/queries";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  notifications?: Notification[];
}

export function NotificationBell({
  notifications: initialNotifications = [],
}: NotificationBellProps) {
  // State to track read notification IDs locally
  const [readIds, setReadIds] = useState<Set<string | number>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [serverNotifications, setServerNotifications] =
    useState<Notification[]>(initialNotifications);

  // Load read IDs from LocalStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("read_notifications");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setReadIds(new Set(parsed));
        }
      } catch (e) {
        console.error("Failed to parse read_notifications", e);
      }
    }
  }, []);

  // Polling for new notifications every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const latest = await refreshNotificationsAction();
      if (latest && latest.length > 0) {
        setServerNotifications(latest);
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Merge server notifications with local read state
  const notifications = serverNotifications.map((n) => ({
    ...n,
    read: n.read || readIds.has(n.id),
  }));

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string | number) => {
    const newReadIds = new Set(readIds);
    newReadIds.add(id);
    setReadIds(newReadIds);
    localStorage.setItem(
      "read_notifications",
      JSON.stringify(Array.from(newReadIds)),
    );
  };

  const markAllRead = () => {
    const newReadIds = new Set(readIds);
    notifications.forEach((n) => newReadIds.add(n.id));
    setReadIds(newReadIds);
    localStorage.setItem(
      "read_notifications",
      JSON.stringify(Array.from(newReadIds)),
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (open && unreadCount > 0) {
      markAllRead();
    }
  };

  if (!mounted) {
    // Return a placeholder or the server state carefully to avoid hydration mismatch
    // For simplicity, we render with server state but don't persist yet
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
      >
        <Bell className="h-4 w-4 text-slate-600 dark:text-slate-400" />
      </Button>
    );
  }

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800"
        >
          <Bell className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          <span className="sr-only">Toggle notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-2">
          <h4 className="text-sm font-semibold leading-none">การแจ้งเตือน</h4>
          <span className="text-xs text-muted-foreground">
            {unreadCount} รายการใหม่
          </span>
        </div>
        <Separator />
        <div className="h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <Bell className="h-10 w-10 opacity-20" />
              <p>ไม่มีการแจ้งเตือนใหม่</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => {
                const Content = (
                  <div
                    className={cn(
                      "flex flex-col gap-1 p-4 border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer",
                      !n.read && "bg-blue-50/50 dark:bg-blue-900/10",
                    )}
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm",
                          !n.read &&
                            "font-semibold text-slate-900 dark:text-slate-100",
                        )}
                      >
                        {n.message}
                      </p>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {n.time}
                    </span>
                  </div>
                );

                if (n.href) {
                  return (
                    <Link
                      key={n.id}
                      href={n.href}
                      className="block"
                      onClick={() => markAsRead(n.id)}
                    >
                      {Content}
                    </Link>
                  );
                }

                return <div key={n.id}>{Content}</div>;
              })}
            </div>
          )}
        </div>
        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-center text-xs h-8"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            อ่านทั้งหมด
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
