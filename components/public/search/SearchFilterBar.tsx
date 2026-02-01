"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { MdOutlinePets } from "react-icons/md";
import { FaTrainSubway } from "react-icons/fa6";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { FilterBarSkeleton } from "../FilterBarSkeleton";

export const PROPERTY_TYPES = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "HOUSE", label: "บ้าน" },
  { value: "CONDO", label: "คอนโด" },
  { value: "TOWNHOME", label: "ทาวน์โฮม" },
  { value: "LAND", label: "ที่ดิน" },
  { value: "OFFICE_BUILDING", label: "ออฟฟิศ" },
  { value: "COMMERCIAL_BUILDING", label: "อาคารพาณิชย์" },
  { value: "WAREHOUSE", label: "โกดัง" },
];

interface SearchFilterBarProps {
  isLoading: boolean;
  keyword: string;
  setKeyword: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  listingType: string;
  setListingType: (v: string) => void;
  minPrice: string;
  setMinPrice: (v: string) => void;
  maxPrice: string;
  setMaxPrice: (v: string) => void;
  sort: string;
  setSort: (v: string) => void;
  area: string;
  setArea: (v: string) => void;
  nearTrain: boolean;
  setNearTrain: (v: boolean) => void;
  petFriendly: boolean;
  setPetFriendly: (v: boolean) => void;
  bedrooms: string;
  setBedrooms: (v: string) => void;
  filteredLength: number;
  availableAreas: string[];
}

