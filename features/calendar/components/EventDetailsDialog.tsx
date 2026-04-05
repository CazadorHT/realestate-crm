"use client";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarEvent } from "../queries";
import {
  Calendar,
  Clock,
  FileText,
  User,
  Building2,
  Tag,
  PlayCircle,
  StopCircle,
  AlertTriangle,
  Banknote,
  Phone,
  MessageCircle,
  Briefcase,
  Trash2,
  Edit,
  ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  deleteLeadActivityAction,
  updateLeadActivityAction,
} from "@/features/leads/actions";
import { Button } from "@/components/ui/button";
import { LeadActivityDialog } from "@/components/leads/LeadActivityDialog";
import { LeadActivityFormValues } from "@/lib/types/leads";
import { Loader2, StickyNote } from "lucide-react";
import { FaCalendarPlus } from "react-icons/fa";

// Helper for formatting Thai currency
const formatThaiCurrency = (value: number): string => {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface EventDetailsDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
}

export function EventDetailsDialog({
  event,
  open,
  onClose,
}: EventDetailsDialogProps) {
  const router = useRouter();

  if (!event) return null;

  const startDate = new Date(event.start);

  const handleAddToGoogleCalendar = () => {
    const title = encodeURIComponent(event.title);
    const startObj = new Date(event.start);
    const endObj = new Date(startObj.getTime() + 60 * 60 * 1000); // Default 1 hour
    
    const formatGCalDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const dates = `${formatGCalDate(startObj)}/${formatGCalDate(endObj)}`;
    
    const details = encodeURIComponent(
      `🏡 ${event.title}\n🏠 ทรัพย์สิน: ${event.meta?.propertyTitle || "-"}\n📝 บันทึก: ${event.meta?.note || "-"}\n🔗 ลิงก์ CRM: ${window.location.origin}${event.meta?.leadId ? `/protected/leads/${event.meta.leadId}` : ""}`
    );
    
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
    window.open(gCalUrl, "_blank");
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case "viewing": return "นัดหมายชมทรัพย์";
      case "follow_up": return "ติดตามผล / เจรจา";
      case "call": return "โทรศัพท์ประสานงาน";
      case "line_chat": return "แชทผ่าน LINE";
      case "contract_start": return "เริ่มต้นสัญญา";
      case "contract_end": return "สัญญาหมดอายุ";
      case "early_termination": return "ยุติสัญญาก่อนกำหนด";
      case "deal_closing": return "ปิดดีลสำเร็จ";
      default: return "กิจกรรม";
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "viewing": return "text-blue-600 bg-blue-50/50 border-blue-100";
      case "follow_up": return "text-amber-600 bg-amber-50/50 border-amber-100";
      case "call": return "text-green-600 bg-green-50/50 border-green-100";
      case "line_chat": return "text-green-700 bg-emerald-50/50 border-emerald-100";
      case "contract_start": return "text-emerald-600 bg-emerald-50/50 border-emerald-100";
      case "contract_end": return "text-red-600 bg-red-50/50 border-red-100";
      case "early_termination": return "text-orange-600 bg-orange-50/50 border-orange-100";
      case "deal_closing": return "text-purple-600 bg-purple-50/50 border-purple-100";
      default: return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  const isLeadActivity =
    event.type === "viewing" ||
    event.type === "follow_up" ||
    event.type === "call" ||
    event.type === "line_chat";

  const isContractEvent =
    event.type === "contract_start" ||
    event.type === "contract_end" ||
    event.type === "early_termination";

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(val) => !val && onClose()}
      title={
        <div className="space-y-2 text-left pb-2">
          <Badge variant="outline" className={cn("px-2.5 py-0.5 rounded-full font-semibold text-[11px] uppercase tracking-wider", getEventColor(event.type))}>
            {getEventLabel(event.type)}
          </Badge>
          <div className="text-2xl font-semibold leading-tight text-slate-900 tracking-tight">
            {event.title}
          </div>
        </div>
      }
      className="sm:max-w-[480px]"
    >
      <div className="space-y-6 py-4 text-left px-6">
        {/* 1. Time Section - Premium Info Box */}
        <div className="flex items-center gap-4 group">
          <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm transition-transform group-hover:scale-110">
            <Calendar className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">วันและเวลา</p>
            <div className="flex flex-col">
              <p className="text-base font-semibold text-slate-900 leading-none mb-1">
                {formatDate(startDate)}
              </p>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 font-semibold bg-slate-50 px-2 py-0.5 rounded-lg w-fit">
                <Clock className="h-3.5 w-3.5" />
                {format(startDate, "HH:mm")} น.
              </div>
            </div>
          </div>
        </div>

        {/* 2. Contract Details (if applicable) */}
        {isContractEvent && event.meta && (
          <div className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-4">
             <div className="flex items-center gap-3">
               <FileText className="h-4 w-4 text-slate-400" />
               <h4 className="text-sm font-semibold text-slate-700">ข้อมูลสัญญา</h4>
             </div>
             <div className="grid grid-cols-2 gap-4">
               {event.meta?.contractNumber && (
                 <div>
                   <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-0.5">เลขที่สัญญา</span>
                   <span className="text-sm font-semibold text-slate-900">{event.meta?.contractNumber}</span>
                 </div>
               )}
               {event.meta?.leaseTermMonths && (
                 <div>
                   <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-0.5">ระยะเวลา</span>
                   <span className="text-sm font-semibold text-slate-900">{event.meta?.leaseTermMonths} เดือน</span>
                 </div>
               )}
               {event.meta?.rentPrice && (
                 <div>
                   <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-0.5">ค่าเช่า / ราคา</span>
                   <span className="text-sm font-semibold text-emerald-600">{formatThaiCurrency(event.meta?.rentPrice)}</span>
                 </div>
               )}
             </div>
             
             {event.meta?.startDate && event.meta?.endDate && (
               <div className="flex items-center gap-4 pt-2 border-t border-slate-200/50">
                 <div className="flex-1">
                   <span className="text-[10px] text-slate-400 font-semibold uppercase block">เริ่ม</span>
                   <span className="text-xs font-semibold">{formatDate(new Date(event.meta?.startDate))}</span>
                 </div>
                 <div className="h-4 w-px bg-slate-200" />
                 <div className="flex-1">
                   <span className="text-[10px] text-slate-400 font-semibold uppercase block">สิ้นสุด</span>
                   <span className="text-xs font-semibold text-rose-500">{formatDate(new Date(event.meta?.endDate))}</span>
                 </div>
               </div>
             )}
          </div>
        )}

        {/* 3. Lead Info */}
        {event.meta?.leadId && (
          <div className="flex items-center gap-4 group">
            <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-sm transition-transform group-hover:scale-110">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">ลูกค้า (Lead)</p>
              <p className="text-base font-semibold text-slate-900">
                {event.meta?.leadName || event.title.replace("นัดชม: ", "")}
              </p>
            </div>
          </div>
        )}

        {/* 4. Property Info Card */}
        {event.meta?.propertyTitle && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 px-1">
               <Building2 className="h-3.5 w-3.5 text-orange-500" />
               <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">ข้อมูลทรัพย์สิน</h4>
            </div>
            <div className="group relative overflow-hidden rounded-4xl border border-slate-100 bg-white p-2 shadow-sm hover:shadow-md transition-all duration-300">
              {event.meta?.propertyImage ? (
                <div className="flex gap-4 items-center">
                  <div className="h-20 w-24 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                    <img src={event.meta?.propertyImage} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Res" />
                  </div>
                  <div className="pr-4">
                    <p className="text-sm font-semibold text-slate-900 line-clamp-2 leading-relaxed tracking-tight">{event.meta?.propertyTitle}</p>
                    {event.meta?.rentPrice && (
                       <p className="text-xs font-semibold text-emerald-600 mt-1">{formatThaiCurrency(event.meta?.rentPrice)}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50/50 rounded-2xl">
                  <p className="text-sm font-semibold text-slate-900">{event.meta?.propertyTitle}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. Notes */}
        {event.meta?.note && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 px-1">
               <StickyNote className="h-3.5 w-3.5 text-amber-500" />
               <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">บันทึก</h4>
            </div>
            <div className="relative p-5 bg-amber-50/20 rounded-[1.5rem] border border-amber-100/50 shadow-inner">
              <div className="absolute top-0 right-4 -translate-y-1/2 bg-white px-2 py-0.5 border border-amber-100 rounded-full">
                 <FileText className="h-3 w-3 text-amber-500" />
              </div>
              <p className="text-sm text-slate-700 font-medium italic leading-relaxed">
                "{event.meta?.note}"
              </p>
            </div>
          </div>
        )}

        {/* 6. Footer Actions Container */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
             {isLeadActivity && event.meta?.leadId ? (
               <div className="flex flex-1 gap-2">
                 <Button
                    onClick={() => router.push(`/protected/leads/${event.meta?.leadId}`)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    ไปที่ลีด
                  </Button>
                  <LeadActivityDialog
                    leadId={event.meta?.leadId!}
                    title="แก้ไขนัดหมาย"
                    submitLabel="บันทึกการแก้ไข"
                    trigger={
                      <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 text-slate-600 shrink-0 shadow-sm hover:bg-slate-50">
                        <Edit className="h-4 w-4" />
                      </Button>
                    }
                    defaultValues={{
                      activity_type: event.type.toUpperCase() as any,
                      note: event.meta?.note || "",
                      property_id: event.meta?.propertyId || null,
                    }}
                    initialProperty={
                      event.meta?.propertyId
                        ? { id: event.meta.propertyId!, title: event.meta.propertyTitle || "" }
                        : null
                    }
                    onSubmitAction={async (values) => {
                       const result = await updateLeadActivityAction({
                        activityId: event.id,
                        leadId: event.meta?.leadId!,
                        values,
                      });
                      if (result.success) {
                        toast.success("แก้ไขนัดหมายเรียบร้อย");
                        onClose();
                        router.refresh();
                      } else {
                        toast.error(result.error || "แก้ไขไม่สำเร็จ");
                      }
                    }}
                  />
               </div>
             ) : (
               <Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-2xl font-bold">ปิดหน้าต่าง</Button>
             )}

             <Button
                variant="outline"
                onClick={handleAddToGoogleCalendar}
                className="flex-1 h-12! rounded-xl border-slate-200 text-slate-600 shadow-sm bg-indigo-50/30 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
              >
                <FaCalendarPlus className="h-5 w-5" />
                <span className="text-sm font-semibold">เพิ่มลงใน Google Calendar</span>
              </Button>
          </div>

          {isLeadActivity && event.meta?.leadId && (
             <div className="flex justify-center">
               <EventDeleteButton eventId={event.id} leadId={event.meta.leadId} onSuccess={onClose} />
             </div>
          )}
        </div>
      </div>
    </ResponsiveDialog>
  );
}

function EventDeleteButton({ eventId, leadId, onSuccess }: { eventId: string; leadId: string; onSuccess: () => void }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteLeadActivityAction({
        activityId: eventId,
        leadId,
      });
      if (result.success) {
        toast.success("ลบนัดหมายเรียบร้อย");
        setOpen(false);
        onSuccess();
        router.refresh();
      } else {
        toast.error(result.error || "ลบไม่สำเร็จ");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title="ลบนัดหมาย?"
      description="การลบจะไม่สามารถเรียกคืนข้อมูลได้ คุณแน่ใจหรือไม่?"
      trigger={
        <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-8 font-semibold rounded-lg px-3">
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          ยกเลิกนัดหมายนี้
        </Button>
      }
      footer={
        <div className="flex gap-3 w-full">
           <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 rounded-xl h-12 font-semibold bg-slate-50 border-0 shadow-none">ยกเลิก</Button>
           <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="flex-1 rounded-xl h-12 font-semibold shadow-lg shadow-rose-100">
              {isDeleting ? "กำลังลบ..." : "ยืนยันการลบ"}
           </Button>
        </div>
      }
    />
  );
}
