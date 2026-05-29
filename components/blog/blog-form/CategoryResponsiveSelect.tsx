"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

interface CategoryResponsiveSelectProps {
  value: string;
  onValueChange: (val: string) => void;
  categories: { id: string; name: string }[];
}

export function CategoryResponsiveSelect({
  value,
  onValueChange,
  categories,
}: CategoryResponsiveSelectProps) {
  const [open, setOpen] = useState(false);
  const options = [{ id: "General", name: "General" }, ...categories.filter(c => c.name !== "General")];
  const selected = options.find(o => o.name === value) || options[0];

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className="w-full h-11 justify-between border-slate-200 bg-slate-50/50 hover:bg-white transition-all rounded-lg px-4 font-normal"
        >
          <span className={cn(value ? "text-slate-900" : "text-slate-400")}>
            {selected ? selected.name : "เลือกหมวดหมู่"}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </Button>
      }
      title="เลือกหมวดหมู่บทความ"
      className="sm:max-w-[400px] p-0"
    >
      <div className="grid gap-1 p-2 md:p-4 pb-8 md:pb-4 max-h-[60vh] overflow-y-auto">
        {options.map((option) => (
          <Button
            key={option.id}
            type="button"
            variant="ghost"
            className={cn(
              "justify-start h-12 md:h-14 px-4 rounded-xl text-base font-semibold",
              value === option.name && "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
            )}
            onClick={() => {
              onValueChange(option.name);
              setOpen(false);
            }}
          >
            {option.name}
            {value === option.name && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" />}
          </Button>
        ))}
      </div>
    </ResponsiveDialog>
  );
}
