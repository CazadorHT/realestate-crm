"use client";

import { useState, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import Calendar from "react-calendar";
type CalendarValue = Date | null | [Date | null, Date | null];
import { format, addMonths, differenceInMonths, isValid, parseISO } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { CreateDealInput } from "../schema";
import { useLanguage } from "@/components/providers/LanguageProvider";

// Custom styles for react-calendar
import "./CalendarPicker.css";

interface CalendarPickerProps {
  type: "SALE" | "RENT";
}

export function CalendarPicker({ type }: CalendarPickerProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const form = useFormContext<CreateDealInput>();
  const [open, setOpen] = useState(false);

  const transactionDate = form.watch("transaction_date");
  const transactionEndDate = form.watch("transaction_end_date");
  const durationMonths = form.watch("duration_months");

  // Parse existing dates for the calendar
  const startDate = useMemo(() => 
    transactionDate ? parseISO(transactionDate) : null, 
    [transactionDate]
  );
  
  const endDate = useMemo(() => 
    transactionEndDate ? parseISO(transactionEndDate) : null, 
    [transactionEndDate]
  );

  const value = useMemo(() => {
    if (type === "SALE") return startDate || new Date();
    if (startDate && endDate) return [startDate, endDate] as [Date, Date];
    return startDate || new Date();
  }, [type, startDate, endDate]);

  const handleDateChange = (val: CalendarValue) => {
    // Note: react-calendar types are complex, but we narrow them here for safety
    if (!val) return;
    
    // If a date is manually selected, uncheck "Undetermined"
    form.setValue("undetermined_date", false);

    if (type === "SALE" && val instanceof Date) {
      form.setValue("transaction_date", format(val, "yyyy-MM-dd"), { shouldDirty: true, shouldValidate: true });
      setOpen(false);
    } else if (type === "RENT") {
      if (Array.isArray(val)) {
        const [start, end] = val;
        if (start && end) {
          form.setValue("transaction_date", format(start, "yyyy-MM-dd"));
          form.setValue("transaction_end_date", format(end, "yyyy-MM-dd"));
          
          // Auto-calculate duration months
          const months = differenceInMonths(end, start);
          form.setValue("duration_months", months, { shouldDirty: true, shouldValidate: true });
        }
      } else if (val instanceof Date) {
        // Single date picked in RENT mode (start date)
        form.setValue("transaction_date", format(val, "yyyy-MM-dd"), { shouldDirty: true, shouldValidate: true });
      }
    }
  };

  const setDuration = (years: number) => {
    if (!startDate || !isValid(startDate)) return;
    
    // Explicitly uncheck "Undetermined" when setting duration
    form.setValue("undetermined_date", false, { shouldDirty: true });
    
    const months = years * 12;
    const end = addMonths(startDate, months);
    form.setValue("transaction_end_date", format(end, "yyyy-MM-dd"), { shouldDirty: true });
    form.setValue("duration_months", months, { shouldDirty: true });
  };

  const getLabel = () => {
    if (!transactionDate) return isEn ? "Select Date" : "เลือกวันที่";
    if (type === "SALE") return format(startDate!, "dd/MM/yyyy");
    if (transactionDate && transactionEndDate) {
      return `${format(startDate!, "dd/MM/yyyy")} - ${format(endDate!, "dd/MM/yyyy")}`;
    }
    return format(startDate!, "dd/MM/yyyy");
  };

  return (
    <div className="space-y-3">
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={type === "SALE" ? (isEn ? "Select Transfer Date" : "เลือกวันที่โอน") : (isEn ? "Rental Term" : "ช่วงเวลาเช่า")}
        description={type === "SALE" ? (isEn ? "Specify deal closing date" : "กำหนดวันที่ปิดการขาย") : (isEn ? "Select start and end dates of lease" : "เลือกวันเริ่มต้นและสิ้นสุดสัญญา")}
        trigger={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full h-14 px-5 rounded-2xl border-2 flex items-center justify-between transition-all duration-300 cursor-pointer",
              transactionDate
                ? "border-blue-100 bg-blue-50/20 hover:bg-blue-50 shadow-sm"
                : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-200"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-100 text-blue-600">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-start leading-none gap-0.5">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
                  {type === "SALE" ? (isEn ? "Ownership Transfer Date" : "วันโอนกรรมสิทธิ์") : (isEn ? "Contract Period" : "ช่วงเวลาสัญญา")}
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  {getLabel()}
                </span>
              </div>
            </div>
            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
               <ChevronRight className="h-4 w-4" />
            </div>
          </Button>
        }
        footer={
          <div className="flex gap-2 w-full">
             <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 h-12 rounded-xl font-bold cursor-pointer">
               {isEn ? "Cancel" : "ยกเลิก"}
             </Button>
             <Button onClick={() => setOpen(false)} className="flex-1 h-12 rounded-xl bg-blue-600 font-bold cursor-pointer">
               {isEn ? "Done" : "ตกลง"}
             </Button>
          </div>
        }
      >
        <div className="p-4 space-y-6 flex flex-col items-center">
          {/* Calendar Picker */}
          <div className="w-full bg-white rounded-3xl p-2 shadow-inner border border-slate-50 overflow-hidden">
            <Calendar
              onChange={handleDateChange}
              value={value}
              selectRange={type === "RENT"}
              className="react-calendar-dealform"
              locale={isEn ? "en-US" : "th-TH"}
              prev2Label={null}
              next2Label={null}
              prevLabel={<ChevronLeft className="h-5 w-5" />}
              nextLabel={<ChevronRight className="h-5 w-5" />}
            />
          </div>

          {/* Quick Stats / Actions for Rent */}
          {type === "RENT" && (
            <div className="w-full space-y-4">
              <div className="flex flex-col gap-3">
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                   {isEn ? "Quick Term Selection" : "เลือกตามจำนวนปี"}
                 </h4>
                 <div className="grid grid-cols-3 gap-2">
                   {[1, 2, 3].map((year) => (
                      <Button
                        key={year}
                        type="button"
                        variant={durationMonths === year * 12 ? "default" : "outline"}
                        className={cn(
                          "h-12 rounded-2xl font-bold transition-all cursor-pointer",
                          durationMonths === year * 12 
                            ? "bg-blue-600 shadow-lg shadow-blue-100 text-white" 
                            : "border-slate-100 bg-slate-50 text-slate-600"
                        )}
                        onClick={() => setDuration(year)}
                      >
                        {isEn ? `${year} Yr${year > 1 ? "s" : ""}` : `${year} ปี`}
                      </Button>
                   ))}
                 </div>
              </div>

              {transactionDate && transactionEndDate && (
                <div className="p-4 bg-emerald-50 rounded-2xl flex items-center justify-between border border-emerald-100/50">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600">
                         <Clock className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col leading-none">
                        <span className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-widest leading-none mb-1">
                          {isEn ? "Actual Duration" : "ระยะเวลาตามจริง"}
                        </span>
                        <span className="text-sm font-bold text-emerald-900">
                          {(() => {
                            const yrs = Math.floor((durationMonths || 0) / 12);
                            const mos = (durationMonths || 0) % 12;
                            if (yrs > 0 && mos > 0) {
                              return isEn ? `${yrs} yr ${mos} mo` : `${yrs} ปี ${mos} เดือน`;
                            } else if (yrs > 0) {
                              return isEn ? `${yrs} yr${yrs > 1 ? "s" : ""}` : `${yrs} ปี`;
                            } else {
                              return isEn ? `${mos} mo` : `${mos} เดือน`;
                            }
                          })()}
                        </span>
                      </div>
                   </div>
                   <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
                      <Check className="h-4 w-4" />
                   </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ResponsiveDialog>
    </div>
  );
}

