"use client";

import { useState, useMemo } from "react";
import { 
  Bell, 
  Search, 
  Filter, 
  ChevronDown, 
  CheckCheck, 
  Trash2, 
  X, 
  Settings2,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";
import { useNotifications, GroupedNotification } from "@/hooks/use-notifications";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  isToday, 
  isYesterday, 
  isThisWeek, 
} from "date-fns";
import { th } from "date-fns/locale";
import { NotificationItem } from "./_components/NotificationItem";
import { NotificationSkeleton } from "./_components/NotificationSkeleton";
import { NotificationEmptyState } from "./_components/NotificationEmptyState";
import { NotificationPreferences } from "./_components/NotificationPreferences";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function NotificationsPage() {
  const {
    stackedNotifications,
    loading,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    deleteMultiple,
    deleteAll,
    refresh,
    unreadCount,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPreferences, setShowPreferences] = useState(false);

  // --- Filtering & Searching ---
  const filteredNotifications = useMemo(() => {
    let result = [...stackedNotifications];

    if (activeTab === "unread") {
      result = result.filter((n) => !n.is_read);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.message?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [stackedNotifications, activeTab, searchQuery]);

  // --- Date Grouping Logic ---
  const notificationGroups = useMemo(() => {
    const groups: { title: string; icon: any; items: GroupedNotification[] }[] = [
      { title: "วันนี้", icon: Bell, items: [] },
      { title: "เมื่อวาน", icon: Calendar, items: [] },
      { title: "สัปดาห์นี้", icon: Layers, items: [] },
      { title: "ที่ผ่านมา", icon: Layers, items: [] },
    ];

    filteredNotifications.forEach((n) => {
      const date = new Date(n.created_at);
      if (isToday(date)) groups[0].items.push(n);
      else if (isYesterday(date)) groups[1].items.push(n);
      else if (isThisWeek(date)) groups[2].items.push(n);
      else groups[3].items.push(n);
    });

    return groups.filter((g) => g.items.length > 0);
  }, [filteredNotifications]);

  // --- Batch Actions ---
  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  const handleBatchMarkRead = async () => {
    const ids = Array.from(selectedIds);
    await markMultipleAsRead(ids);
    setSelectedIds(new Set());
  };

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds);
    await deleteMultiple(ids);
    setSelectedIds(new Set());
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 min-h-screen pb-32 relative">
      <PageHeader
        title="การแจ้งเตือน"
        subtitle="อัปเดตความเคลื่อนไหวล่าสุดผ่านระบบจัดการแจ้งเตือนอัจฉริยะ"
        icon="bell"
        actionSlot={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreferences(true)}
              className="rounded-xl h-11 w-11 hover:bg-slate-50 border-slate-200"
              title="ตั้งค่าแจ้งเตือน"
            >
              <Settings2 className="h-5 w-5 text-slate-600" />
            </Button>
            <ConfirmDialog
              title="อ่านทั้งหมด"
              description="คุณต้องการทำเครื่องหมายว่าอ่านแล้วสำหรับแจ้งเตือนทั้งหมดใช่หรือไม่?"
              confirmText="ยืนยัน"
              onConfirm={markAllAsRead}
              trigger={
                <Button 
                  variant="outline" 
                  className="rounded-xl h-11 border-slate-200 font-bold text-xs gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 hidden sm:flex"
                >
                  <CheckCheck className="h-4 w-4" />
                  อ่านทั้งหมด
                </Button>
              }
            />
          </div>
        }
      />

      {/* Modern Filter & Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-slate-50 p-1 rounded-[18px]">
          <TabsList className="bg-transparent border-none p-0">
            <TabsTrigger 
              value="all" 
              className="rounded-2xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-bold transition-all"
            >
              ทั้งหมด
            </TabsTrigger>
            <TabsTrigger 
              value="unread" 
              className="rounded-2xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-bold transition-all relative"
            >
              ยังไม่ได้อ่าน
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 rounded-full ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input
            placeholder="ค้นหาข้อความ หรือหัวข้อแจ้งเตือน..."
            className="pl-11 h-12 rounded-2xl border-none bg-slate-50/50 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-100 transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Button 
          variant="outline" 
          onClick={handleSelectAll}
          className={cn(
             "h-12 rounded-2xl border-slate-200 font-bold text-xs gap-2",
             selectedIds.size > 0 && "bg-blue-50 text-blue-600 border-blue-100"
          )}
        >
          {selectedIds.size === filteredNotifications.length ? "ยกเลิกเลือกทั้งหมด" : "เลือกทั้งหมด"}
        </Button>
      </div>

      {loading ? (
        <NotificationSkeleton />
      ) : filteredNotifications.length === 0 ? (
        <NotificationEmptyState 
          message={searchQuery ? "ไม่พบแจ้งเตือนที่ค้นหา" : "ไม่มีแจ้งเตือนในขณะนี้"} 
          onRefresh={refresh} 
        />
      ) : (
        <div className="space-y-10 pb-20">
          {notificationGroups.map((group) => (
            <div key={group.title} className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3 px-2">
                <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center">
                  <group.icon className="h-4 w-4 text-slate-400" />
                </div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{group.title}</h3>
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-bold text-slate-300 uppercase">{group.items.length} รายการ</span>
              </div>
              
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50 transition-all">
                {group.items.map((item) => (
                  <NotificationItem
                    key={item.id}
                    notification={item}
                    isSelected={selectedIds.has(item.id)}
                    onSelect={handleSelect}
                    onMarkRead={markAsRead}
                    onDelete={deleteNotification}
                    onBatchMarkRead={markMultipleAsRead}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Batch Actions Toolbar (Floating) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
          <div className="bg-slate-900 text-white rounded-3xl p-3 shadow-2xl flex items-center gap-4 border border-white/10 ring-8 ring-slate-900/10">
            <div className="pl-4 pr-2 flex flex-col justify-center border-r border-white/10">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">เลือกแล้ว</span>
              <span className="text-lg font-black leading-none">{selectedIds.size}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleBatchMarkRead}
                variant="ghost" 
                className="rounded-2xl h-11 px-6 hover:bg-white/10 text-xs font-bold gap-2 text-blue-300"
              >
                <CheckCheck className="h-4 w-4" />
                อ่านแล้ว
              </Button>

              <ConfirmDialog
                 title="ลบรายการที่เลือก"
                 description={`คุณต้องการลบการแจ้งเตือน ${selectedIds.size} รายการที่เลือกใช่หรือไม่?`}
                 confirmText="ลบออก"
                 variant="destructive"
                 onConfirm={handleBatchDelete}
                 trigger={
                   <Button 
                    variant="ghost" 
                    className="rounded-2xl h-11 px-6 hover:bg-red-500/10 hover:text-red-400 text-xs font-bold gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    ลบข้อมูล
                  </Button>
                 }
              />

              <div className="h-8 w-px bg-white/10 my-2" />

              <Button 
                onClick={() => setSelectedIds(new Set())}
                variant="ghost" 
                size="icon"
                className="rounded-2xl h-11 w-11 hover:bg-white/10 text-slate-400"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Dialog */}
      <ResponsiveDialog
        open={showPreferences}
        onOpenChange={setShowPreferences}
        title="การตั้งค่า"
      >
        <div className="p-4 sm:p-0">
          <NotificationPreferences />
        </div>
      </ResponsiveDialog>
    </div>
  );
}
