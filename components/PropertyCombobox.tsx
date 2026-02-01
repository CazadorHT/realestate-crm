"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  searchPropertiesAction,
  type PropertyPickItem,
} from "@/features/leads/actions";

type Props = {
  value: string | null;
  onChange: (value: string | null, picked?: PropertyPickItem | null) => void;
  placeholder?: string;
};

export function PropertyCombobox({
  value,
  onChange,
  placeholder = "เลือกทรัพย์ (พิมพ์เพื่อค้นหา)",
}: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<PropertyPickItem[]>([]);
  const [q, setQ] = useState("");

  const selected = useMemo(
    () => items.find((x) => x.id === value) ?? null,
    [items, value],
  );

  useEffect(() => {
    if (!open) return;

    const handle = setTimeout(() => {
      startTransition(async () => {
        const data = await searchPropertiesAction(q);
        setItems(data);
      });
    }, 250);

    return () => clearTimeout(handle);
  }, [open, q, startTransition]);

  // โหลด list ล่าสุดตอนเปิดครั้งแรก
  useEffect(() => {
    if (!open) return;

    // Reset search input and always load a fresh first page when opening so the user
    // can "see all" after making a selection.
    setQ("");

    startTransition(async () => {
      const data = await searchPropertiesAction("");
      setItems(data);
    });
  }, [open, startTransition]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
        >
          <span className="truncate">{selected?.title ?? placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[420px] p-0 bg-white" align="start">
        <Command>
          <CommandInput
            className="p-2 "
            placeholder="ค้นหาชื่อทรัพย์..."
            value={q}
            onValueChange={setQ}
          />
          <CommandList>
            <CommandEmpty>
              {isPending ? "กำลังค้นหา..." : "ไม่พบทรัพย์"}
            </CommandEmpty>

            {/* ตัวเลือก: แสดงทั้งหมด */}
            <CommandItem
              value="__all__"
              onSelect={() => {
                // select 'all' -> clear filter (undefined) so caller can treat as no filter
                onChange(null, null);
                setOpen(false);
              }}
            >
              <Check
                className={`mr-2 h-4 w-4 ${value === undefined ? "opacity-100" : "opacity-0"}`}
              />
              (ทั้งหมด) แสดงทรัพย์ทั้งหมด
            </CommandItem>

            {/* ตัวเลือก: ไม่ผูกทรัพย์ */}

            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.title} ${item.id}`}
                onSelect={() => {
                  onChange(item.id, item);
                  setOpen(false);
                }}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${value === item.id ? "opacity-100" : "opacity-0"}`}
                />
                <span className="truncate">{item.title}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
