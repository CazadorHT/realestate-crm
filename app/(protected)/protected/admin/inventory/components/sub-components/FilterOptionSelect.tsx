"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown,
  Check
} from "lucide-react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * 🛡️ Elite FilterOptionSelect
 * A specialized select replacement that uses ResponsiveDialog (Drawer on mobile)
 * Extracted for architectural hardening 10/10.
 */
interface FilterOptionSelectProps {
  label: string;
  value: string;
  options: { 
    label: string; 
    value: string; 
    icon?: React.ReactNode;
    count?: number;
  }[];
  onSelect: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

export function FilterOptionSelect({ label, value, options, onSelect, placeholder, icon }: FilterOptionSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="space-y-2">
      <Label className="text-slate-500 font-semibold text-[10px] uppercase tracking-widest px-1">
        {label}
      </Label>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={
          <div className="flex items-center gap-2">
            {icon}
            <span>เลือก{label}</span>
          </div>
        }
        trigger={
          <Button
            variant="outline"
            className="w-full h-11 justify-between px-4 rounded-xl border-slate-200 bg-white hover:bg-slate-50 transition-all font-medium text-slate-700 shadow-xs"
          >
            <div className="flex items-center gap-2 truncate">
              {icon && <span className="text-slate-400">{icon}</span>}
              <span className={cn(!selectedOption && "text-slate-400")}>
                {selectedOption ? selectedOption.label : placeholder || "เลือก..."}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-300 shrink-0" />
          </Button>
        }
      >
        <div className="p-2 md:p-1 grid grid-cols-1 md:grid-cols-2 gap-2">
          {options.map((opt) => (
            <Button
              key={opt.value}
              variant="ghost"
              className={cn(
                "w-full h-14 justify-between px-3 rounded-xl transition-all border border-transparent",
                value === opt.value 
                  ? "bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100 hover:text-blue-700" 
                  : "text-slate-600 hover:bg-slate-50 hover:border-slate-100"
              )}
              onClick={() => {
                onSelect(opt.value);
                setOpen(false);
              }}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {opt.icon && (
                  <div className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
                    value === opt.value ? "bg-blue-100/50 text-blue-600" : "bg-slate-100 text-slate-400"
                  )}>
                    {opt.icon}
                  </div>
                )}
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="font-semibold text-sm truncate w-full">{opt.label}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                {opt.value !== "ALL" && (
                  <div className="flex items-center gap-1.5 bg-white/80 px-1.5 py-0.5 rounded-md border border-slate-200/50 shadow-2xs">
                    <div className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      (opt.count ?? 0) > 0 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" : "bg-slate-300"
                    )} />
                    <span className="text-[10px] font-bold text-slate-500">
                      {opt.count ?? 0}
                    </span>
                  </div>
                )}
                {value === opt.value && <Check className="h-4 w-4 text-blue-600" />}
              </div>
            </Button>
          ))}
        </div>
      </ResponsiveDialog>
    </div>
  );
}
