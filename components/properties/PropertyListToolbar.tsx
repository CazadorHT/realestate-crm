"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Plus, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PROPERTY_TYPE_ORDER,
  PROPERTY_STATUS_ORDER,
} from "@/features/properties/labels";

export function PropertyListToolbar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Search Param Handlers
  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    // Reset page to 1 when searching
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    const current = params.get(key);

    if (current === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.replace(`${pathname}`);
  };

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 w-full md:max-w-xl items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="ค้นหาชื่อทรัพย์, ทำเล..."
              className="pl-9 w-full bg-background"
              defaultValue={searchParams.get("q")?.toString()}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                ตัวกรอง
                {hasFilters && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>สถานะ (Status)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PROPERTY_STATUS_ORDER.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={searchParams.get("status") === status}
                  onCheckedChange={() => handleFilterChange("status", status)}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuLabel>ประเภท (Type)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PROPERTY_TYPE_ORDER.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={searchParams.get("type") === type}
                  onCheckedChange={() => handleFilterChange("type", type)}
                >
                  {type}
                </DropdownMenuCheckboxItem>
              ))}

              {hasFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={clearFilters}
                    className="text-red-600 focus:text-red-600"
                  >
                    <X className="mr-2 h-4 w-4" /> ล้างตัวกรองทั้งหมด
                  </DropdownMenuCheckboxItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button asChild className="w-full md:w-auto text-white">
            <Link href="/protected/properties/new ">
              <Plus className="mr-2 h-4 w-4" /> เพิ่มทรัพย์ใหม่
            </Link>
          </Button>
        </div>
      </div>

      {/* Active Filters Display (Optional for UX) */}
      {hasFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>ผลการค้นหาสำหรับ:</span>
          {searchParams.get("q") && (
            <span className="bg-muted px-2 py-0.5 rounded-md text-foreground">
              "{searchParams.get("q")}"
            </span>
          )}
          {searchParams.get("status") && (
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
              Status: {searchParams.get("status")}
            </span>
          )}
          {searchParams.get("type") && (
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md">
              Type: {searchParams.get("type")}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 px-2 text-xs"
          >
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}
