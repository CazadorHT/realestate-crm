"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight, Check, LucideIcon } from "lucide-react";
import { IconType } from "react-icons";

interface Option {
  id: string;
  label: string;
  count?: number | null;
}

interface GroupedOption {
  label: string;
  isGroup: true;
  options: Option[];
}

interface MobileFilterSheetProps {
  title: string;
  placeholder: string;
  value: string;
  options: (Option | GroupedOption)[];
  onSelect: (value: string) => void;
  className?: string;
  selectedLabel?: string;
  icon?: LucideIcon | IconType;
  iconColor?: string;
}

export function MobileFilterSheet({
  title,
  placeholder,
  value,
  options,
  onSelect,
  className,
  selectedLabel,
  icon: Icon,
  iconColor = "text-slate-400",
}: MobileFilterSheetProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            "w-full h-12 flex mt-3 items-center justify-between px-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all text-sm font-medium",
            className
          )}
        >
          <div className="flex items-center gap-2.5">
            {Icon && <Icon className={cn("h-4 w-4", iconColor)} />}
            <span className={selectedLabel ? "text-slate-900 font-medium" : "text-slate-400"}>
              {selectedLabel || placeholder}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[75vh] p-0 rounded-t-3xl border-t-0 flex flex-col bg-slate-50">
        <SheetHeader className="px-6 py-5 border-b border-slate-100 bg-white rounded-t-3xl shrink-0">
          <SheetTitle className="text-xl font-medium text-slate-900 flex items-center gap-3">
            {Icon && <Icon className={cn("h-6 w-6", iconColor)} />}
            {title}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4 pb-12">
            {options.map((opt, i) => {
              if ("isGroup" in opt && opt.isGroup) {
                return (
                  <div key={`group-${i}`} className="space-y-2">
                    <div className="px-2 py-1 text-[11px] font-medium text-slate-400 uppercase tracking-widest">
                      {opt.label}
                    </div>
                    <div className="grid gap-2">
                      {opt.options.map((subOpt) => (
                        <FilterItem
                          key={subOpt.id}
                          label={subOpt.label}
                          count={subOpt.count}
                          isSelected={subOpt.id === value}
                          onClick={() => {
                            onSelect(subOpt.id);
                            setOpen(false);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <FilterItem
                  key={(opt as Option).id}
                  label={(opt as Option).label}
                  count={(opt as Option).count}
                  isSelected={(opt as Option).id === value}
                  onClick={() => {
                    onSelect((opt as Option).id);
                    setOpen(false);
                  }}
                />
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FilterItem({
  label,
  count,
  isSelected,
  onClick,
}: {
  label: string;
  count?: number | null;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!isSelected && count === 0}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-2xl transition-all border",
        isSelected
          ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200/50"
          : count === 0
            ? "bg-slate-50 border-transparent text-slate-300 opacity-60 cursor-not-allowed"
            : "bg-white border-transparent text-slate-700 hover:border-slate-200"
      )}
    >
      <span className="font-medium text-[15px]">{label}</span>
      <div className="flex items-center gap-3">
        {count !== undefined && count !== null && (
          <span
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors",
              isSelected 
                ? "bg-white/20 text-white" 
                : count === 0 
                  ? "bg-slate-100 text-slate-400" 
                  : "bg-emerald-50 text-emerald-600"
            )}
          >
            {count}
          </span>
        )}
        {isSelected ? (
          <Check className="h-5 w-5" />
        ) : (
          <div className={cn(
            "w-5 h-5 rounded-full border-2",
            count === 0 ? "border-slate-100" : "border-slate-100"
          )} />
        )}
      </div>
    </button>
  );
}
