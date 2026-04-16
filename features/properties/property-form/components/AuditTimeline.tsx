"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { th } from "date-fns/locale";
import { 
  History, 
  ChevronDown, 
  User, 
  Info, 
  ArrowRight, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Search,
  Filter,
  ArrowRightLeft,
  Image as ImageIcon,
  MinusCircle,
  PlusCircle,
  Maximize2,
  RotateCcw,
  TrendingDown,
  X
} from "lucide-react";
import { toast } from "sonner";
import { PriceHistoryChart } from "./PriceHistoryChart";
import { restorePropertyVersionAction } from "@/features/properties/actions/restore";
import { extract } from "fuzzball";
import { useDebounce } from "use-debounce";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getPropertyAuditLogsAction } from "@/features/audit/actions";
import { AuditLogEntry } from "@/features/audit/types";
import { cn } from "@/lib/utils";

interface AuditTimelineProps {
  propertyId: string;
}

export function AuditTimeline({ propertyId }: AuditTimelineProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // -- Sentinel Search States --
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [filterModifier, setFilterModifier] = useState<string>("ALL");

  const fetchLogs = useCallback(async (pageNum: number) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    const result = await getPropertyAuditLogsAction(propertyId, pageNum);

    if (result.success && result.data) {
      if (pageNum === 1) {
        setLogs(result.data.logs);
      } else {
        setLogs((prev) => [...prev, ...result.data!.logs]);
      }
      setHasMore(result.data.hasMore);
      setError(null);
    } else {
      setError(result.message || "ไม่สามารถโหลดประวัติได้");
      toast.error(result.message || "เกิดข้อผิดพลาดในการโหลดประวัติ");
    }

    setLoading(false);
    setLoadingMore(false);
  }, [propertyId]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // 1. Modifier Filter
    if (filterModifier !== "ALL") {
      result = result.filter(l => (l.profiles?.full_name || "Unknown") === filterModifier);
    }

    // 2. Action Filter
    if (filterAction !== "ALL") {
      result = result.filter(l => l.action === filterAction);
    }

    // 3. Search (Filter by Agent Name or Change Summary)
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(log => {
        const agentName = (log.profiles?.full_name || "").toLowerCase();
        const diffText = (log.metadata?.diff || []).join(" ").toLowerCase();
        return agentName.includes(q) || diffText.includes(q);
      });
    }

    return result;
  }, [logs, debouncedSearch, filterAction, filterModifier]);

  const modifiers = useMemo(() => {
    const names = logs.map(l => l.profiles?.full_name).filter(Boolean);
    return Array.from(new Set(names)) as string[];
  }, [logs]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchLogs(nextPage);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/30">
      {/* --- Sentinel Search Header --- */}
      <div className="sticky top-0 z-10 space-y-3 bg-white/80 p-4 backdrop-blur-md border-b shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="ค้นหาตามชื่อพนักงาน หรือสิ่งที่เปลี่ยน..."
              className="w-full rounded-xl border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="rounded-xl shrink-0">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Modifier Filter */}
          <select 
            value={filterModifier} 
            onChange={(e) => setFilterModifier(e.target.value)}
            className="rounded-lg border-slate-200 bg-white py-1 px-3 text-xs focus:ring-1 focus:ring-blue-500 cursor-pointer outline-none"
          >
            <option value="ALL">ทุกคน</option>
            {modifiers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {/* Action Filter */}
          <select 
            value={filterAction} 
            onChange={(e) => setFilterAction(e.target.value)}
            className="rounded-lg border-slate-200 bg-white py-1 px-3 text-xs focus:ring-1 focus:ring-blue-500 cursor-pointer outline-none"
          >
            <option value="ALL">ทุกการกระทำ</option>
            <option value="property.update">แก้ไขข้อมูล</option>
            <option value="property.status.update">เปลี่ยนสถานะ</option>
            <option value="property.restore">คืนค่าเวอร์ชัน</option>
          </select>

          {/* Quick Clear */}
          {(searchTerm || filterModifier !== "ALL" || filterAction !== "ALL") && (
            <button 
              onClick={() => {
                setSearchTerm("");
                setFilterModifier("ALL");
                setFilterAction("ALL");
              }}
              className="text-[10px] text-blue-500 hover:underline flex items-center gap-1"
            >
              <X className="h-2 w-2" /> ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {logs.length > 0 && <PriceHistoryChart logs={logs} />}

        {filteredLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
            <div className="mb-4 rounded-full bg-slate-100 p-6">
              <Search className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium">ไม่พบรายการที่ตรงกับเงื่อนไข</h3>
            <p className="text-sm text-slate-500">ลองเปลี่ยนคำค้นหาหรือตัวกรองเพื่อให้เห็นประวัติมากขึ้น</p>
          </div>
        )}

        <Accordion type="single" collapsible className="space-y-4">
          <AnimatePresence initial={false}>
            {filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <LogItem log={log} propertyId={propertyId} />
              </motion.div>
            ))}
          </AnimatePresence>
        </Accordion>

        {hasMore && (
          <div className="mt-8 flex justify-center pb-8">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="rounded-full px-8 text-xs font-medium"
            >
              {loadingMore ? "กำลังโหลด..." : "โหลดประวัติเพิ่มเติม"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function LogItem({ log, propertyId }: { log: AuditLogEntry; propertyId: string }) {
  const meta = log.metadata || {};
  const diffCount = meta.diff?.length || 0;
  const isRestore = meta.is_restore === true;

  return (
    <AccordionItem 
      value={log.id} 
      className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:border-blue-100 hover:shadow-md"
    >
      <AccordionTrigger className="px-5 py-4 hover:no-underline">
        <div className="flex w-full items-center gap-4 text-left">
          <Avatar className="h-10 w-10 border-2 border-slate-50">
            <AvatarImage src={log.profiles?.avatar_url || ""} />
            <AvatarFallback className="bg-blue-50 text-blue-600">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">
                {log.profiles?.full_name || "Unknown Agent"}
              </span>
              {isRestore && (
                <Badge className="bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100">
                  <RotateCcw className="mr-1 h-3 w-3" /> คืนค่าเดิม
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              <span>
                {format(new Date(log.created_at), "d MMM yyyy • HH:mm", { locale: th })}
                {" "}({formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: th })})
              </span>
            </div>
          </div>

          <div className="mr-4 text-right">
            <Badge variant="secondary" className="bg-slate-50 text-slate-600">
              {diffCount} รายการที่เปลี่ยน
            </Badge>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="border-t border-slate-50 bg-slate-50/30 px-5 pb-5 pt-4">
        <div className="space-y-6">
          {/* Summary Chips */}
          <div className="flex flex-wrap gap-2">
            {meta.diff?.map((change: string, idx: number) => {
              const deltaMatch = change.match(/\(([+-]\d+ words)\)/);
              const deltaText = deltaMatch ? deltaMatch[1] : null;
              const cleanChange = deltaMatch ? change.replace(deltaMatch[0], "").trim() : change;

              return (
                <div 
                  key={idx} 
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium shadow-sm transition-transform hover:scale-105",
                    change.includes("เพิ่ม") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                    change.includes("ลบ") ? "bg-rose-50 text-rose-700 border border-rose-100" :
                    "bg-white text-blue-700 border border-blue-100"
                  )}
                >
                  {change.includes("ราคา") && <TrendingDown className="h-3 w-3" />}
                  {cleanChange}
                  {deltaText && <span className="text-[10px] opacity-70 font-bold ml-1">{deltaText}</span>}
                </div>
              );
            })}
          </div>

          {/* Visual Asset Section (Super-Premium Imaging) */}
          {meta.image_changes && (
            <div className="space-y-2">
              <h5 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <ImageIcon className="h-3 w-3" /> การจัดการรูปภาพ (Asset Tracking)
              </h5>
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
                {meta.image_changes.added?.map((url: string, idx: number) => (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border-2 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)] bg-white">
                    <img src={url} alt="Added" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                    <div className="absolute right-1 top-1 rounded-full bg-emerald-500 p-0.5 text-white shadow-sm">
                      <PlusCircle className="h-3.5 w-3.5" />
                    </div>
                  </div>
                ))}
                {meta.image_changes.removed?.map((url: string, idx: number) => (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-rose-200 opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0 bg-white">
                    <img src={url} alt="Removed" className="h-full w-full object-cover" />
                    <div className="absolute right-1 top-1 rounded-full bg-rose-500 p-0.5 text-white shadow-sm">
                      <MinusCircle className="h-3.5 w-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Diff Table */}
          {meta.changes && (
            <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 border-b">
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wider">ฟิลด์</th>
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wider">ค่าเดิม</th>
                    <th className="px-0 py-2.5 text-center w-8"></th>
                    <th className="px-4 py-2.5 font-bold uppercase tracking-wider">ค่าใหม่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {Object.entries(meta.changes as Record<string, { old: any; new: any }>).map(([key, vals]) => (
                    <ChangeRow 
                      key={key} 
                      label={key} 
                      oldValue={vals.old} 
                      newValue={vals.new} 
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <RestoreButton propertyId={propertyId} logId={log.id} />
            <div className="text-[10px] text-slate-400 italic">
              ID: {log.id}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function ChangeRow({ label, oldValue, newValue }: { label: string; oldValue: any; newValue: any }) {
  const [showModal, setShowModal] = useState(false);
  const isDescription = label.includes("description");
  
  const keyToLabel = (key: string) => {
    const mapping: Record<string, string> = {
      price: "ราคาขาย",
      original_price: "ราคาตั้งขาย",
      rental_price: "ราคาเช่า",
      original_rental_price: "ราคาตั้งเช่า",
      status: "สถานะ",
      listing_type: "ประกาศ",
      property_type: "ชนิดทรัพย์",
      title: "ชื่อทรัพย์",
      title_en: "ชื่อทรัพย์ (EN)",
      description: "รายละเอียด",
      description_en: "รายละเอียด (EN)",
      owner_id: "เจ้าของ",
      assigned_to: "ผู้ดูแล",
      commission_sale_percentage: "คอมฯ ขาย (%)",
      commission_rent_months: "คอมฯ เช่าย (เดือน)",
      total_units: "ยูนิตทั้งหมด",
      sold_units: "ขายออกแล้ว",
      bedrooms: "ห้องนอน",
      bathrooms: "ห้องน้ำ",
      size_sqm: "พื้นที่ (ตร.ม.)",
      floor: "ชั้น",
      address_line1: "ที่อยู่/โครงการ",
      google_maps_link: "ลิงก์แผนที่",
      images: "รูปภาพ",
      feature_ids: "ฟีเจอร์",
      agent_ids: "ทีทีมเอเจนท์",
      is_exclusive: "Exclusive",
      requires_ai_review: "รอ AI ตรวจ",
      is_pet_friendly: "เลี้ยงสัตว์ได้",
      is_fully_furnished: "เฟอร์ครบ",
      is_renovated: "รีโนเวท",
      verified: "ยืนยันแล้ว",
      province: "จังหวัด",
      district: "เขต/อำเภอ"
    };
    return mapping[key] || key;
  };

  const formatVal = (val: any) => {
    if (val === null || val === undefined) return <span className="text-slate-300 italic">N/A</span>;
    if (Array.isArray(val)) {
      if (val.length === 0) return <span className="text-slate-300 italic">ว่าง</span>;
      return <Badge variant="secondary" className="font-mono text-[10px]">{val.length} รายการ</Badge>;
    }
    if (typeof val === "boolean") return val ? <Badge className="bg-emerald-50 text-emerald-600 border-none">ใช่</Badge> : "ไม่ใช่";
    
    const str = String(val);
    if (str.length > 50) return str.slice(0, 50) + "...";
    return str;
  };

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-3 font-medium text-slate-700 w-1/4">
        <div className="flex items-center gap-2">
          {keyToLabel(label)}
          {isDescription && (
            <button 
              onClick={() => setShowModal(true)}
              className="text-blue-500 hover:text-blue-700 transition-colors p-1"
              title="เปรียบเทียบเนื้อหา"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-slate-500 truncate max-w-[150px]">{formatVal(oldValue)}</td>
      <td className="py-3 text-center px-0">
        <ArrowRight className="h-3 w-3 text-slate-300" />
      </td>
      <td className="px-4 py-3 text-blue-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
        {formatVal(newValue)}
        {isDescription && showModal && (
          <DiffModal 
            isOpen={showModal} 
            onClose={() => setShowModal(false)}
            label={keyToLabel(label)}
            oldVal={oldValue}
            newVal={newValue}
          />
        )}
      </td>
    </tr>
  );
}

function DiffModal({ isOpen, onClose, label, oldVal, newVal }: { 
  isOpen: boolean; 
  onClose: () => void; 
  label: string;
  oldVal: string;
  newVal: string;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl p-0 border-none shadow-2xl bg-white">
        <div className="p-6 border-b bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-500" />
              Sentinel Side-by-Side: {label}
            </h3>
            <p className="text-xs text-slate-500 mt-1">เปรียบเทียบเนื้อหาก่อนและหลังแก้ไข (Visual Character Diff)</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6 min-h-[400px]">
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between px-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-rose-500 px-3 py-1 bg-rose-50 rounded-full">เวอร์ชันก่อนหน้า</h4>
              <span className="text-[10px] text-slate-400 italic">{oldVal?.length || 0} characters</span>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap h-[400px] overflow-y-auto font-serif">
              {oldVal || "ไม่มีข้อมูลเดิม"}
            </div>
          </div>
          
          <div className="hidden md:block w-px bg-slate-100 self-stretch" />
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between px-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 px-3 py-1 bg-emerald-50 rounded-full">เวอร์ชันอัปเดต</h4>
              <span className="text-[10px] text-slate-400 italic">{newVal?.length || 0} characters</span>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-blue-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] text-sm leading-relaxed text-slate-800 whitespace-pre-wrap h-[400px] overflow-y-auto font-serif font-medium">
              {newVal || "ไม่มีข้อมูลใหม่"}
            </div>
          </div>
        </div>

        <div className="p-5 bg-slate-50 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="rounded-xl px-6">ปิด</Button>
          <Button onClick={onClose} className="rounded-xl px-8 bg-blue-600 hover:bg-blue-700">ยืนยันความถูกต้อง</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RestoreButton({ propertyId, logId }: { propertyId: string; logId: string }) {
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const res = await restorePropertyVersionAction(propertyId, logId);
      if (res.success) {
        toast.success("คืนค่าข้อมูลสำเร็จ! กำลังรีเฟรชหน้าจอ...");
        setTimeout(() => {
          window.location.reload(); 
        }, 1500);
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการคืนค่าข้อมูล");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-2 border-orange-200 bg-orange-50/50 text-orange-700 hover:bg-orange-100/50 hover:text-orange-800 transition-all rounded-lg"
          disabled={isRestoring}
        >
          <RotateCcw className={cn("h-3.5 w-3.5", isRestoring && "animate-spin")} />
          Restore Version
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" /> ยืนยันการคืนค่าข้อมูล?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600">
            ระบบจะดึงข้อมูลจากจุดนี้ไปเขียนทับข้อมูลปัจจุบัน 
            การดำเนินการนี้จะสร้างรายการ Audit ใหม่ และข้อมูลปัจจุบันจะถูกเก็บไว้ในประวัติ
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <p className="text-xs text-slate-500 italic">
            💡 "ระบบ Restore ของ Sentinel จะทำการตรวจสอบประเภทข้อมูล (Dry Run) ก่อนเขียนทับจริงเพื่อความปลอดภัย 100%"
          </p>
        </div>
        <AlertDialogFooter className="gap-2 sm:gap-1">
          <AlertDialogCancel className="rounded-xl border-slate-200">ยกเลิก</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleRestore}
            className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white border-none"
          >
            ยืนยันการคืนค่า
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
