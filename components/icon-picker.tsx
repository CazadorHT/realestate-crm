"use client";

import * as React from "react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DynamicIcon } from "./dynamic-icon";
import { Input } from "@/components/ui/input";

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const allIcons = Object.keys(dynamicIconImports) as string[];

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filteredIcons = React.useMemo(() => {
    if (!search) return allIcons;
    return allIcons.filter((icon) =>
      icon.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search]);

  // Infinite scroll state
  const [limit, setLimit] = React.useState(100);
  const observerTarget = React.useRef<HTMLDivElement>(null);

  const displayedIcons = React.useMemo(() => {
    return filteredIcons.slice(0, limit);
  }, [filteredIcons, limit]);

  React.useEffect(() => {
    // Reset limit when search changes
    setLimit(100);
  }, [search]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLimit((prev) => Math.min(prev + 100, filteredIcons.length));
        }
      },
      { threshold: 0.5, rootMargin: "100px" },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [filteredIcons.length]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between px-3 h-10"
        >
          <div className="flex items-center gap-2">
            {value ? (
              <DynamicIcon name={value} className="h-4 w-4 text-blue-600" />
            ) : (
              <span className="text-slate-400">เลือกไอคอน...</span>
            )}
            <span className="truncate text-sm text-slate-700">
              {value || "เลือกไอคอน"}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ค้นหาไอคอน..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="h-[300px] overflow-y-auto p-2">
          {displayedIcons.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">
              ไม่พบไอคอน
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-1">
              {displayedIcons.map((iconName) => (
                <button
                  key={iconName}
                  onClick={() => {
                    onChange(iconName);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-md hover:bg-slate-100 transition-colors aspect-square gap-1",
                    value === iconName &&
                      "bg-blue-50 text-blue-600 ring-2 ring-blue-100",
                  )}
                  title={iconName}
                >
                  <DynamicIcon name={iconName} className="h-5 w-5" />
                </button>
              ))}
            </div>
          )}
          {limit < filteredIcons.length && (
            <div
              ref={observerTarget}
              className="py-2 text-center text-xs text-slate-400 border-t mt-2"
            >
              Loading more...
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