export function SearchFilterBar({
  isLoading,
  keyword,
  setKeyword,
  type,
  setType,
  listingType,
  setListingType,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  sort,
  setSort,
  area,
  setArea,
  nearTrain,
  setNearTrain,
  petFriendly,
  setPetFriendly,
  bedrooms,
  setBedrooms,
  filteredLength,
  availableAreas,
}: SearchFilterBarProps) {
  if (isLoading) return <FilterBarSkeleton />;

  const clearFilters = () => {
    setKeyword("");
    setType("ALL");
    setListingType("ALL");
    setMinPrice("");
    setMaxPrice("");
    setSort("NEWEST");
    setArea("ALL");
    setNearTrain(false);
    setPetFriendly(false);
    setBedrooms("ALL");
  };

  return (
    <div className="bg-white border-b border-slate-100 sticky top-16 z-30 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <div className="max-w-screen-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Mobile View: Search + Filter Sheet */}
        <div className="lg:hidden flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="ค้นหา..."
              className="pl-12 h-12 text-base rounded-xl border-slate-200 bg-white shadow-sm"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="h-12 w-12 p-0 rounded-xl border-slate-200 bg-white shadow-sm shrink-0"
              >
                <SlidersHorizontal className="h-5 w-5 text-slate-600" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="h-[90vh] rounded-t-4xl flex flex-col p-0 bg-slate-50"
            >
              <SheetHeader className="px-6 py-4 border-b border-slate-100 bg-white rounded-t-4xl">
                <SheetTitle>ตัวกรองค้นหา</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Property Type */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-900">
                    ประเภททรัพย์
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROPERTY_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setType(t.value)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          type === t.value
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Listing Type */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-900">
                    ต้องการ
                  </label>
                  <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    {[
                      { val: "ALL", label: "ทั้งหมด" },
                      { val: "SALE", label: "ซื้อ" },
                      { val: "RENT", label: "เช่า" },
                      { val: "SALE_AND_RENT", label: "เช่า/ซื้อ" },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => setListingType(opt.val)}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                          listingType === opt.val
                            ? "bg-slate-900 text-white shadow-md"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-900">
                    ช่วงราคา
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="ต่ำสุด"
                      className="bg-white"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <span className="text-slate-400">-</span>
                    <Input
                      type="number"
                      placeholder="สูงสุด"
                      className="bg-white"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Bedroom */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-900">
                    ห้องนอน
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {["ALL", "1", "2", "3", "4+"].map((bed) => (
                      <button
                        key={bed}
                        onClick={() => setBedrooms(bed)}
                        className={`h-10 min-w-12 px-3 rounded-xl border transition-all font-medium text-sm shrink-0 ${
                          bedrooms === bed
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                            : "bg-white text-slate-700 border-slate-200"
                        }`}
                      >
                        {bed === "ALL" ? "ทั้งหมด" : bed}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Area */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-900">
                    ทำเล
                  </label>
                  <Select value={area} onValueChange={setArea}>
                    <SelectTrigger className="w-full h-12 rounded-xl bg-white">
                      <SelectValue placeholder="ทุกย่านทำเล" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">-- ทุกย่านทำเล --</SelectItem>
                      {availableAreas.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                      nearTrain
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                    onClick={() => setNearTrain(!nearTrain)}
                  >
                    <FaTrainSubway className="h-4 w-4" />
                    <span className="text-sm font-medium">ใกล้รถไฟฟ้า</span>
                  </div>
                  <div
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                      petFriendly
                        ? "bg-orange-600 border-orange-600 text-white"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                    onClick={() => setPetFriendly(!petFriendly)}
                  >
                    <MdOutlinePets className="h-5 w-5" />
                    <span className="text-sm font-medium">เลี้ยงสัตว์ได้</span>
                  </div>
                </div>
              </div>

              <SheetFooter className="p-6 border-t border-slate-100 bg-white pb-8">
                <SheetClose asChild>
                  <Button className="w-full h-12 text-lg rounded-xl bg-linear-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-200/50">
                    ดูผลลัพธ์ ({filteredLength} รายการ)
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop View (Hidden on Mobile) */}
        <div className="hidden lg:block">
          {/* Row 1: Search + Core Filters */}
          <div className="grid grid-cols-12 gap-3 mb-4">
            <div className="col-span-5">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="ค้นหาอสังหาฯ ที่ใช่สำหรับคุณ..."
                  className="pl-12 h-12 text-base rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md focus:shadow-lg transition-all"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
            </div>

            <div className="col-span-2">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-12 py-[23px] w-full rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
                  <SelectValue placeholder="ประเภททรัพย์" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-3">
              <div className="grid grid-cols-4 gap-1.5 h-12">
                {[
                  { val: "ALL", label: "ทั้งหมด", color: "slate" },
                  { val: "SALE", label: "ขาย", color: "green" },
                  { val: "RENT", label: "เช่า", color: "orange" },
                  { val: "SALE_AND_RENT", label: "ขาย+เช่า", color: "blue" },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => setListingType(opt.val)}
                    className={`rounded-lg border-2 transition-all font-medium text-xs ${
                      listingType === opt.val
                        ? `bg-${opt.color}-600 border-${opt.color}-600 text-white shadow-md`
                        : `bg-white border-slate-200 hover:border-${opt.color}-400 hover:bg-${opt.color}-50 text-slate-700`
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <div className="flex items-center gap-2 h-12 bg-white rounded-xl border border-slate-200 shadow-sm">
                <Input
                  type="number"
                  placeholder="ราคาต่ำสุด"
                  className="border-0 h-full w-full p-0 text-sm focus-visible:ring-0 bg-white px-2"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span className="text-slate-400">—</span>
                <Input
                  type="number"
                  placeholder="สูงสุด"
                  className="border-0 h-full w-full p-0 text-sm focus-visible:ring-0 bg-white px-2"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Secondary Filters + Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger className="w-[160px] h-12 py-[23px] rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
                <SelectValue placeholder="ทุกย่านทำเล" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">-- ทุกย่านทำเล --</SelectItem>
                {availableAreas.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl h-12">
              <span className="text-xs text-slate-600 font-medium px-2">
                ห้องนอน:
              </span>
              {["ALL", "1", "2", "3", "4+"].map((bed) => (
                <button
                  key={bed}
                  onClick={() => setBedrooms(bed)}
                  className={`h-9 px-3 rounded-lg transition-all font-medium text-sm ${
                    bedrooms === bed
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  {bed === "ALL" ? "ทั้งหมด" : bed}
                </button>
              ))}
            </div>

            <div
              className={`flex items-center justify-center gap-2 px-4 h-12 rounded-xl border-2 transition-all cursor-pointer shadow-sm ${
                nearTrain
                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/30"
                  : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700"
              }`}
              onClick={() => setNearTrain(!nearTrain)}
            >
              <FaTrainSubway
                className={`h-4 w-4 ${
                  nearTrain ? "text-white" : "text-blue-600"
                }`}
              />
              <span className="text-sm font-medium select-none">
                ใกล้รถไฟฟ้า
              </span>
            </div>

            <div
              className={`flex items-center justify-center gap-2 px-4 h-12 rounded-xl border-2 transition-all cursor-pointer shadow-sm ${
                petFriendly
                  ? "bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-500/30"
                  : "bg-white border-slate-200 hover:border-orange-300 hover:bg-orange-50 text-slate-700 hover:text-orange-700"
              }`}
              onClick={() => setPetFriendly(!petFriendly)}
            >
              <MdOutlinePets
                className={`h-5 w-5 ${
                  petFriendly ? "text-white" : "text-orange-600"
                }`}
              />
              <span className="text-sm font-medium select-none">
                เลี้ยงสัตว์ได้
              </span>
            </div>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[210px] h-12 py-[23px] rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
                <ArrowUpDown className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="เรียงลำดับ" />
              </SelectTrigger>
              <SelectContent className="min-w-[210px]">
                <SelectItem value="NEWEST">🆕 มาใหม่ล่าสุด</SelectItem>
                <SelectItem value="PRICE_ASC">💰 ราคาน้อย → มาก</SelectItem>
                <SelectItem value="PRICE_DESC">💎 ราคามาก → น้อย</SelectItem>
                <SelectItem value="AREA_ASC">📐 พื้นที่น้อย → มาก</SelectItem>
                <SelectItem value="AREA_DESC">🏠 พื้นที่มาก → น้อย</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={clearFilters}
              className="ml-auto h-12 px-5 rounded-xl border-2 border-slate-200 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-all font-medium shadow-sm bg-white"
            >
              <SlidersHorizontal className={`h-4 w-4 mr-2 text-rose-500`} />
              ล้างตัวกรอง
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
