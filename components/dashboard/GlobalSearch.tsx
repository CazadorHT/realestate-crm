"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Building2, 
  UserCircle, 
  Briefcase, 
  FileText,
  Command as CommandIcon 
} from "lucide-react";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { globalSearchAction, type SearchResult } from "@/app/actions/global-search";
import { useDebounce } from "use-debounce";
import { cn } from "@/lib/utils";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

export interface GlobalSearchProps {
  className?: string;
  variant?: "auto" | "bar" | "icon";
}

export function GlobalSearch({ className, variant = "auto" }: GlobalSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const [debouncedQuery] = useDebounce(query, 300);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    async function search() {
      if (debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await globalSearchAction(debouncedQuery);
        setResults(data);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    }

    search();
  }, [debouncedQuery]);

  const onSelect = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  const properties = results.filter((r) => r.type === "property");
  const leads = results.filter((r) => r.type === "lead");
  const deals = results.filter((r) => r.type === "deal");
  const agents = results.filter((r) => r.type === "agent");
  const owners = results.filter((r) => r.type === "owner");

  const isBarVariant = variant === "bar" || variant === "auto";
  const isIconVariant = variant === "icon" || variant === "auto";

  return (
    <>
      {/* Search Bar Trigger - Shown if 'bar' or 'auto' (hidden on mobile if auto) */}
      {isBarVariant && (
        <Button
          variant="outline"
          className={cn(
            "relative h-11 w-full justify-start bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-500 shadow-none border-slate-200/60 pr-10 hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all rounded-xl group truncate shrink-0",
            variant === "auto" && "hidden md:flex md:w-[220px] lg:w-[280px]",
            className
          )}
          onClick={() => setOpen(true)}
        >
          <Search className="mr-2.5 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
          <span className="truncate">ค้นชื่อทรัพย์, ลูกค้า, เบอร์โทร...</span>
          <kbd className="pointer-events-none absolute right-1.5 top-2.5 hidden h-6 select-none items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-bold text-slate-400 shadow-xs lg:flex group-hover:border-blue-100 group-hover:text-blue-400 transition-all">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </Button>
      )}

      {/* Mobile/Small Icon Trigger - Shown if 'icon' or 'auto' (hidden on md+ if auto) */}
      {isIconVariant && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 rounded-full bg-slate-50/80 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors shrink-0",
            variant === "auto" && "md:hidden",
            className
          )}
          onClick={() => setOpen(true)}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>
      )}

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        className="max-w-2xl p-0 overflow-hidden border-none sm:shadow-2xl bg-slate-50/95 backdrop-blur-xl"
        isLoading={loading}
        loadingText="กำลังสืบค้นข้อมูล..."
        minHeight="400px"
      >
        <Command shouldFilter={false} className="rounded-none h-full max-h-screen w-full bg-transparent">
          <div className="flex items-center border-b border-slate-200/60 px-4 bg-white/50">
            <Search className="h-5 w-5 text-slate-400 shrink-0" />
            <CommandInput
              placeholder="ค้นหาทรัพย์, ลูกค้า, เบอร์โทร, ดีล..."
              value={query}
              onValueChange={setQuery}
              className="h-16 text-base border-none focus:ring-0 w-full bg-transparent"
              autoFocus
            />
            {query.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 mr-6 text-xs font-bold text-slate-400 hover:text-slate-600"
                onClick={() => setQuery("")}
              >
                ล้างข้อมูล
              </Button>
            )}
          </div>
          
          <CommandList className="max-h-[70vh] sm:max-h-[480px] p-2 overflow-y-auto w-full custom-scrollbar">
            {/* The ResponsiveDialog premium loader handles the loading overlay */}
            
            {!loading && results.length === 0 && query.length >= 2 && (
              <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <Search className="h-8 w-8 opacity-20" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-slate-600">ไม่พบข้อมูลที่ตรงกับ "{query}"</p>
                  <p className="text-xs text-slate-400 px-10">ลองค้นหาด้วยคำอื่น หรือตรวจสอบตัวสะกดอีกครั้ง</p>
                </div>
              </div>
            )}

            {!loading && query.length < 2 && (
              <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-300">
                <div className="h-16 w-16 bg-blue-50/50 rounded-full flex items-center justify-center">
                  <CommandIcon className="h-8 w-8 text-blue-200" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-slate-500">ระบบค้นหาอัจฉริยะ</p>
                  <p className="text-xs text-slate-400 px-10 leading-relaxed max-w-[280px]">
                    พิมพ์รหัสทรัพย์ (REF), ชื่อลูกค้า, เบอร์โทร <br/> หรือชื่อเอเจนท์เพื่อเริ่มต้น
                  </p>
                </div>
              </div>
            )}

            {properties.length > 0 && (
              <CommandGroup 
                heading={<span className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-blue-600 mb-2 px-2 mt-4">ทัพย์สิน (Properties) <span className="h-px flex-1 bg-blue-100" /></span>}
                className="px-1"
              >
                {properties.map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => onSelect(item.url)}
                    className="rounded-xl px-4 py-3.5 mb-1.5 cursor-pointer hover:bg-white hover:shadow-sm border border-transparent hover:border-blue-100 group transition-all"
                  >
                    <div className="h-11 w-11 rounded-lg bg-blue-50 flex items-center justify-center mr-4 shrink-0 group-hover:bg-blue-600 transition-colors">
                      <Building2 className="h-5 w-5 text-blue-500 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-700 transition-colors">{item.title}</span>
                      {item.subtitle && (
                        <span className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                    <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-7 w-7 rounded-full bg-blue-50 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {leads.length > 0 && (
              <CommandGroup 
                heading={<span className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-emerald-600 mb-2 px-2 mt-4">ผู้สนใจ (Leads) <span className="h-px flex-1 bg-emerald-100" /></span>}
                className="px-1"
              >
                {leads.map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => onSelect(item.url)}
                    className="rounded-xl px-4 py-3.5 mb-1.5 cursor-pointer hover:bg-white hover:shadow-sm border border-transparent hover:border-emerald-100 group transition-all"
                  >
                    <div className="h-11 w-11 rounded-lg bg-emerald-50 flex items-center justify-center mr-4 shrink-0 group-hover:bg-emerald-600 transition-colors">
                      <UserCircle className="h-5 w-5 text-emerald-500 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold text-slate-800 text-sm truncate group-hover:text-emerald-700 transition-colors">{item.title}</span>
                      {item.subtitle && (
                        <span className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                    <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-7 w-7 rounded-full bg-emerald-50 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {deals.length > 0 && (
              <CommandGroup 
                heading={<span className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-purple-600 mb-2 px-2 mt-4">ดีลการขาย (Deals) <span className="h-px flex-1 bg-purple-100" /></span>}
                className="px-1"
              >
                {deals.map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => onSelect(item.url)}
                    className="rounded-xl px-4 py-3.5 mb-1.5 cursor-pointer hover:bg-white hover:shadow-sm border border-transparent hover:border-purple-100 group transition-all"
                  >
                    <div className="h-11 w-11 rounded-lg bg-purple-50 flex items-center justify-center mr-4 shrink-0 group-hover:bg-purple-600 transition-colors">
                      <FileText className="h-5 w-5 text-purple-500 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold text-slate-800 text-sm truncate group-hover:text-purple-700 transition-colors">{item.title}</span>
                      {item.subtitle && (
                        <span className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                    <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-7 w-7 rounded-full bg-purple-50 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {agents.length > 0 && (
              <CommandGroup 
                heading={<span className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-indigo-600 mb-2 px-2 mt-4">เอเจนท์ / ทีมงาน (Agents) <span className="h-px flex-1 bg-indigo-100" /></span>}
                className="px-1"
              >
                {agents.map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => onSelect(item.url)}
                    className="rounded-xl px-4 py-3.5 mb-1.5 cursor-pointer hover:bg-white hover:shadow-sm border border-transparent hover:border-indigo-100 group transition-all"
                  >
                    <div className="h-11 w-11 rounded-lg bg-indigo-50 flex items-center justify-center mr-4 shrink-0 group-hover:bg-indigo-600 transition-colors">
                      <Briefcase className="h-5 w-5 text-indigo-500 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-700 transition-colors">{item.title}</span>
                      {item.subtitle && (
                        <span className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                    <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-7 w-7 rounded-full bg-indigo-50 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {owners.length > 0 && (
              <CommandGroup 
                heading={<span className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-amber-600 mb-2 px-2 mt-4">เจ้าของทรัพย์ (Owners) <span className="h-px flex-1 bg-amber-100" /></span>}
                className="px-1"
              >
                {owners.map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => onSelect(item.url)}
                    className="rounded-xl px-4 py-3.5 mb-1.5 cursor-pointer hover:bg-white hover:shadow-sm border border-transparent hover:border-amber-100 group transition-all"
                  >
                    <div className="h-11 w-11 rounded-lg bg-amber-50 flex items-center justify-center mr-4 shrink-0 group-hover:bg-amber-600 transition-colors">
                      <UserCircle className="h-5 w-5 text-amber-500 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold text-slate-800 text-sm truncate group-hover:text-amber-700 transition-colors">{item.title}</span>
                      {item.subtitle && (
                        <span className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                    <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-7 w-7 rounded-full bg-amber-50 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </ResponsiveDialog>
    </>
  );
}
