"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, UserCircle, Briefcase } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import {
  searchGlobalAction,
  type SearchResult,
} from "@/features/global/actions";
import { useDebounce } from "use-debounce";

export function GlobalSearch() {
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
        const data = await searchGlobalAction(debouncedQuery);
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
  const owners = results.filter((r) => r.type === "owner");

  return (
    <>
      <Button
        variant="outline"
        className="relative h-10 w-full max-w-xl justify-start bg-card text-sm font-normal text-muted-foreground shadow-sm pr-12 hover:bg-accent"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4 " />
        <span className="hidden lg:inline-flex">
          ค้นหา (ชื่อทรัพย์, ลูกค้า, เบอร์โทร...)
        </span>
        <span className="inline-flex lg:hidden">ค้นหา...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex ">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false} >
        <CommandInput
          placeholder="พิมพ์เพื่อค้นหา..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="py-6 text-center text-sm">กำลังค้นหา...</div>
          )}
          {!loading && results.length === 0 && query.length >= 2 && (
            <CommandEmpty>ไม่พบข้อมูลที่ค้นหา</CommandEmpty>
          )}

          {properties.length > 0 && (
            <CommandGroup heading="ทรัพย์สิน (Properties)">
              {properties.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => onSelect(item.url)}
                  className="cursor-pointer"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    {item.subtitle && (
                      <span className="text-xs text-muted-foreground">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {leads.length > 0 && (
            <CommandGroup heading="บุคคลที่สนใจ (Leads)">
              {leads.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => onSelect(item.url)}
                  className="cursor-pointer"
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    {item.subtitle && (
                      <span className="text-xs text-muted-foreground">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {owners.length > 0 && (
            <CommandGroup heading="เจ้าของทรัพย์ (Owners)">
              {owners.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => onSelect(item.url)}
                  className="cursor-pointer"
                >
                  <Briefcase className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    {item.subtitle && (
                      <span className="text-xs text-muted-foreground">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
