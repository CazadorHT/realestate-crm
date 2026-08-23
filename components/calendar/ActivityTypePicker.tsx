"use client";

import { useState } from "react";
import {
  Briefcase,
  Phone,
  MessageCircle,
  Eye,
  Check,
  ChevronRight,
} from "lucide-react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

export type ActivityType = "VIEWING" | "FOLLOW_UP" | "CALL" | "LINE_CHAT";

interface ActivityTypeOption {
  value: ActivityType;
  labelTh: string;
  labelEn: string;
  subLabelTh: string;
  subLabelEn: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const activityOptions: ActivityTypeOption[] = [
  {
    value: "VIEWING",
    labelTh: "เยี่ยมชมทรัพย์",
    labelEn: "Property Viewing",
    subLabelTh: "นัดหมายดูสถานที่จริง",
    subLabelEn: "On-site viewing",
    icon: Eye,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
  },
  {
    value: "FOLLOW_UP",
    labelTh: "ติดตามผล / เจรจา",
    labelEn: "Follow-up / Deal",
    subLabelTh: "เจรจาต่อรอง / ติดตามความคืบหน้า",
    subLabelEn: "Negotiation / progress check",
    icon: Briefcase,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-100",
  },
  {
    value: "CALL",
    labelTh: "โทรศัพท์",
    labelEn: "Phone Call",
    subLabelTh: "โทรติดต่อสื่อสาร",
    subLabelEn: "Direct voice call",
    icon: Phone,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-100",
  },
  {
    value: "LINE_CHAT",
    labelTh: "ไลน์ / แชท",
    labelEn: "Line / Chat",
    subLabelTh: "สนทนาผ่านแอปแชท",
    subLabelEn: "Chat application",
    icon: MessageCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-100",
  },
];

interface ActivityTypePickerProps {
  value: ActivityType;
  onChange: (value: ActivityType) => void;
  name?: string;
}

export function ActivityTypePicker({
  value,
  onChange,
  name,
}: ActivityTypePickerProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [open, setOpen] = useState(false);

  const selected = activityOptions.find((opt) => opt.value === value) || activityOptions[0];

  const handleSelect = (val: ActivityType) => {
    onChange(val);
    setOpen(false);
  };

  const trigger = (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left shadow-sm cursor-pointer",
          "hover:border-blue-400 hover:bg-blue-50/20 active:scale-[0.98]",
          selected.borderColor,
          selected.bgColor,
        )}
      >
        <div className={cn("h-10 w-10 min-w-10 rounded-xl flex items-center justify-center bg-white shadow-xs", selected.color)}>
          <selected.icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <p className="font-bold text-slate-900 text-sm">{isEn ? selected.labelEn : selected.labelTh}</p>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{isEn ? selected.subLabelEn : selected.subLabelTh}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-400" />
      </button>
      <input type="hidden" name={name} value={value} />
    </div>
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={isEn ? "Select Activity Type" : "เลือกประเภทนัดหมาย"}
      description={isEn ? "Specify the appointment type to schedule" : "ระบุประเภทของกิจกรรมที่ต้องทำ"}
      className="sm:max-w-[450px]"
      trigger={trigger}
    >
      <div className="grid grid-cols-1 gap-3 p-4 mb-6">
        {activityOptions.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "group w-full flex items-center gap-4 p-4 rounded-2xl transition-all border relative cursor-pointer",
                isSelected
                  ? cn(opt.bgColor, opt.borderColor, "shadow-md")
                  : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-active:scale-95 shadow-sm",
                isSelected ? "bg-white" : opt.bgColor,
                opt.color
              )}>
                <opt.icon className="h-6 w-6" />
              </div>
              <div className="text-left flex-1">
                <p className={cn("font-bold text-base", isSelected ? "text-slate-900" : "text-slate-700")}>{isEn ? opt.labelEn : opt.labelTh}</p>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{isEn ? opt.subLabelEn : opt.subLabelTh}</p>
              </div>
              {isSelected && (
                <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-white shadow-lg", opt.value === "VIEWING" ? "bg-blue-600" : opt.value === "FOLLOW_UP" ? "bg-amber-500" : opt.value === "CALL" ? "bg-emerald-600" : "bg-green-600")}>
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </ResponsiveDialog>
  );
}

