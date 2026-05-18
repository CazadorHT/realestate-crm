"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { Check, Trash2, ExternalLink, Info, AlertTriangle, Bell as BellIcon, UserPlus, Building2, ChevronRight, Layers, X, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GroupedNotification } from "@/hooks/use-notifications";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

import { acceptInvitationAction, declineInvitationAction } from "@/lib/actions/tenant-management";

interface NotificationItemProps {
  notification: GroupedNotification;
  isSelected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onMarkRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onBatchMarkRead?: (ids: string[]) => Promise<void>;
}

const TYPE_CONFIG: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  LEAD_TRANSFER: { icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50" },
  BRANCH_INVITE: { icon: Building2, color: "text-emerald-600", bg: "bg-emerald-50" },
  SYSTEM: { icon: BellIcon, color: "text-purple-600", bg: "bg-purple-50" },
  INFO: { icon: Info, color: "text-blue-500", bg: "bg-blue-50" },
  WARNING: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
};

export function NotificationItem({
  notification,
  isSelected,
  onSelect,
  onMarkRead,
  onDelete,
  onBatchMarkRead,
}: NotificationItemProps) {
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [responding, setResponding] = useState(false);

  const config = TYPE_CONFIG[notification.type || "INFO"] || TYPE_CONFIG.INFO;
  const Icon = config.icon;

  const timeAgo = formatDistanceToNow(new Date(notification.created_at || new Date().toISOString()), {
    addSuffix: true,
    locale: th,
  });

  const handleMarkAsRead = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    try {
      if (notification.isGroup && onBatchMarkRead) {
        const unreadIds = notification.notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length > 0) await onBatchMarkRead(unreadIds);
      } else {
        await onMarkRead(notification.id);
      }
    } catch (error) {
      toast.error("ไม่สามารถทำเครื่องหมายว่าอ่านแล้วได้");
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(notification.id);
      toast.success("ลบการแจ้งเตือนแล้ว");
    } catch (error) {
      toast.error("ไม่สามารถลบการแจ้งเตือนได้");
    }
  };

  const handleInviteResponse = async (accept: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!notification.tenant_id) return;

    setResponding(true);
    try {
      const result = accept 
        ? await acceptInvitationAction(notification.tenant_id)
        : await declineInvitationAction(notification.tenant_id);
      
      if (result.success) {
        toast.success(accept ? "เข้าร่วมสาขาสำเร็จ" : "ปฏิเสธคำเชิญแล้ว");
        handleDelete(); // Auto delete/clean notification after response
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      toast.error("ไม่สามารถดำเนินการได้ในขณะนี้");
    } finally {
      setResponding(false);
    }
  };

  const handleNavigate = async (e: React.MouseEvent) => {
    if (!notification.link) return;
    if (!notification.is_read) {
      handleMarkAsRead();
    }
  };

  const isInvite = notification.type === "BRANCH_INVITE";

  const content = (
    <div
      className={cn(
        "group relative flex items-start gap-4 p-5 sm:p-6 transition-all hover:bg-slate-50/80 cursor-pointer overflow-hidden",
        !notification.is_read && "bg-blue-50/20 shadow-inner shadow-blue-500/5",
        isSelected && "bg-blue-50/40 ring-1 ring-inset ring-blue-100"
      )}
      onClick={() => !notification.is_read && handleMarkAsRead()}
    >
      {/* Indicator Bar */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 bg-blue-500 transition-transform origin-top",
          !notification.is_read ? "scale-y-100" : "scale-y-0"
        )} 
      />

      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center justify-center p-1">
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={(checked) => onSelect?.(notification.id, !!checked)}
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="rounded-md border-slate-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
          />
        </div>

        {/* Type Icon */}
        <div className={cn(
          "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border border-white shadow-sm relative", 
          config.bg
        )}>
          <Icon className={cn("h-6 w-6", config.color)} />
          {notification.isGroup && (
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center">
              <Layers className="h-3 w-3 text-slate-400" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2 min-w-0 pr-12">
        <div className="flex items-center gap-2">
          <h4 className={cn(
            "text-base font-bold tracking-tight text-slate-800 truncate",
            !notification.is_read && "text-blue-700"
          )}>
            {notification.title}
            {notification.isGroup && (
              <span className="ml-2 text-xs text-slate-400 font-medium">({notification.notifications.length} รายการ)</span>
            )}
          </h4>
          {!notification.is_read && (
            <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
          )}
        </div>
        <p className="text-sm text-slate-600 leading-relaxed font-medium line-clamp-2">
          {notification.message}
        </p>

        {/* Interactive Buttons for Invites */}
        {isInvite && !notification.is_read && (
          <div className="flex items-center gap-2 pt-2 animate-in fade-in slide-in-from-left-2 duration-500">
            <Button 
              size="sm" 
              disabled={responding}
              onClick={(e) => handleInviteResponse(true, e)}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-6 shadow-md shadow-emerald-100"
            >
              {responding ? "กำลังดำเนินการ..." : "ตอบรับ"}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              disabled={responding}
              onClick={(e) => handleInviteResponse(false, e)}
              className="rounded-xl h-9 border-slate-200 font-bold px-4 text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              ปฏิเสธ
            </Button>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            {timeAgo}
          </span>
          {notification.link && !notification.isGroup && (
            <span className="text-[10px] sm:text-xs font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1">
              คลิกเพื่อดูรายละเอียด
              <ExternalLink className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>

      {/* Group Detail Access */}
      {notification.isGroup && (
        <div className="self-center pr-2">
          <div className="h-8 w-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Actions Toolbar */}
      <div className="absolute top-5 right-4 sm:right-6 flex flex-col sm:flex-row items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
        {!notification.is_read && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMarkAsRead}
            className="h-9 w-9 bg-white shadow-sm hover:bg-blue-50 hover:text-blue-600 rounded-xl border border-slate-100"
            title="ทำเครื่องหมายว่าอ่านแล้ว"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <ConfirmDialog
          title="ลบการแจ้งเตือน"
          description={notification.isGroup ? `คุณต้องการลบการแจ้งเตือนที่เกี่ยวข้องทั้ง ${notification.notifications.length} รายการใช่หรือไม่?` : "คุณต้องการลบการแจ้งเตือนนี้ใช่หรือไม่?"}
          confirmText="ลบออก"
          variant="destructive"
          onConfirm={handleDelete}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 bg-white shadow-sm hover:bg-red-50 hover:text-red-500 rounded-xl border border-slate-100"
              title="ลบการแจ้งเตือน"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          }
        />
      </div>

      {/* 404 Guard Dialog (Mock for validation) */}
      <ResponsiveDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        title="ไม่พบข้อมูล"
        description="ขออภัย ข้อมูลข่าวสารหรือรายการนี้อาจถูกลบออกไปจากระบบแล้ว"
      >
        <div className="p-10 flex flex-col items-center text-center space-y-4">
           <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-red-500" />
           </div>
           <p className="text-slate-600">เนื่องจากข้อมูลนี้ไม่มีอยู่ในระบบแล้ว คุณอาจต้องการลบการแจ้งเตือนนี้ออกจากเครื่องของคุณ</p>
           <Button onClick={() => { setShowErrorDialog(false); handleDelete(); }} variant="destructive" className="w-full rounded-2xl h-11">
              ลบการแจ้งเตือนนี้
           </Button>
        </div>
      </ResponsiveDialog>
    </div>
  );

  if (notification.link && !notification.isGroup) {
    return (
      <Link href={notification.link} className="block no-underline" onClick={handleNavigate}>
        {content}
      </Link>
    );
  }

  return content;
}
