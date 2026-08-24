"use client";

import React, { useState } from "react";
import { Check, ChevronRight, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useLanguage } from "@/lib/i18n/language-context";

interface Option {
  label: string;
  value: string;
  icon?: React.ReactNode;
  description?: string;
}

interface ResponsiveSelectFieldProps {
  options: Option[];
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  icon?: React.ReactNode;
}

export function ResponsiveSelectField({
  options,
  value,
  onValueChange,
  label,
  placeholder,
  className,
  triggerClassName,
  icon,
}: ResponsiveSelectFieldProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const defaultPlaceholder = placeholder || (isEn ? "Select an option..." : "เลือกรายการ...");
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (val: string) => {
    onValueChange(val);
    setOpen(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 px-1">
        {icon || <LayoutGrid className="h-4 w-4 text-blue-600" />}
        <label className="text-base font-semibold text-slate-900">
          {label}
        </label>
      </div>

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={label}
        description={isEn ? `Please select a ${label.toLowerCase()}` : `กรุณาเลือก${label}ที่ต้องการ`}
        trigger={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full h-14 justify-between border-slate-200 bg-white hover:bg-slate-50 transition-all rounded-2xl font-semibold text-slate-700! shadow-sm px-6 cursor-pointer",
              triggerClassName
            )}
          >
            <div className="flex items-center gap-3">
              {selectedOption?.icon}
              <span>{selectedOption ? selectedOption.label : defaultPlaceholder}</span>
            </div>
            <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform group-hover:translate-x-0.5" />
          </Button>
        }
      >
        <div className="p-2 md:p-4">
          <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-2 pr-2">
            <div className="space-y-2 pb-6">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 text-left group",
                    value === option.value
                      ? "bg-blue-50 border-blue-200 ring-1 ring-blue-100"
                      : "bg-white border-slate-100 hover:border-blue-100 hover:bg-slate-50/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      value === option.value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600"
                    )}>
                      {option.icon || <LayoutGrid className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-sm font-semibold",
                        value === option.value ? "text-blue-900" : "text-slate-700"
                      )}>
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </div>
                  {value === option.value && (
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
