"use client";

import { Bell, Layers, CheckCheck, Trash2, ExternalLink, UserPlus, Building2, Bell as BellIcon, Info, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  LEAD_TRANSFER: { icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50" },
  BRANCH_INVITE: { icon: Building2, color: "text-emerald-600", bg: "bg-emerald-50" },
  SYSTEM: { icon: BellIcon, color: "text-purple-600", bg: "bg-purple-50" },
  INFO: { icon: Info, color: "text-blue-500", bg: "bg-blue-50" },
  WARNING: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
};

export function NotificationBell() {
  const {
    stackedNotifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  return (
    <ResponsiveDialog
      trigger={
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center p-0"
        >
          <Bell className="h-5 w-5 text-slate-600" />
          <span className="sr-only">Toggle notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
            </span>
          )}
        </Button>
      }
      title="การแจ้งเตือน"
      description={
        <div className="flex items-center justify-between w-full">
          <span className="font-medium text-slate-500 text-sm">{unreadCount} รายการที่ยังไม่ได้อ่าน</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold -mr-2 rounded-lg"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
              อ่านทั้งหมด
            </Button>
          )}
        </div>
      }
      className="max-w-md!"
      footer={
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs font-bold text-slate-500 hover:text-slate-900 rounded-xl h-11 border-slate-200"
          asChild
        >
          <Link href="/protected/notifications">
            ดูการแจ้งเตือนทั้งหมด
            <ExternalLink className="h-3.5 w-3.5 ml-2 opacity-50" />
          </Link>
        </Button>
      }
    >
      <div className="flex flex-col min-h-[300px] overflow-hidden -mx-6 sm:mx-0">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400 animate-pulse flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-slate-100 border-t-blue-500 animate-spin" />
            <p className="font-bold text-slate-500">กำลังโหลดความเคลื่อนไหว...</p>
          </div>
        ) : stackedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
              <Bell className="h-10 w-10 text-slate-200" />
            </div>
            <div className="space-y-1">
              <p className="font-black text-slate-900 text-lg">เงียบสงบ...</p>
              <p className="text-sm text-slate-500">ยังไม่มีการแจ้งเตือนใหม่ในขณะนี้</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-50">
            {stackedNotifications.slice(0, 15).map((n) => {
              const config = TYPE_CONFIG[n.type || "INFO"] || TYPE_CONFIG.INFO;
              const IconComp = config.icon;
              const timeAgo = formatDistanceToNow(new Date(n.created_at), {
                addSuffix: true,
                locale: th,
              });

              const content = (
                <div
                  className={cn(
                    "group flex items-start gap-4 p-5 hover:bg-slate-50/50 transition-colors cursor-pointer relative",
                    !n.is_read && "bg-blue-50/20",
                  )}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-white shadow-sm relative",
                    config.bg
                  )}>
                    <IconComp className={cn("h-5 w-5", config.color)} />
                    {n.isGroup && (
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-md bg-white border border-slate-100 shadow-sm flex items-center justify-center">
                         <Layers className="h-2.5 w-2.5 text-slate-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1 pr-6 min-w-0">
                    <div className="flex items-center gap-2">
                       <p className={cn(
                          "text-sm font-bold text-slate-800 truncate",
                          !n.is_read && "text-blue-700",
                        )}>
                          {n.title}
                          {n.isGroup && <span className="ml-1 opacity-40 font-medium text-[10px]">({n.notifications.length})</span>}
                        </p>
                        {!n.is_read && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />}
                    </div>
                    <p className="text-[12px] text-slate-500 leading-snug font-medium line-clamp-2">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2 pt-0.5">
                      {timeAgo}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      deleteNotification(n.id);
                    }}
                    className="absolute top-4 right-4 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all text-slate-400 hover:text-red-500"
                    title="ลบ"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );

              if (n.link && !n.isGroup) {
                return (
                  <Link key={n.id} href={n.link} className="block no-underline">
                    {content}
                  </Link>
                );
              }

              return <div key={n.id}>{content}</div>;
            })}
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}
