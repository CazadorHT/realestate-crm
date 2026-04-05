"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Calendar,
  Clock,
  User,
  Building2,
  StickyNote,
  Briefcase,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Textarea } from "@/components/ui/textarea";
import { createAppointment } from "@/features/calendar/actions";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn, formatDate } from "@/lib/utils";
import { format } from "date-fns";
import { LeadCombobox } from "@/components/LeadCombobox";
import { PropertyCombobox } from "@/components/PropertyCombobox";
import { ActivityTypePicker, ActivityType } from "@/components/calendar/ActivityTypePicker";
import { TimePicker } from "@/components/calendar/TimePicker";

interface CreateEventDialogProps {
  // We keep props for now but Lead/Property Combobox will also search dynamically
  leads?: { id: string; full_name: string }[];
  properties?: { id: string; title: string }[];
}

export function CreateEventDialog({
}: CreateEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState<Date>();
  
  // Controlled states for Pickers
  const [leadId, setLeadId] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>("none");
  const [activityType, setActivityType] = useState<ActivityType>("VIEWING");
  const [time, setTime] = useState<string>("");

  const handleSubmit = (formData: FormData) => {
    // If propertyId is "none", delete it from formData so backend doesn't try to use it as UUID
    if (formData.get("propertyId") === "none" || !formData.get("propertyId")) {
      formData.delete("propertyId");
    }

    startTransition(async () => {
      try {
        await createAppointment(formData);
        toast.success("สร้างนัดหมายสำเร็จ");
        setOpen(false);
        resetForm();
      } catch (error) {
        toast.error("เกิดข้อผิดพลาดในการสร้างนัดหมาย");
      }
    });
  };

  const resetForm = () => {
    setDate(undefined);
    setLeadId(null);
    setPropertyId("none");
    setActivityType("VIEWING");
    setTime("");
    setStep(1);
  };

  const nextStep = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (step === 1 && !leadId) {
      toast.error("กรุณาเลือกลูกค้าก่อนไปขั้นตอนถัดไป");
      return;
    }
    if (step === 2 && (!date || !time)) {
      toast.error("กรุณาเลือกวันที่และเวลานัดหมาย");
      return;
    }
    setStep(prev => prev + 1);
  };

  const prevStep = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStep(prev => prev - 1);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) resetForm();
      }}
      title={step === 1 ? "เลือกผู้เกี่ยวข้อง" : step === 2 ? "ระบุเวลาและประเภทงาน" : "สรุปข้อมูล"}
      description={`ขั้นตอนที่ ${step} จาก 3`}
      className="sm:max-w-[500px]"
      trigger={
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 rounded-xl px-5 h-11 transition-all active:scale-95">
          <Plus className="h-4 w-4" />
          <span className="font-bold">เพิ่มนัดหมาย</span>
        </Button>
      }
    >
      <div className="flex flex-col h-full">
        {/* Stepper Indicator */}
        <div className="flex items-center px-8 pt-2 pb-6 w-full">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shrink-0",
                step === s ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110" : 
                step > s ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
              )}>
                {step > s ? "✓" : s}
              </div>
              {s < 3 && (
                <div className={cn(
                  "flex-1 h-1 mx-2 rounded-full transition-all duration-300",
                  step > s ? "bg-emerald-500" : "bg-slate-100"
                )} />
              )}
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 3) return;
            const formData = new FormData(e.currentTarget);
            handleSubmit(formData);
          }}
          className="space-y-6 px-6 pb-4 text-left"
        >
          {/* STEP 1: CLIENT & PROPERTY */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid gap-2">
                <Label htmlFor="leadId" className="flex items-center gap-2 text-slate-700 font-bold ml-1">
                  <User className="h-4 w-4 text-blue-500" /> ลูกค้า (Lead) <span className="text-rose-500">*</span>
                </Label>
                <LeadCombobox 
                  name="leadId"
                  value={leadId}
                  onChange={setLeadId}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="propertyId" className="flex items-center gap-2 text-slate-700 font-bold ml-1">
                  <Building2 className="h-4 w-4 text-orange-500" /> ทรัพย์สิน (Optional)
                </Label>
                <PropertyCombobox
                  name="propertyId"
                  value={propertyId === "none" ? null : propertyId}
                  onChange={(val) => setPropertyId(val || "none")}
                />
              </div>
            </div>
          )}

          {/* STEP 2: ACTIVITY & TIME */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid gap-2">
                <Label htmlFor="activityType" className="flex items-center gap-2 text-slate-700 font-bold ml-1">
                  <Briefcase className="h-4 w-4 text-indigo-500" /> ประเภทนัดหมาย
                </Label>
                <ActivityTypePicker
                  name="activityType"
                  value={activityType}
                  onChange={setActivityType}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2 text-slate-700 font-bold ml-1">
                    <Calendar className="h-4 w-4 text-emerald-500" /> วันที่ <span className="text-rose-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-bold h-11 rounded-xl border-slate-200 shadow-sm",
                          !date && "text-slate-400 font-normal",
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4 opacity-70" />
                        {date ? formatDate(date) : "เลือกวันที่"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-slate-100" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        className="p-3"
                      />
                    </PopoverContent>
                  </Popover>
                  <input type="hidden" name="date" value={date ? format(date, "yyyy-MM-dd") : ""} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time" className="flex items-center gap-2 text-slate-700 font-bold ml-1">
                    <Clock className="h-4 w-4 text-purple-500" /> เวลา <span className="text-rose-500">*</span>
                  </Label>
                  <TimePicker name="time" value={time} onChange={setTime} required />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: NOTES & CONFIRM */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid gap-2">
                <Label htmlFor="note" className="flex items-center gap-2 text-slate-700 font-bold ml-1">
                  <StickyNote className="h-4 w-4 text-slate-400" /> บันทึกเพิ่มเติม
                </Label>
                <Textarea 
                  name="note" 
                  placeholder="รายละเอียดนัดหมาย..." 
                  className="rounded-xl border-slate-200 focus:ring-indigo-500/10 min-h-[120px] bg-slate-50/50 p-4 font-medium" 
                />
              </div>
              
              {/* Simple Summary */}
              <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-center gap-4">
                 <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                    <Calendar className="h-6 w-6 text-blue-600" />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">นัดหมายที่คุณกำลังสร้าง</p>
                    <p className="text-sm font-bold text-slate-900 leading-tight">
                      {date ? formatDate(date) : "ยังไม่ระบุวันที่"} เวลา {time || "??:??"} น.
                    </p>
                 </div>
              </div>
            </div>
          )}

          {/* Form Actions (Navigation) */}
          <div className="flex gap-3 pt-6 border-t border-slate-100 mt-auto">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="flex-1 rounded-xl h-12 font-bold text-slate-500 hover:bg-slate-50"
              >
                ย้อนกลับ
              </Button>
            )}
            
            {step < 3 ? (
              <Button
                key="next-btn"
                type="button"
                onClick={nextStep}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-12 shadow-lg shadow-indigo-100 transition-all active:scale-95 translate-y-0"
              >
                ถัดไป
              </Button>
            ) : (
              <Button
                key="save-btn"
                type="submit"
                disabled={isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-12 shadow-lg shadow-emerald-100 transition-all active:scale-95"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกนัดหมาย"
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </ResponsiveDialog>
  );
}
