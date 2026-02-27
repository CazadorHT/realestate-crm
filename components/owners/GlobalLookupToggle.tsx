"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Users2 } from "lucide-react";

export function GlobalLookupToggle() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const isGlobal = searchParams.get("all_branches") === "true";

  const handleToggle = (checked: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (checked) {
      params.set("all_branches", "true");
    } else {
      params.delete("all_branches");
    }
    // Reset page to 1 when toggling
    params.delete("page");
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 transition-all hover:bg-white/20">
      <Users2 className="h-4 w-4 text-white" />
      <Label
        htmlFor="global-lookup"
        className="text-sm font-semibold text-white cursor-pointer select-none"
      >
        ค้นหาทุกสาขา
      </Label>
      <Switch
        id="global-lookup"
        checked={isGlobal}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-white data-[state=unchecked]:bg-slate-300 [&>span]:bg-blue-600"
      />
    </div>
  );
}
