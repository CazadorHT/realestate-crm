"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Check,
  ChevronsUpDown,
  UserCheck,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

export type AgentPickItem = {
  id: string;
  title: string;
  email?: string | null;
  role?: string | null;
  avatar_url?: string | null;
};

type Props = {
  value: string | null;
  onChangeAction: (value: string | null, picked?: AgentPickItem | null) => void;
  placeholder?: string;
  className?: string;
  agents: { id: string; title: string; email?: string | null; role?: string | null; avatar_url?: string | null }[];
  initialAgent?: AgentPickItem | null;
  required?: boolean;
  name?: string;
};

export function AgentCombobox({
  value,
  onChangeAction,
  placeholder,
  className,
  agents = [],
  initialAgent,
  required,
  name,
}: Props) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const defaultPlaceholder = placeholder || (isEn ? "All Agents" : "พนักงานทั้งหมด");

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const selected = useMemo(() => {
    if (initialAgent && initialAgent.id === value) return initialAgent;
    if (!value || value === "ALL") return null;
    return agents.find((x) => x.id === value) ?? null;
  }, [agents, value, initialAgent]);

  const filteredAgents = useMemo(() => {
    if (!q.trim()) return agents;
    const term = q.toLowerCase().trim();
    return agents.filter(
      (a) =>
        a.title.toLowerCase().includes(term) ||
        (a.email && a.email.toLowerCase().includes(term)),
    );
  }, [agents, q]);

  const handleSelect = (item: AgentPickItem | null) => {
    onChangeAction(item ? item.id : null, item);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeAction(null, null);
  };

  // --- Trigger Button ---
  const trigger = (
    <div className="relative w-full">
      <button
        type="button"
        className={cn(
          "w-full flex items-center gap-2.5 text-left rounded-xl border px-3 h-11 transition-all duration-200 shadow-xs group cursor-pointer",
          "hover:border-indigo-400 hover:bg-indigo-50/20",
          selected
            ? "border-indigo-200 bg-indigo-50/30"
            : "border-slate-200 bg-white",
          className,
        )}
      >
        {/* Icon/Avatar */}
        <div
          className={cn(
            "shrink-0 rounded-lg overflow-hidden h-7 w-7 bg-slate-100 border border-slate-200 flex items-center justify-center transition-all",
            selected && "bg-indigo-100/80 border-indigo-200",
          )}
        >
          {selected?.avatar_url ? (
            <div className="relative h-full w-full">
              <Image
                src={selected.avatar_url}
                alt={selected.title}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
          ) : (
            <UserCheck className={cn("h-3.5 w-3.5 text-slate-400", selected && "text-indigo-600")} />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pr-1">
          {selected ? (
            <p className="font-bold text-slate-900 text-xs truncate leading-normal">
              {selected.title}
            </p>
          ) : (
            <span className="text-slate-400 text-xs font-normal truncate block">
              {defaultPlaceholder}
            </span>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-0.5 shrink-0">
          {selected && !required ? (
            <span
              role="button"
              onClick={handleClear}
              className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" />
            </span>
          ) : null}
          <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
        </div>
      </button>
      {/* Hidden input for form data */}
      <input type="hidden" name={name} value={value ?? ""} required={required} />
    </div>
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={isEn ? "Select Agent" : "เลือกพนักงาน (Agent)"}
      description={isEn ? "Search by agent name" : "พิมพ์ชื่อพนักงานเพื่อค้นหา"}
      className="sm:max-w-[450px]"
      trigger={trigger}
      minHeight="380px"
    >
      <div className="flex flex-col h-full">
        {/* Search bar */}
        <div className="p-4 border-b border-slate-100/80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={isEn ? "Search agent name..." : "ค้นหาชื่อพนักงาน..."}
              className="pl-9 pr-9 h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500/20"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[300px] max-h-[450px]">
          {/* All Agents Option */}
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left cursor-pointer mb-1",
              !selected || value === "ALL"
                ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 font-bold"
                : "hover:bg-slate-100 text-slate-700 hover:text-slate-900",
            )}
          >
            <div
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                !selected || value === "ALL" ? "bg-indigo-100" : "bg-slate-100",
              )}
            >
              <UserCheck
                className={cn(
                  "h-4 w-4",
                  !selected || value === "ALL" ? "text-indigo-600" : "text-slate-400",
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">
                {isEn ? "All Agents (Show All)" : "พนักงานทั้งหมด (แสดงทุกคน)"}
              </p>
            </div>
            {(!selected || value === "ALL") && (
              <Check className="h-4 w-4 text-indigo-600 shrink-0" />
            )}
          </button>

          {filteredAgents.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">{isEn ? "No agents found" : "ไม่พบรายชื่อพนักงาน"}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredAgents.map((item) => {
                const isItemSelected = selected?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left cursor-pointer",
                      isItemSelected
                        ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
                        : "hover:bg-slate-100 text-slate-700 hover:text-slate-900",
                    )}
                  >
                    <div
                      className={cn(
                        "h-9 w-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/60",
                        isItemSelected ? "bg-indigo-100" : "bg-slate-100",
                      )}
                    >
                      {item.avatar_url ? (
                        <div className="relative h-full w-full">
                          <Image
                            src={item.avatar_url}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="36px"
                          />
                        </div>
                      ) : (
                        <UserCheck
                          className={cn(
                            "h-4 w-4",
                            isItemSelected ? "text-indigo-600" : "text-slate-400",
                          )}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm truncate">{item.title}</p>
                        {item.role && (
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 uppercase tracking-wider",
                              item.role === "ADMIN" || item.role === "TENANT_ADMIN"
                                ? "bg-amber-100 text-amber-700"
                                : item.role === "MANAGER"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-600",
                            )}
                          >
                            {item.role === "ADMIN" || item.role === "TENANT_ADMIN"
                              ? "Admin"
                              : item.role === "MANAGER"
                                ? "Manager"
                                : item.role === "AGENT"
                                  ? "Agent"
                                  : item.role}
                          </span>
                        )}
                      </div>
                      {item.email && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.email}</p>
                      )}
                    </div>
                    {isItemSelected && (
                      <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ResponsiveDialog>
  );
}
