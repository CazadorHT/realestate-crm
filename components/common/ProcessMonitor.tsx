"use client";

import { useEffect, useState } from "react";
import { useProcess } from "@/components/providers/ProcessProvider";
import { 
  Loader2, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  History,
  Trash2,
  Building2,
  Users,
  Settings,
  MapPin,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  Volume2,
  Square,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelBackgroundTaskAction } from "@/lib/background-tasks/actions";
import { toast } from "sonner";
import Link from "next/link";
import {
  ResponsiveDialog,
} from "@/components/ui/responsive-dialog";
import { cn } from "@/lib/utils";
import { m, AnimatePresence } from "framer-motion";
import { FaFacebook, FaInstagram, FaLine, FaTiktok } from "react-icons/fa";

import { 
  AnimatedCheck, 
  AnimatedAlert, 
  AnimatedLoader, 
  AnimatedActivity 
} from "./ProcessIcons";
import { Checkbox } from "@/components/ui/checkbox";

// 🔊 Premium Sound Assets (Public CDN)
const SUCCESS_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"; 
const ERROR_SOUND = "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3";

export function ProcessMonitor() {
  const { processes, activeCount, errorCount, clearFinished, deleteMultiple } = useProcess();
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 🛡️ Effect to play sound when processes change status
  useEffect(() => {
    if (!soundEnabled) return;
    
    // Find processes that just finished in the last 2 seconds
    const now = new Date().getTime();
    const latestFinished = processes.find(p => 
      p.completedAt && (now - p.completedAt.getTime() < 2000)
    );

    if (latestFinished) {
      const audio = new Audio(latestFinished.status === "SUCCESS" ? SUCCESS_SOUND : ERROR_SOUND);
      audio.volume = 0.4;
      audio.play().catch(() => {
        // Autoplay policy might block sound until user interacts
        console.log("Sound blocked by browser policy");
      });
    }
  }, [processes, soundEnabled]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === processes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(processes.map(p => p.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    await deleteMultiple(selectedIds);
    setSelectedIds([]);
    toast.success(`ลบรายการที่เลือก (${selectedIds.length}) เรียบร้อยแล้ว`);
  };

  return (
    <>
      {/* Floating Container */}
      <AnimatePresence>
        {(activeCount > 0 || errorCount > 0 || processes.length > 0) && (
          <m.div 
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            className="fixed bottom-24 lg:bottom-6 right-6 z-50 flex items-center gap-2"
          >
            {/* Close / Dismiss Button (Only show when work is done successfully) */}
            {activeCount === 0 && processes.length > 0 && (
              <m.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  clearFinished();
                  toast.info("ปิดและล้างประวัติงานที่สำเร็จเรียบร้อย");
                }}
                className="h-6 w-6 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center border border-slate-200 shadow-sm transition-all"
                title="ปิด / ล้างงานที่สำเร็จ"
              >
                <span className="text-[10px] font-bold">✕</span>
              </m.button>
            )}

            {/* Main Floating Circle Button */}
            <m.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(true)}
              className={cn(
                "h-10 w-10 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center border transition-all group overflow-hidden bg-white relative",
                activeCount > 0 
                  ? "border-blue-500 text-blue-600 shadow-blue-200" 
                  : errorCount > 0 
                    ? "border-red-500 text-red-600 shadow-red-200" 
                    : "border-emerald-500 text-emerald-600 shadow-emerald-200"
              )}
            >
              <AnimatePresence mode="wait">
                {activeCount > 0 ? (
                  <m.div
                    key="active"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="relative flex items-center justify-center"
                  >
                    <AnimatedLoader size={20} />
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-blue-700">
                      {activeCount}
                    </span>
                  </m.div>
                ) : errorCount > 0 ? (
                  <AnimatedAlert key="error" size={20} />
                ) : (
                  <AnimatedCheck key="idle" size={20} className="text-emerald-500" />
                )}
              </AnimatePresence>

              {/* Notification Badge */}
              {(activeCount > 0 || errorCount > 0) && (
                <m.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    "absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-md border border-white z-10",
                    errorCount > 0 ? "bg-red-500" : "bg-blue-500"
                  )}
                >
                  {activeCount + errorCount}
                </m.div>
              )}

              {/* Pulse effect when active */}
              {activeCount > 0 && (
                <span className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping" />
              )}
            </m.button>
          </m.div>
        )}
      </AnimatePresence>

      {/* Dialog / History View */}
      <ResponsiveDialog 
        open={isOpen} 
        onOpenChange={setIsOpen}
        title={
          <div className="flex items-center justify-between w-full pr-8">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-slate-400" />
              <span className="text-lg!">ห้องควบคุมงานเบื้องหลัง</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 rounded-full", soundEnabled ? "text-blue-500" : "text-slate-300")}
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "ปิดเสียงแจ้งเตือน" : "เปิดเสียงแจ้งเตือน"}
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
        }
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {processes.length > 0 && (
                <Checkbox 
                  checked={selectedIds.length === processes.length && processes.length > 0}
                  onCheckedChange={toggleSelectAll}
                  className="rounded-md border-slate-300"
                />
              )}
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                ประวัติการทำงาน ({processes.length})
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 ? (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDeleteSelected}
                  className="text-xs rounded-full h-8 px-4 animate-in fade-in zoom-in duration-200"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  ลบที่เลือก ({selectedIds.length})
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFinished}
                  disabled={processes.filter(p => p.status !== 'PROCESSING').length === 0}
                  className="text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full h-8"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  ล้างที่สำเร็จ
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto px-1">
            <AnimatePresence initial={false}>
              {processes.map((p) => (
                <m.div 
                  key={p.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-2xl border transition-all relative overflow-hidden group/item",
                    p.status === "PROCESSING" ? "bg-blue-50/30 border-blue-100" :
                    p.status === "ERROR" ? "bg-red-50/30 border-red-100" :
                    "bg-white border-slate-100 shadow-sm",
                    selectedIds.includes(p.id) && "ring-2 ring-blue-500 border-blue-500"
                  )}
                >
                  <div className="mt-1 shrink-0 flex flex-col items-center gap-4">
                    <Checkbox 
                      checked={selectedIds.includes(p.id)}
                      onCheckedChange={() => toggleSelect(p.id)}
                      className="rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    {(() => {
                      if (p.type?.startsWith("SOCIAL_")) {
                        const platform = p.type.replace("SOCIAL_", "");
                        const iconProps = { className: "h-5 w-5" };
                        switch (platform) {
                          case "FACEBOOK": return <FaFacebook {...iconProps} className={cn(iconProps.className, "text-blue-600")} />;
                          case "INSTAGRAM": return <FaInstagram {...iconProps} className={cn(iconProps.className, "text-pink-600")} />;
                          case "LINE": return <FaLine {...iconProps} className={cn(iconProps.className, "text-emerald-500")} />;
                          case "TIKTOK": return <FaTiktok {...iconProps} className={cn(iconProps.className, "text-slate-900")} />;
                          default: break;
                        }
                      }
                      
                      if (p.status === "PROCESSING") {
                        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
                      } else if (p.status === "SUCCESS") {
                        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
                      } else {
                        return <AlertCircle className="h-5 w-5 text-red-500" />;
                      }
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                      <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-full">
                        {p.startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs mt-1 leading-relaxed",
                      p.status === "ERROR" ? "text-red-600 font-medium" : "text-slate-500"
                    )}>
                      {p.status === "PROCESSING" ? "กำลังประมวลผลระบบหลังบ้าน..." : 
                       p.message || (p.status === "SUCCESS" ? "ดำเนินการเสร็จสิ้นเรียบร้อยแล้ว" : "เกิดข้อผิดพลาดในการประมวลผล")}
                    </p>

                    {/* 🕵️ Source Tracking (Audit Info) */}
                    {(p.payload as any)?.metadata?.userAgent && (
                      <div className="mt-2 flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
                        <Monitor className="h-3 w-3" />
                        <p className="text-[9px] font-medium truncate max-w-[200px]" title={(p.payload as any).metadata.userAgent}>
                          Source: {(p.payload as any).metadata.userAgent.split(')')[0].split('(')[1] || "Browser"}
                        </p>
                      </div>
                    )}
                    
                    {/* Task Actions */}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                        {p.status === "ERROR" && p.onRetry && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              p.onRetry?.();
                              setIsOpen(false);
                            }}
                            className="h-8 text-[10px] font-bold gap-1.5 rounded-xl border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200"
                          >
                            <RotateCcw className="h-3 w-3" />
                            ลองอีกครั้ง
                          </Button>
                        )}

                        {p.status === "PROCESSING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const res = await cancelBackgroundTaskAction(p.id);
                              if (res.success) {
                                // 🚀 Instant UI Feedback
                                const { dispatchProcessEvent } = await import("@/lib/process-monitor");
                                dispatchProcessEvent({
                                  type: "PROCESS_UPDATED",
                                  id: p.id,
                                  status: "ERROR",
                                  message: "ยกเลิกการทำงานโดยผู้ใช้"
                                });
                                toast.success("หยุดการทำงานเรียบร้อยแล้ว");
                              } else {
                                toast.error("ไม่สามารถยกเลิกงานได้: " + res.message);
                              }
                            }}
                            className="h-8 text-[10px] font-bold gap-1.5 rounded-xl border-orange-100 text-orange-600! hover:bg-orange-50 hover:border-orange-200"
                          >
                            <Square className="h-3 w-3 fill-current" />
                            หยุดทำงาน
                          </Button>
                        )}

                        {p.status === "SUCCESS" && p.resultLink && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              window.open(p.resultLink, "_blank");
                            }}
                            className="h-8 text-[10px] font-semibold gap-1.5 rounded-xl border-emerald-100 text-emerald-600! hover:bg-emerald-50 hover:border-emerald-200 shadow-sm"
                          >
                            <ExternalLink className="h-3 w-3" />
                            ดูผลลัพธ์ (View)
                          </Button>
                        )}

                    </div>

                    {p.completedAt && (
                      <p className="text-[10px] text-slate-300 mt-3 italic">
                        เสร็จสิ้นเมื่อ {p.completedAt.toLocaleTimeString()}
                      </p>
                    )}
                  </div>

                  {/* Success indicator glow */}
                  {p.status === "SUCCESS" && (
                    <div className="absolute top-0 right-0 h-full w-1 bg-emerald-500/30" />
                  )}
                </m.div>
              ))}
            </AnimatePresence>
            
            {processes.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <m.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <Activity className="h-16 w-16 mx-auto mb-4 opacity-10" />
                  <p className="text-sm font-medium">ยังไม่มีประวัติการทำงานในขณะนี้</p>
                  <p className="text-xs mt-1">ระบบจะแสดงรายการที่คุณสั่งรันในหน้านี้</p>
                </m.div>
              </div>
            )}
          </div>
        </div>
      </ResponsiveDialog>
    </>
  );
}
