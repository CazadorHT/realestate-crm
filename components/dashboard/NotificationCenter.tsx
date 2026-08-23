"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, AlertCircle, Clock, Check } from "lucide-react";
import type { Notification } from "@/features/dashboard/queries";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { formatTimeAgo, formatTimeAgoEn } from "@/lib/utils";

interface NotificationCenterProps {
  notifications: Notification[];
  role?: string;
  view?: string;
}

export function NotificationCenter({
  notifications: initialNotifications = [],
  role,
  view = "personal",
}: NotificationCenterProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const [readIds, setReadIds] = useState<Set<string | number>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string | number>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [draftNotif, setDraftNotif] = useState<Notification | null>(null);

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

    // Check for active property form draft
    try {
      const rawDraft = localStorage.getItem("property-form-draft");
      if (rawDraft) {
        const { values, timestamp } = JSON.parse(rawDraft);
        if (values && (values.title || values.price || values.description)) {
          setDraftNotif({
            id: "draft-recovery",
            type: "alert",
            message: isEn
              ? `📝 Unsaved Property Draft: "${values.title || 'Untitled'}"`
              : `📝 แบบร่างที่ยังไม่บันทึก: "${values.title || 'ไม่มีชื่อโครงการ'}"`,
            time: isEn
              ? `Last saved at ${new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
              : `บันทึกล่าสุดเมื่อ ${new Date(timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`,
            read: false,
            href: "/protected/properties/new?restore=true",
          });
        }
      }
    } catch (e) {
      console.error("Failed to parse draft for notification center", e);
    }
  }, [isEn]);

  // Filter and merge notifications
  const allNotifs = draftNotif ? [draftNotif, ...initialNotifications] : initialNotifications;
  const visibleNotifications = allNotifs
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
            {isEn ? "Notifications" : "การแจ้งเตือน"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-center text-sm text-muted-foreground py-4 px-6">
            {isEn ? "Loading..." : "กำลังโหลด..."}
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
          {isEn ? "Notifications" : "การแจ้งเตือน"}
        </CardTitle>
        <Button
          variant="ghost"
          className="h-auto p-0 text-xs text-muted-foreground hover:text-primary cursor-pointer"
          onClick={markAllRead}
          disabled={unreadCount === 0}
        >
          {isEn ? "Mark all read" : "อ่านทั้งหมดแล้ว"}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0 max-h-[320px] overflow-y-auto px-6 py-4">
          {visibleNotifications.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              {isEn ? "No new notifications" : "ไม่มีการแจ้งเตือนใหม่"}
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
                  className={`flex items-start gap-3 pb-3 mb-3 border-b border-gray-200 last:border-0 last:pb-0 ${
                    notif.read ? "opacity-60" : ""
                  }`}
                >
                  <div
                    className={`mt-0.5 rounded-full p-1.5 
                  ${
                    notif.read
                      ? "bg-gray-100 text-gray-500"
                      : notif.type === "warning"
                        ? "bg-yellow-100 text-yellow-600"
                        : notif.type === "alert"
                          ? "bg-red-100 text-red-600"
                          : "bg-blue-100 text-blue-600"
                  }`}
                  >
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="space-y-1 w-full">
                    <div className="flex justify-between items-start">
                      {notif.href ? (
                        <a href={notif.href} className="hover:underline hover:text-blue-600 block">
                          <p className={`text-sm leading-none ${!notif.read ? "font-semibold" : "font-medium"}`}>
                            {isEn ? (notif.messageEn || notif.message) : notif.message}
                          </p>
                        </a>
                      ) : (
                        <p className={`text-sm leading-none ${!notif.read ? "font-semibold" : "font-medium"}`}>
                          {isEn ? (notif.messageEn || notif.message) : notif.message}
                        </p>
                      )}
                      {!notif.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {notif.createdAt
                        ? (isEn
                            ? formatTimeAgoEn(notif.createdAt)
                            : (notif.time || formatTimeAgo(notif.createdAt)))
                        : notif.time}
                    </p>
                    {notif.id === "draft-recovery" && notif.href && (
                      <div className="pt-2">
                        <a href={notif.href} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors no-underline">
                          {isEn ? "⚡ Restore Draft" : "⚡ กู้คืนแบบร่าง (Restore)"}
                        </a>
                      </div>
                    )}
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
