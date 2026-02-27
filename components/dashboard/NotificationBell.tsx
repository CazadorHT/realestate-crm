"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-100 transition-all"
        >
          <Bell className="h-4 w-4 text-slate-600" />
          <span className="sr-only">Toggle notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 overflow-hidden rounded-2xl border-slate-200 shadow-xl"
        align="end"
      >
        <div className="flex items-center justify-between p-4 bg-slate-50/50">
          <div>
            <h4 className="text-sm font-bold text-slate-900">การแจ้งเตือน</h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              {unreadCount} รายการที่ยังไม่ได้อ่าน
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold"
              onClick={markAllAsRead}
            >
              อ่านทั้งหมด
            </Button>
          )}
        </div>
        <Separator />
        <div className="max-h-[350px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400 animate-pulse">
              กำลังโหลด...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-slate-400">
              <Bell className="h-10 w-10 opacity-10" />
              <p className="text-sm">ไม่มีการแจ้งเตือน</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => {
                const timeAgo = formatDistanceToNow(new Date(n.created_at), {
                  addSuffix: true,
                  locale: th,
                });

                const content = (
                  <div
                    className={cn(
                      "group flex flex-col gap-1 p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer relative",
                      !n.is_read && "bg-blue-50/30",
                    )}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                  >
                    <div className="flex items-start justify-between gap-2 pr-6">
                      <div className="space-y-0.5">
                        <p
                          className={cn(
                            "text-xs font-bold text-slate-800",
                            !n.is_read && "text-blue-700",
                          )}
                        >
                          {n.title}
                        </p>
                        <p className="text-sm text-slate-600 leading-snug">
                          {n.message}
                        </p>
                      </div>
                      {!n.is_read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {timeAgo}
                    </span>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        deleteNotification(n.id);
                      }}
                      className="absolute top-4 right-4 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-slate-200 transition-all text-slate-400 hover:text-red-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3 h-3"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                );

                if (n.link) {
                  return (
                    <Link key={n.id} href={n.link} className="block">
                      {content}
                    </Link>
                  );
                }

                return <div key={n.id}>{content}</div>;
              })}
            </div>
          )}
        </div>
        <Separator />
        <div className="p-3 bg-slate-50/30">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs font-bold text-slate-500 hover:text-slate-700 rounded-lg h-8"
            asChild
          >
            <Link href="/protected/notifications">ดูการแจ้งเตือนทั้งหมด</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
