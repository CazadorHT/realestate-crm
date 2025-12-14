"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function GlobalSearch() {
  return (
    <div className="relative w-full max-w-xl">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="ค้นหา (ชื่อทรัพย์, ลูกค้า, เบอร์โทร, รหัส...)"
        className="pl-9 bg-background focus:bg-background border-muted w-full"
      />
    </div>
  );
}
