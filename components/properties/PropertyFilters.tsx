"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  PROPERTY_TYPE_ORDER,
  PROPERTY_TYPE_LABELS,
  LISTING_TYPE_ORDER,
  LISTING_TYPE_LABELS,
  PROPERTY_STATUS_ORDER,
  PROPERTY_STATUS_LABELS,
} from "@/features/properties/labels";
import { useEffect } from "react";

type Filters = {
  q: string;
  status: string; // "ALL" | PropertyStatus
  type: string; // "ALL" | PropertyType
  listing: string; // "ALL" | ListingType
  bedrooms: string;
  bathrooms: string;
  province: string;
  district: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
  sortOrder: string;
};

const DEFAULT_FILTERS: Filters = {
  q: "",
  status: "ALL",
  type: "ALL",
  listing: "ALL",
  bedrooms: "",
  bathrooms: "",
  province: "",
  district: "",
  minPrice: "",
  maxPrice: "",
  sortBy: "created_at",
  sortOrder: "desc",
};

export function PropertyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    q: searchParams.get("q") || "",
    status: searchParams.get("status") || "ALL",
    type: searchParams.get("type") || "ALL",
    listing: searchParams.get("listing") || "ALL",
    bedrooms: searchParams.get("bedrooms") || "",
    bathrooms: searchParams.get("bathrooms") || "",
    province: searchParams.get("province") || "",
    district: searchParams.get("district") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sortBy: searchParams.get("sortBy") || "created_at",
    sortOrder: searchParams.get("sortOrder") || "desc",
  });

  const applyFilters = () => {
    const params = new URLSearchParams();

    (Object.entries(filters) as [keyof Filters, string][]).forEach(
      ([key, value]) => {
        const v = String(value ?? "").trim();
        if (!v) return;
        if (v === "ALL") return;
        params.set(String(key), v);
      }
    );

    const qs = params.toString();
    router.push(qs ? `/protected/properties?${qs}` : "/protected/properties");
    setOpen(false);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    router.push("/protected/properties");
    setOpen(false);
  };

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([k, v]) => {
      const val = String(v ?? "").trim();
      if (!val) return false;

      // default ที่ไม่ถือว่าเป็น filter
      if (k === "sortBy" && val === DEFAULT_FILTERS.sortBy) return false;
      if (k === "sortOrder" && val === DEFAULT_FILTERS.sortOrder) return false;

      // ค่า ALL ไม่ถือว่า filter
      if (val === "ALL") return false;

      return true;
    });
  }, [filters]);
  useEffect(() => {
    const qs = searchParams.toString();

    setFilters((prev) => ({
      ...prev,
      q: searchParams.get("q") || "",
      status: searchParams.get("status") || "ALL",
      type: searchParams.get("type") || "ALL",
      listing: searchParams.get("listing") || "ALL",
      bedrooms: searchParams.get("bedrooms") || "",
      bathrooms: searchParams.get("bathrooms") || "",
      province: searchParams.get("province") || "",
      district: searchParams.get("district") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      sortBy: searchParams.get("sortBy") || "created_at",
      sortOrder: searchParams.get("sortOrder") || "desc",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  return (
    <div className="flex items-center gap-2">
      {/* Quick Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ค้นหาทรัพย์..."
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          className="pl-9"
        />
      </div>

      {/* Quick Sort */}
      <Select
        value={`${filters.sortBy}-${filters.sortOrder}`}
        onValueChange={(value) => {
          const [sortBy, sortOrder] = value.split("-");
          setFilters({ ...filters, sortBy, sortOrder });

          const params = new URLSearchParams(searchParams.toString());
          params.set("sortBy", sortBy);
          params.set("sortOrder", sortOrder);
          router.push(`/protected/properties?${params.toString()}`);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          <SelectValue placeholder="เรียงตาม" />
        </SelectTrigger>
        <SelectContent className="overflow-y-auto bg-white">
          <SelectItem value="created_at-desc">ใหม่ล่าสุด</SelectItem>
          <SelectItem value="created_at-asc">เก่าสุด</SelectItem>
          <SelectItem value="updated_at-desc">อัปเดตล่าสุด</SelectItem>
          <SelectItem value="updated_at-asc">อัปเดตเก่าสุด</SelectItem>
          <SelectItem value="price-desc">ราคาสูงสุด</SelectItem>
          <SelectItem value="price-asc">ราคาต่ำสุด</SelectItem>
          <SelectItem value="rental_price-desc">ค่าเช่าสูงสุด</SelectItem>
          <SelectItem value="rental_price-asc">ค่าเช่าต่ำสุด</SelectItem>
          <SelectItem value="title-asc">ชื่อ A-Z</SelectItem>
          <SelectItem value="title-desc">ชื่อ Z-A</SelectItem>
          <SelectItem value="bedrooms-desc">ห้องนอนมากสุด</SelectItem>
        </SelectContent>
      </Select>
      {/* Quick Status */}
      <Select
        value={filters.status}
        onValueChange={(status) => {
          setFilters({ ...filters, status });

          const params = new URLSearchParams(searchParams.toString());
          if (status === "ALL") params.delete("status");
          else params.set("status", status);
          params.delete("page");
          router.push(`/protected/properties?${params.toString()}`);
        }}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="สถานะ" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] overflow-y-auto bg-white">
          <SelectItem value="ALL">ทุกสถานะ</SelectItem>
          {PROPERTY_STATUS_ORDER.map((s) => (
            <SelectItem key={s} value={s}>
              {PROPERTY_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Quick Type */}
      <Select
        value={filters.type}
        onValueChange={(type) => {
          setFilters({ ...filters, type });

          const params = new URLSearchParams(searchParams.toString());
          if (type === "ALL") params.delete("type");
          else params.set("type", type);
          params.delete("page");
          router.push(`/protected/properties?${params.toString()}`);
        }}
      >
        <SelectTrigger className="w-[190px]">
          <SelectValue placeholder="ประเภท" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] overflow-y-auto bg-white">
          <SelectItem value="ALL">ทุกประเภท</SelectItem>
          {PROPERTY_TYPE_ORDER.map((t) => (
            <SelectItem key={t} value={t}>
              {PROPERTY_TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Advanced Filters */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant={hasActiveFilters ? "default" : "outline"}>
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            ตัวกรอง
            {hasActiveFilters && (
              <span className="ml-2 px-1.5 py-0.5 bg-primary-foreground text-primary rounded-full text-xs">
                •
              </span>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto bg-white">
          <SheetHeader>
            <SheetTitle>ตัวกรองขั้นสูง</SheetTitle>
            <SheetDescription>กรองทรัพย์ตามเงื่อนไขที่ต้องการ</SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6 px-6 py-4">
            {/* Listing Type */}
            <div className="space-y-2">
              <Label>รูปแบบ</Label>
              <Select
                value={filters.listing}
                onValueChange={(value) =>
                  setFilters({ ...filters, listing: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกรูปแบบ" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto bg-white">
                  <SelectItem className="border-b" value="ALL">
                    ทั้งหมด
                  </SelectItem>
                  {LISTING_TYPE_ORDER.map((t) => (
                    <SelectItem key={t} value={t}>
                      {LISTING_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Bedrooms & Bathrooms */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ห้องนอน</Label>
                <Input
                  type="number"
                  placeholder="จำนวน"
                  value={filters.bedrooms}
                  onChange={(e) =>
                    setFilters({ ...filters, bedrooms: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>ห้องน้ำ</Label>
                <Input
                  type="number"
                  placeholder="จำนวน"
                  value={filters.bathrooms}
                  onChange={(e) =>
                    setFilters({ ...filters, bathrooms: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <Label>ช่วงราคา (บาท)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="ราคาต่ำสุด"
                  value={filters.minPrice}
                  onChange={(e) =>
                    setFilters({ ...filters, minPrice: e.target.value })
                  }
                />
                <Input
                  type="number"
                  placeholder="ราคาสูงสุด"
                  value={filters.maxPrice}
                  onChange={(e) =>
                    setFilters({ ...filters, maxPrice: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>จังหวัด</Label>
                <Input
                  placeholder="เช่น กรุงเทพ"
                  value={filters.province}
                  onChange={(e) =>
                    setFilters({ ...filters, province: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>เขต/อำเภอ</Label>
                <Input
                  placeholder="เช่น ปทุมวัน"
                  value={filters.district}
                  onChange={(e) =>
                    setFilters({ ...filters, district: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={applyFilters} className="flex-1 text-white">
                ค้นหา
              </Button>
              <Button
                onClick={clearFilters}
                variant="outline"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                ล้างตัวกรอง
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
