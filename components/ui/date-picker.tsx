"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export interface DatePickerProps {
  value?: string; // ISO string (YYYY-MM-DD)
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "วว/ดด/ปปปป",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  // Sync internal input value with external value prop
  React.useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (isValid(date)) {
        const formatted = format(date, "dd/MM/yyyy");
        if (inputValue !== formatted) {
          setInputValue(formatted);
        }
      } else {
        setInputValue("");
      }
    } else {
      setInputValue("");
    }
  }, [value, inputValue]);

  const date = value ? new Date(value) : undefined;

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onChange(format(selectedDate, "yyyy-MM-dd"));
      setOpen(false);
    } else {
      onChange("");
      setOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Auto-masking logic
    let clean = val.replace(/\D/g, "").slice(0, 8);
    if (clean.length > 4) {
      clean = `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4)}`;
    } else if (clean.length > 2) {
      clean = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    setInputValue(clean);

    if (clean.length === 10) {
      const parsed = parse(clean, "dd/MM/yyyy", new Date());
      if (isValid(parsed)) {
        onChange(format(parsed, "yyyy-MM-dd"));
      }
    } else if (clean.length === 0) {
      onChange("");
    }
  };

  return (
    <div className={cn("relative flex w-full items-center", className)}>
      <Input
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        className="pr-10"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 hover:bg-transparent"
          >
            <CalendarIcon className="h-4 w-4 text-slate-400" />
            <span className="sr-only">เปิดปฏิทิน</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
          />
          <div className="flex items-center justify-between px-3 py-2 border-t bg-slate-50/50">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-blue-600 font-bold hover:bg-blue-50"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-blue-600 font-bold hover:bg-blue-50"
              onClick={() => {
                const today = new Date();
                onChange(format(today, "yyyy-MM-dd"));
                setOpen(false);
              }}
            >
              Today
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
