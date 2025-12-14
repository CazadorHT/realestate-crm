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
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

export function PropertyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const [filters, setFilters] = useState({
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

    Object.entries(filters).forEach(([key, value]) => {
      // Skip empty values and "ALL" (which means no filter)
      if (!value || value === "ALL" || (value.trim && value.trim() === "")) {
        return; // Skip this filter
      }
      params.set(key, value);
    });

    router.push(`/protected/properties?${params.toString()}`);
    setOpen(false);
  };

  const clearFilters = () => {
    setFilters({
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
    });
    router.push("/protected/properties");
    setOpen(false);
  };

  const hasActiveFilters = Object.values(filters).some(
    (v, i) =>
      v &&
      !(
        (i === Object.keys(filters).indexOf("sortBy") && v === "created_at") ||
        (i === Object.keys(filters).indexOf("sortOrder") && v === "desc")
      )
  );

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
        <SelectContent className="overflow-y-auto bg-white ">
          <SelectItem value="created_at-desc">ใหม่ล่าสุด</SelectItem>
          <SelectItem value="created_at-asc">เก่าสุด</SelectItem>
          <SelectItem value="price-desc">ราคาสูงสุด</SelectItem>
          <SelectItem value="price-asc">ราคาต่ำสุด</SelectItem>
          <SelectItem value="title-asc">ชื่อ A-Z</SelectItem>
          <SelectItem value="title-desc">ชื่อ Z-A</SelectItem>
          <SelectItem value="bedrooms-desc">ห้องนอนมากสุด</SelectItem>
          <SelectItem value="updated_at-desc">อัปเดตล่าสุด</SelectItem>
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
            {/* Property Type */}
            <div className="space-y-2">
              <Label>ประเภททรัพย์</Label>
              <Select
                value={filters.type}
                onValueChange={(value) =>
                  setFilters({ ...filters, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto bg-white">
                  <SelectItem className="border-b" value="ALL">
                    ทั้งหมด
                  </SelectItem>
                  <SelectItem value="HOUSE">บ้าน</SelectItem>
                  <SelectItem value="CONDO">คอนโด</SelectItem>
                  <SelectItem value="TOWNHOME">ทาวน์เฮาส์</SelectItem>
                  <SelectItem value="LAND">ที่ดิน</SelectItem>
                  <SelectItem value="OFFICE_BUILDING">อาคารสำนักงาน</SelectItem>
                  <SelectItem value="WAREHOUSE">โกดัง</SelectItem>
                  <SelectItem value="COMMERCIAL_BUILDING">
                    อาคารพาณิชย์
                  </SelectItem>
                  <SelectItem value="OTHER">อื่นๆ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Listing Type */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto bg-white">
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
                  <SelectItem value="SALE">ขาย</SelectItem>
                  <SelectItem value="RENT">เช่า</SelectItem>
                  <SelectItem value="SALE_AND_RENT">ขาย/เช่า</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>สถานะ</Label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent className=" max-h-[300px] overflow-y-auto bg-white ">
                  <SelectItem className="border-b" value="ALL">
                    ทั้งหมด
                  </SelectItem>
                  <SelectItem value="DRAFT">แบบร่าง</SelectItem>
                  <SelectItem value="ACTIVE">เปิดขาย</SelectItem>
                  <SelectItem value="UNDER_OFFER">ต่อรองอยู่</SelectItem>
                  <SelectItem value="RESERVED">จองแล้ว</SelectItem>
                  <SelectItem value="SOLD">ขายแล้ว</SelectItem>
                  <SelectItem value="RENTED">เช่าแล้ว</SelectItem>
                  <SelectItem value="ARCHIVED">เก็บถาวร</SelectItem>
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
            <div className="flex gap-2 pt-4 ">
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
