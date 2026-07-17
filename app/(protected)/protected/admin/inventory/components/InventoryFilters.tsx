"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  X,
  Home,
  Building,
  Tag,
  Key,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { cn } from "@/lib/utils";

// 🛡️ Imported Specialized Sub-components
import { FilterOptionSelect } from "./sub-components/FilterOptionSelect";
import type { InventoryFilterCounts } from "../types";

interface InventoryFiltersProps {
  query: string;
  propertyType: string;
  listingType: string;
  status: string;
  tenantId: string;
  tenants: { id: string; name: string }[];
  filterCounts?: InventoryFilterCounts;
  onFilterChange: (updates: Record<string, string | null>) => void;
  onReset: () => void;
}

export function InventoryFilters({
  query,
  propertyType,
  listingType,
  status,
  tenantId,
  tenants,
  filterCounts,
  onFilterChange,
  onReset,
}: InventoryFiltersProps) {
  const [searchInput, setSearchInput] = useState(query);
  const [isOpen, setIsOpen] = useState(false);

  // 🛡️ Elite Debounced Search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== query) {
        onFilterChange({ q: searchInput });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, onFilterChange, query]);

  const activeFiltersCount = [
    propertyType !== "ALL",
    listingType !== "ALL",
    status !== "ALL",
    tenantId !== "ALL",
  ].filter(Boolean).length;

  // 🛡️ Pre-calculated Options with Dynamic Counts
  const tenantOptions = [
    {
      label: "ทุกสาขา (Global)",
      value: "ALL",
      icon: <Building2 className="h-4 w-4" />,
    },
    ...tenants.map((t) => ({
      label: t.name,
      value: t.id,
      icon: <Building2 className="h-4 w-4" />,
      count: filterCounts?.branches[t.id] || 0
    })),
  ];

  const propertyTypeOptions = [
    { label: "ทั้งหมด", value: "ALL" },
    { label: "คอนโด", value: "CONDO", icon: <Building className="h-4 w-4" />, count: filterCounts?.propertyTypes["CONDO"] || 0 },
    { label: "บ้านเดี่ยว", value: "HOUSE", icon: <Home className="h-4 w-4" />, count: filterCounts?.propertyTypes["HOUSE"] || 0 },
    { label: "ทาวน์โฮม", value: "TOWNHOME", icon: <Home className="h-4 w-4" />, count: filterCounts?.propertyTypes["TOWNHOME"] || 0 },
    { label: "ที่ดิน", value: "LAND", icon: <Tag className="h-4 w-4" />, count: filterCounts?.propertyTypes["LAND"] || 0 },
    { label: "พูลวิลล่า", value: "POOL_VILLA", icon: <Home className="h-4 w-4" />, count: filterCounts?.propertyTypes["POOL_VILLA"] || 0 },
    { label: "วิลล่า", value: "VILLA", icon: <Home className="h-4 w-4" />, count: filterCounts?.propertyTypes["VILLA"] || 0 },
    { label: "อาคารพาณิชย์", value: "COMMERCIAL_BUILDING", icon: <Building2 className="h-4 w-4" />, count: filterCounts?.propertyTypes["COMMERCIAL_BUILDING"] || 0 },
    { label: "ออฟฟิศ", value: "OFFICE_BUILDING", icon: <Building2 className="h-4 w-4" />, count: filterCounts?.propertyTypes["OFFICE_BUILDING"] || 0 },
    { label: "โฮมออฟฟิศ", value: "HOME_OFFICE", icon: <Building2 className="h-4 w-4" />, count: filterCounts?.propertyTypes["HOME_OFFICE"] || 0 },
    { label: "โกดัง", value: "WAREHOUSE", icon: <Building2 className="h-4 w-4" />, count: filterCounts?.propertyTypes["WAREHOUSE"] || 0 },
    { label: "อื่นๆ", value: "OTHER", icon: <Tag className="h-4 w-4" />, count: filterCounts?.propertyTypes["OTHER"] || 0 },
  ];

  const statusOptions = [
    { label: "ทั้งหมด", value: "ALL" },
    { label: "ออนไลน์ (Active)", value: "ACTIVE", icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, count: filterCounts?.statuses["ACTIVE"] || 0 },
    { label: "ติดจอง (Offer)", value: "UNDER_OFFER", icon: <Tag className="h-4 w-4 text-amber-500" />, count: filterCounts?.statuses["UNDER_OFFER"] || 0 },
    { label: "จองแล้ว (Reserved)", value: "RESERVED", icon: <Tag className="h-4 w-4 text-orange-500" />, count: filterCounts?.statuses["RESERVED"] || 0 },
    { label: "ขายแล้ว (Sold)", value: "SOLD", icon: <CheckCircle2 className="h-4 w-4 text-blue-500" />, count: filterCounts?.statuses["SOLD"] || 0 },
    { label: "เช่าแล้ว (Rented)", value: "RENTED", icon: <CheckCircle2 className="h-4 w-4 text-purple-500" />, count: filterCounts?.statuses["RENTED"] || 0 },
    { label: "ฉบับร่าง (Draft)", value: "DRAFT", icon: <Tag className="h-4 w-4 text-slate-400" />, count: filterCounts?.statuses["DRAFT"] || 0 },
    { label: "ยกเลิก (Archived)", value: "ARCHIVED", icon: <X className="h-4 w-4 text-rose-400" />, count: filterCounts?.statuses["ARCHIVED"] || 0 },
  ];

  const listingTypeOptions = [
    { label: "ทุกประเภทการดีล", value: "ALL" },
    { label: "เฉพาะขายเท่านั้น", value: "SALE", icon: <Tag className="h-4 w-4" />, count: filterCounts?.listingTypes["SALE"] || 0 },
    { label: "เฉพาะให้เช่าเท่านั้น", value: "RENT", icon: <Key className="h-4 w-4" />, count: filterCounts?.listingTypes["RENT"] || 0 },
    { label: "ทั้งขายและเช่า", value: "SALE_AND_RENT", icon: <Tag className="h-4 w-4" />, count: filterCounts?.listingTypes["SALE_AND_RENT"] || 0 },
  ];

  return (
    <div className="space-y-4">
      {/* 🚀 Layer 1: Main Action Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full lg:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="ค้นหาตามชื่อทรัพย์สิน, ทำเล, หรือรายละเอียด..."
            className="pl-11 h-11 border-none bg-slate-50/50 focus-visible:ring-blue-500/10 rounded-xl text-sm transition-all"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-2 w-full lg:w-auto">
          {/* 🛡️ Advanced Filter with ResponsiveDialog */}
          <ResponsiveDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            title={
              <div className="flex items-center gap-2 text-slate-900 font-medium">
                <Filter className="h-5 w-5 text-blue-500" />
                คัดกรองทรัพย์สินละเอียด
              </div>
            }
            trigger={
              <Button
                variant="outline"
                className="h-11 px-5 border-slate-200 hover:bg-slate-100 rounded-xl relative text-sm font-semibold transition-all w-full lg:w-auto text-blue-500!"
              >
                <Filter className="mr-2 h-4 w-4 text-slate-400" />
                ตัวกรองขั้นสูง
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white font-semibold">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            }
            footer={
              <div className="w-full flex items-center justify-between gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onReset();
                    setSearchInput("");
                    setIsOpen(false);
                  }}
                  className="text-slate-400 flex-1 hover:text-rose-600 rounded-xl px-4 py-2 hover:bg-rose-50 transition-colors"
                >
                  <X className="mr-2 h-4 w-4" />
                  ล้างตัวกรอง
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  className="bg-blue-600 flex-2  hover:bg-blue-700 text-white rounded-xl px-8 h-11 text-sm font-semibold shadow-lg shadow-blue-600/20"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  ใช้ตัวกรอง
                </Button>
              </div>
            }
          >
            <div className="grid gap-6 py-4 px-6">
              <FilterOptionSelect
                label="สาขาที่ดูแล (Branch)"
                value={tenantId}
                options={tenantOptions}
                onSelect={(val: string) => onFilterChange({ tenant: val })}
                placeholder="เลือกสาขา"
                icon={<Building2 className="h-4 w-4" />}
              />

              <div className="grid grid-cols-2 gap-4">
                <FilterOptionSelect
                  label="ประเภททรัพย์"
                  value={propertyType}
                  options={propertyTypeOptions}
                  onSelect={(val: string) => onFilterChange({ type: val })}
                  placeholder="เลือกประเภท"
                  icon={<Building className="h-4 w-4" />}
                />
                <FilterOptionSelect
                  label="สถานะ"
                  value={status}
                  options={statusOptions}
                  onSelect={(val: string) => onFilterChange({ status: val })}
                  placeholder="เลือกสถานะ"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                />
              </div>

              <FilterOptionSelect
                label="ประเภทการดีล"
                value={listingType}
                options={listingTypeOptions}
                onSelect={(val: string) => onFilterChange({ listing: val })}
                placeholder="เลือกประเภทการดีล"
                icon={<Tag className="h-4 w-4" />}
              />
            </div>
          </ResponsiveDialog>

          <Button
            onClick={() => onFilterChange({ q: searchInput })}
            className="h-11 px-7 bg-slate-900 hover:bg-black text-white rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] text-sm font-semibold w-full lg:w-auto"
          >
            ค้นหา
          </Button>
        </div>
      </div>

      {/* 🚀 Layer 2: Quick Filter Buttons (Mobile-First Speed) */}
      <div className="grid grid-cols-2 md:flex items-center gap-3 overflow-x-auto no-scrollbar pb-3 ">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onFilterChange({ type: propertyType === "CONDO" ? "ALL" : "CONDO" })
          }
          className={cn(
            "rounded-full h-11 px-6 text-[11px] font-semibold uppercase transition-all whitespace-nowrap shadow-xs shrink-0",
            propertyType === "CONDO"
              ? "bg-blue-600 text-white border-blue-600 shadow-blue-200"
              : "bg-white text-slate-500 border-slate-200",
          )}
        >
          <Building className="mr-2 h-3.5 w-3.5" /> คอนโด
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onFilterChange({ type: propertyType === "HOUSE" ? "ALL" : "HOUSE" })
          }
          className={cn(
            "rounded-full h-11 px-6 text-[11px] font-semibold uppercase transition-all whitespace-nowrap shadow-xs shrink-0",
            propertyType === "HOUSE"
              ? "bg-blue-600 text-white border-blue-600 shadow-blue-200"
              : "bg-white text-slate-500 border-slate-200",
          )}
        >
          <Home className="mr-2 h-3.5 w-3.5" /> บ้านเดี่ยว
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onFilterChange({ listing: listingType === "SALE" ? "ALL" : "SALE" })
          }
          className={cn(
            "rounded-full h-11 px-6 text-[11px] font-semibold uppercase transition-all whitespace-nowrap shadow-xs shrink-0",
            listingType === "SALE"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-200"
              : "bg-white text-slate-500 border-slate-200",
          )}
        >
          <Tag className="mr-2 h-3.5 w-3.5" /> เฉพาะขาย
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onFilterChange({ listing: listingType === "RENT" ? "ALL" : "RENT" })
          }
          className={cn(
            "rounded-full h-11 px-6 text-[11px] font-semibold uppercase transition-all whitespace-nowrap shadow-xs shrink-0",
            listingType === "RENT"
              ? "bg-amber-600 text-white border-amber-600 shadow-amber-200"
              : "bg-white text-slate-500 border-slate-200",
          )}
        >
          <Key className="mr-2 h-3.5 w-3.5" /> สำหรับเช่า
        </Button>
      </div>
    </div>
  );
}
