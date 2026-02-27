"use client";

import { useState, useEffect } from "react";
import { getGlobalPropertiesTableDataAction } from "@/features/properties/actions";
import { getTenantsAction } from "@/lib/actions/tenant-management";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Building2,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  CreditCard,
  Target,
  ArrowUpRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function GlobalInventoryPage() {
  const [data, setData] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  // Filter States
  const [propertyType, setPropertyType] = useState("ALL");
  const [listingType, setListingType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [targetTenantId, setTargetTenantId] = useState("ALL");
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getGlobalPropertiesTableDataAction({
        page,
        q: query,
        propertyType,
        listingType,
        status,
        targetTenantId,
      });
      setData(result.tableData);
      setCount(result.count);
    } catch (error) {
      toast.error("ไม่สามารถดึงข้อมูลคลังทรัพย์สินรวมได้");
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await getTenantsAction();
      if (res.data) {
        setTenants(res.data);
      }
    } catch (error) {
      console.error("fetchTenants error:", error);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, propertyType, listingType, status, targetTenantId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const resetFilters = () => {
    setPropertyType("ALL");
    setListingType("ALL");
    setStatus("ALL");
    setTargetTenantId("ALL");
    setQuery("");
    setPage(1);
  };

  const activeFiltersCount = [
    propertyType !== "ALL",
    listingType !== "ALL",
    status !== "ALL",
    targetTenantId !== "ALL",
  ].filter(Boolean).length;

  const totalPages = Math.ceil(count / 10);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 space-y-8 animate-in fade-in duration-700">
      {/* Header Section (Kept as requested but reduced bold) */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200 px-6 py-8 rounded-b-3xl shadow-sm">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-7xl mx-auto">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-semibold uppercase tracking-wider mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Centralized Hub
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              <Layers className="h-8 w-8 text-blue-600" />
              คลังทรัพย์สินรวม
            </h1>
            <p className="text-slate-500 text-base max-w-xl">
              ระบบสืบค้นและบริหารจัดการทรัพย์สินจากโครงการทุกสาขา{" "}
              <span className="text-blue-600 font-medium">
                รองรับการทำงานแบบ Cross-Selling
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-0.5 rounded-xl flex">
              <div className="bg-white px-4 py-1.5 rounded-lg shadow-sm font-semibold text-blue-600 border border-slate-200 text-sm">
                {count}{" "}
                <span className="text-slate-400 font-normal ml-1">
                  Properties
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 space-y-6">
        {/* Quick Stats Grid (Kept as requested but reduced bold) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-50 rounded-full opacity-50 group-hover:scale-125 transition-transform" />
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-2">
                <div className="p-1.5 bg-blue-50 rounded-lg w-fit">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  ทรัพย์สินทั้งหมด
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {count.toLocaleString()}
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-50 rounded-full opacity-50 group-hover:scale-125 transition-transform" />
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-2">
                <div className="p-1.5 bg-emerald-50 rounded-lg w-fit">
                  <Layers className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  ออนไลน์ (Active)
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {data.filter((i) => i.status === "ACTIVE").length}
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-orange-50 rounded-full opacity-50 group-hover:scale-125 transition-transform" />
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-2">
                <div className="p-1.5 bg-orange-50 rounded-lg w-fit">
                  <CreditCard className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  สาขาที่ร่วมรายการ
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {tenants.length}
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
            </div>
          </div>
        </div>

        {/* Action Bar (Kept as requested but reduced bold) */}
        <div className="flex flex-col lg:flex-row gap-3 items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
          <form
            onSubmit={handleSearch}
            className="relative flex-1 w-full lg:w-auto"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ค้นหาตามชื่อทรัพย์สิน, ทำเล, หรือรายละเอียด..."
              className="pl-11 h-11 border-none bg-slate-50/50 focus-visible:ring-blue-500/10 rounded-xl text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 px-5 border-slate-200 hover:bg-slate-50 rounded-xl relative text-sm font-medium"
                >
                  <Filter className="mr-2 h-4 w-4 text-slate-400" />
                  ตัวกรองขั้นสูง
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
                <div className="bg-slate-900 px-6 py-5 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold flex items-center gap-2 text-white">
                      <Filter className="h-5 w-5 text-blue-400" />
                      กรองข้อมูลละเอียด
                    </DialogTitle>
                  </DialogHeader>
                </div>

                <div className="grid gap-5 p-6">
                  <div className="space-y-1.5">
                    <Label className="text-slate-500 font-medium text-xs uppercase tracking-wider">
                      สาขาที่ดูแล
                    </Label>
                    <Select
                      value={targetTenantId}
                      onValueChange={setTargetTenantId}
                    >
                      <SelectTrigger className="h-10 rounded-xl border-slate-200">
                        <SelectValue placeholder="เลือกสาขา" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        <SelectItem value="ALL">ทุกสาขา (Global)</SelectItem>
                        {tenants.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-slate-500 font-medium text-xs uppercase tracking-wider">
                        ประเภท
                      </Label>
                      <Select
                        value={propertyType}
                        onValueChange={setPropertyType}
                      >
                        <SelectTrigger className="h-10 rounded-xl border-slate-200">
                          <SelectValue placeholder="เลือก" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                          <SelectItem value="ALL">ทั้งหมด</SelectItem>
                          <SelectItem value="CONDO">คอนโด</SelectItem>
                          <SelectItem value="HOUSE">บ้านเดี่ยว</SelectItem>
                          <SelectItem value="TOWNHOME">ทาวน์โฮม</SelectItem>
                          <SelectItem value="LAND">ที่ดิน</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-500 font-medium text-xs uppercase tracking-wider">
                        สถานะ
                      </Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="h-10 rounded-xl border-slate-200">
                          <SelectValue placeholder="เลือก" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                          <SelectItem value="ALL">ทั้งหมด</SelectItem>
                          <SelectItem value="ACTIVE">ออนไลน์</SelectItem>
                          <SelectItem value="UNDER_OFFER">ติดจอง</SelectItem>
                          <SelectItem value="SOLD">ขายแล้ว</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-500 font-medium text-xs uppercase tracking-wider">
                      การขาย/เช่า
                    </Label>
                    <Select value={listingType} onValueChange={setListingType}>
                      <SelectTrigger className="h-10 rounded-xl border-slate-200">
                        <SelectValue placeholder="ประเภทการดีล" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        <SelectItem value="ALL">ทุกประเภทการดีล</SelectItem>
                        <SelectItem value="SALE">เฉพาะขาย</SelectItem>
                        <SelectItem value="RENT">เฉพาะเช่า</SelectItem>
                        <SelectItem value="SALE_AND_RENT">
                          ขายและเช่า
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="px-6 py-5 bg-slate-50 border-t border-slate-100">
                  <DialogFooter className="flex flex-row items-center justify-between gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="text-slate-400 hover:text-red-600 rounded-xl h-10 px-4"
                    >
                      <X className="mr-2 h-4 w-4" />
                      ล้างทั้งหมด
                    </Button>
                    <Button
                      onClick={() => setIsFilterOpen(false)}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 h-10 text-sm font-medium"
                    >
                      บันทึกตัวกรอง
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={handleSearch}
              className="h-11 px-7 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/10 text-sm font-semibold transition-all hover:-translate-y-1px active:translate-y-0"
            >
              <Search className="mr-2 h-4 w-4" />
              สืบค้น
            </Button>
          </div>
        </div>

        {/* Table Reverted to Original Simple Layout but with Interactive Feedback */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                <TableHead className="font-semibold text-slate-600 text-xs uppercase px-6 py-4">
                  ชื่อทรัพย์สิน
                </TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs uppercase py-4">
                  สาขาที่ดูแล
                </TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs uppercase py-4">
                  ประเภท
                </TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs uppercase py-4">
                  ราคา
                </TableHead>
                <TableHead className="font-semibold text-slate-600 text-xs uppercase py-4">
                  สถานะ
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-600 text-xs uppercase px-6 py-4">
                  จัดการ
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell
                        colSpan={6}
                        className="h-20 animate-pulse bg-slate-50/20 px-6"
                      />
                    </TableRow>
                  ))
                : data.map((item) => (
                    <TableRow
                      key={item.id}
                      className="group hover:bg-blue-50/20 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <TableCell className="px-6 py-4">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-sm">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          ID: {item.id.split("-")[0].toUpperCase()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-blue-50/50 text-blue-700 border-blue-100 font-medium px-2 py-0.5 rounded-md text-[10px]"
                        >
                          {item.tenant_name || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-600">
                          {item.property_type || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-900 text-xs">
                          {item.price
                            ? `${item.price.toLocaleString()} ฿`
                            : "-"}
                        </div>
                        {item.rental_price && (
                          <div className="text-[9px] font-medium text-slate-500 uppercase">
                            Rent: {item.rental_price.toLocaleString()} ฿
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "font-semibold px-2.5 py-0.5 rounded-full text-[10px] uppercase border",
                            item.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                              : "bg-slate-50 text-slate-600 border-slate-200",
                          )}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-xs"
                        >
                          <Link href={`/protected/properties/${item.id}`}>
                            ดูรายละเอียด
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

              {!loading && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Layers className="h-10 w-10 text-slate-200" />
                      <p className="text-lg font-medium text-slate-500">
                        ไม่พบข้อมูลทรัพย์สิน
                      </p>
                      <p className="text-xs text-slate-400">
                        ลองสืบค้นด้วยเงื่อนไขอื่น
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Simple Pagination */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50/30 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              แสดง{" "}
              <span className="text-slate-900 font-semibold">
                {data.length}
              </span>{" "}
              จาก <span className="text-slate-900 font-semibold">{count}</span>{" "}
              รายการ
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-slate-200"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 text-slate-500" />
              </Button>
              <div className="text-xs font-semibold text-slate-700">
                หน้า {page} / {totalPages || 1}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-slate-200"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
              >
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
