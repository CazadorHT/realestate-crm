"use client";

import { useMemo, useTransition, useState, useEffect } from "react";
import { differenceInHours } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  ChevronRight,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Search,
  X,
} from "lucide-react";
import { FaPhone, FaLine, FaFacebook, FaChevronRight } from "react-icons/fa6";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { OwnerRowActions } from "@/components/owners/OwnerRowActions";
import { CreateOwnerDialog } from "@/components/owners/CreateOwnerDialog";
import type { Owner } from "@/features/owners/types";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import {
  bulkDeleteOwnersAction,
  bulkMoveOwnersToTenantAction,
  getAllOwnerIdsAction,
} from "@/features/owners/bulk-actions";
import { exportOwnersAction } from "@/features/owners/export-action";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { PaginationControls } from "@/components/ui/pagination-controls";

import { useLanguage } from "@/components/providers/LanguageProvider";

interface OwnersTableProps {
  owners: (Owner & {
    property_count?: number;
    tenants?: { name: string } | null;
    tenant_id?: string | null;
  })[];
  showBranch?: boolean;
  isAdmin?: boolean;
  isMultiTenant?: boolean;
  currentTenantId?: string | null;
  currentTenantName?: string | null;
  count?: number;
  q?: string;
  ownerType?: string;
}

export function OwnersTable({
  owners,
  showBranch,
  isAdmin,
  isMultiTenant,
  currentTenantId,
  currentTenantName,
  count = 0,
  q = "",
  ownerType = "ALL",
}: OwnersTableProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const allIds = useMemo(() => owners.map((o) => o.id), [owners]);
  const {
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isPartialSelected,
    selectedCount,
    selectedIds,
  } = useTableSelection(allIds);

  const [isPending, startTransition] = useTransition();
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState(q);
  const [selectedOwnerType, setSelectedOwnerType] = useState(ownerType);

  useEffect(() => {
    setSearchTerm(q);
  }, [q]);

  useEffect(() => {
    setSelectedOwnerType(ownerType);
  }, [ownerType]);

  const performSearch = (term: string, type: string) => {
    const currentQ = searchParams.get("q") || "";
    const currentOwnerType = searchParams.get("owner_type") || "ALL";

    if (term !== currentQ || type !== currentOwnerType) {
      const params = new URLSearchParams(searchParams.toString());
      if (term.trim()) {
        params.set("q", term.trim());
      } else {
        params.delete("q");
      }

      if (type && type !== "ALL") {
        params.set("owner_type", type);
      } else {
        params.delete("owner_type");
      }

      params.set("page", "1");
      startTransition(() => {
        router.push(`/protected/owners?${params.toString()}`);
      });
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(searchTerm, selectedOwnerType);
    }, 700);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedOwnerType]);

  const handleSelectAllGlobal = async () => {
    setIsGlobalLoading(true);
    try {
      const result = await getAllOwnerIdsAction({
        q,
        allBranches: showBranch,
      });
      if (result.success && result.ids) {
        toggleSelectAll(result.ids);
        toast.info(isEn ? `Selected all ${result.ids.length} owners` : `เลือกทั้งหมด ${result.ids.length} รายการแล้ว`);
      }
    } catch (err) {
      toast.error(isEn ? "Failed to select all" : "ไม่สามารถเลือกทั้งหมดได้");
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const ids = Array.from(selectedIds);
        const result = await bulkDeleteOwnersAction(ids);
        if (result.success) {
          toast.success(result.message);
          clearSelection();
        } else {
          toast.error(result.message || (isEn ? "Error occurred" : "เกิดข้อผิดพลาด"));
        }
        resolve();
      });
    });
  };

  const pullableCount = useMemo(() => {
    return Array.from(selectedIds).filter((id) => {
      const o = owners.find((item) => item.id === id);
      return o?.tenant_id === null || o?.tenant_id === undefined;
    }).length;
  }, [selectedIds, owners]);

  const pullConfirmMessage = useMemo(() => {
    const total = selectedCount;
    const canPull = pullableCount;

    if (total === 0) return null;

    const skippedOwners = Array.from(selectedIds)
      .map((id) => owners.find((o) => o.id === id))
      .filter((o) => o && o.tenant_id !== null);

    const skippedBranches = Array.from(
      new Set(
        skippedOwners.map((o) => {
          const name = o?.tenants?.name || (isEn ? "Unknown branch" : "ไม่ทราบสาขา");
          if (o?.tenant_id === currentTenantId && currentTenantName) {
            return isEn ? `${currentTenantName} (Your branch)` : `${currentTenantName} (สาขาคุณ)`;
          }
          return name;
        }),
      ),
    );

    return (
      <span className="space-y-2 block text-left">
        <span>
          {isEn ? (
            <>
              You are about to pull <strong className="text-foreground">{canPull}</strong> unassigned owners to your branch.
            </>
          ) : (
            <>
              คุณกำลังจะดึง <strong className="text-foreground">{canPull}</strong>{" "}
              รายชื่อเจ้าของที่ยังไม่มีสาขา มายังสาขาของคุณ
            </>
          )}
        </span>
        {total > canPull && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
            <p className="font-medium mb-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {isEn
                ? `⚠️ System will skip ${total - canPull} owners already assigned to a branch`
                : `⚠️ ระบบจะข้าม ${total - canPull} รายการที่มีสาขาอยู่แล้ว`}
            </p>
            {skippedBranches.length > 0 && (
              <div className="mt-1 pl-4 border-l border-amber-200">
                {skippedBranches.map((branch, idx) => (
                  <div key={idx} className="opacity-80">
                    • {branch}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </span>
    );
  }, [
    selectedCount,
    pullableCount,
    selectedIds,
    owners,
    currentTenantId,
    currentTenantName,
    isEn,
  ]);

  const handleBulkPull = async () => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const ids = Array.from(selectedIds);
        const result = await bulkMoveOwnersToTenantAction(ids);
        if (result.success) {
          toast.success(result.message);
          clearSelection();
        } else {
          toast.error(result.message || (isEn ? "Error occurred" : "เกิดข้อผิดพลาด"));
        }
        resolve();
      });
    });
  };

  const hasActiveFilters = q !== "" || (ownerType && ownerType !== "ALL");

  if (owners.length === 0 && !hasActiveFilters) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          {isEn ? "No owners in system yet" : "ยังไม่มีเจ้าของทรัพย์"}
        </p>
        <div className="mt-4 flex justify-center">
          <CreateOwnerDialog />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 🔍 Search & Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60 shadow-xs animate-in fade-in duration-200">
        <div className="relative w-full md:max-w-md group">
          {isPending ? (
            <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 animate-spin" />
          ) : (
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          )}
          <Input
            placeholder={
              isEn
                ? "Search owner name, phone, LINE ID (Press Enter)..."
                : "ค้นหาชื่อเจ้าของ, เบอร์โทร, LINE ID (กด Enter เพื่อค้นหาทันที)..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                performSearch(searchTerm, selectedOwnerType);
              }
            }}
            className="pl-10 pr-10 h-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-150 focus-visible:border-indigo-500 transition-all duration-200 shadow-xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                performSearch("", selectedOwnerType);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:bg-slate-100 p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <Select value={selectedOwnerType} onValueChange={setSelectedOwnerType}>
            <SelectTrigger className="w-full md:w-[180px] h-11 rounded-xl border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-xs cursor-pointer">
              <SelectValue placeholder={isEn ? "Owner Type" : "ประเภทเจ้าของ"} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL">{isEn ? "All Types" : "ทุกประเภท"}</SelectItem>
              <SelectItem value="INDIVIDUAL">{isEn ? "Individual" : "บุคคลธรรมดา"}</SelectItem>
              <SelectItem value="COMPANY">{isEn ? "Company" : "ในนามบริษัท"}</SelectItem>
              <SelectItem value="CO_BROKER">Co-broker</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        onPull={
          isMultiTenant &&
          currentTenantId &&
          currentTenantId !== "ALL" &&
          !showBranch
            ? handleBulkPull
            : undefined
        }
        onPullLabel={isEn ? "Pull to My Branch" : "ดึงมาสาขาตัวเอง"}
        onPullConfirmMessage={pullConfirmMessage}
        onExport={() => exportOwnersAction(Array.from(selectedIds))}
        entityName={isEn ? "owner" : "เจ้าของ"}
        className={isPending ? "opacity-50 pointer-events-none" : ""}
      />

      {/* Global Selection Indicator */}
      {isAllSelected && selectedCount < count && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm">
          <div className="flex items-center gap-3 text-sm text-blue-800">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            <span>
              {isEn
                ? `Selected all ${selectedCount} owners on this page`
                : `เลือกทั้งหมด ${selectedCount} รายชื่อในหน้านี้แล้ว`}
            </span>
          </div>
          <button
            onClick={handleSelectAllGlobal}
            disabled={isGlobalLoading}
            className="text-sm font-bold text-blue-700 hover:text-blue-900 px-4 py-1.5 bg-white rounded-lg border border-blue-200 shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            {isGlobalLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : null}
            {isEn
              ? `Select all ${count} owners in system`
              : `เลือกทั้งหมด ${count} รายชื่อในระบบ`}
          </button>
        </div>
      )}

      {selectedCount === count && count > owners.length && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between animate-in fade-in duration-300">
          <div className="flex items-center gap-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>
              {isEn ? (
                <>
                  You have selected all <strong>{count}</strong> owners in the system (all pages)
                </>
              ) : (
                <>
                  คุณได้เลือกทั้งหมด <strong>{count}</strong> รายชื่อในระบบแล้ว (ทุกหน้า)
                </>
              )}
            </span>
          </div>
          <button
            onClick={clearSelection}
            className="text-sm font-bold text-emerald-700 hover:text-emerald-900 px-4 py-1.5 bg-white rounded-lg border border-emerald-200 shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            {isEn ? "Clear Selection" : "ยกเลิกการเลือก"}
          </button>
        </div>
      )}

      <div className={cn("border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm transition-opacity duration-300", isPending && "opacity-50 pointer-events-none")}>
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={() => toggleSelectAll(allIds)}
                    aria-label={isEn ? "Select all" : "เลือกทั้งหมด"}
                    className={
                      isPartialSelected
                        ? "data-[state=checked]:bg-primary/50"
                        : ""
                    }
                  />
                </TableHead>
                <TableHead>{isEn ? "Name" : "ชื่อ"}</TableHead>
                {showBranch && <TableHead>{isEn ? "Branch" : "สาขา"}</TableHead>}
                <TableHead>{isEn ? "Phone" : "เบอร์โทร"}</TableHead>
                <TableHead>LINE</TableHead>
                <TableHead>Facebook</TableHead>
                <TableHead>{isEn ? "Created By" : "ผู้บันทึก"}</TableHead>
                <TableHead className="text-right">{isEn ? "Properties" : "จำนวนทรัพย์"}</TableHead>
                <TableHead className="text-right">{isEn ? "Actions" : "จัดการ"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {owners.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={showBranch ? 10 : 9}
                    className="text-center py-12 text-slate-400 font-semibold text-sm bg-slate-50/20"
                  >
                    {isEn ? "No property owners match your filters" : "ไม่พบข้อมูลเจ้าของทรัพย์ที่ตรงตามตัวเลือก"}
                  </TableCell>
                </TableRow>
              ) : (
                owners.map((owner) => (
                  <TableRow
                    key={owner.id}
                    className={isSelected(owner.id) ? "bg-blue-50/50" : ""}
                  >
                    <TableCell className="w-[50px]">
                      <Checkbox
                        checked={isSelected(owner.id)}
                        onCheckedChange={() => toggleSelect(owner.id)}
                        aria-label={`${isEn ? "Select" : "เลือก"} ${owner.full_name}`}
                      />
                    </TableCell>
                    {/* ชื่อ Owner */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="font-medium text-blue-700">
                          <div
                            className="underline cursor-pointer relative inline-block"
                            onClick={() => {
                              setNavigatingId(owner.id);
                              router.push(`/protected/owners/${owner.id}`);
                            }}
                          >
                            {navigatingId === owner.id && (
                              <Loader2 className="h-3 w-3 animate-spin text-blue-600 absolute -left-4 top-1" />
                            )}
                            {owner.full_name}
                          </div>
                        </div>
                        {owner.created_at &&
                          differenceInHours(
                            new Date(),
                            new Date(owner.created_at),
                          ) < 24 && (
                            <div className="w-fit">
                              <div className="bg-amber-500 text-white text-[11px] px-1.5 py-0.5 rounded-md font-bold uppercase shadow-sm">
                                NEW
                              </div>
                            </div>
                          )}
                      </div>
                    </TableCell>
                    {/* สาขา */}
                    {showBranch && (
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-normal capitalize"
                        >
                          {owner.tenants?.name || "-"}
                        </Badge>
                      </TableCell>
                    )}
                    {/* เบอร์โทร */}
                    <TableCell>
                      {owner.phone ? (
                        <a
                          href={`tel:${owner.phone}`}
                          className="hover:underline"
                        >
                          {owner.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {/* LINE */}
                    <TableCell className="max-w-sm! truncate">
                      {owner.line_id ? (
                        <a
                          href={`https://line.me/ti/p/~${owner.line_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-emerald-600 font-medium max-w-sm! truncate "
                        >
                          {owner.line_id}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {/* Facebook */}
                    <TableCell>
                      {owner.facebook_url ? (
                        <a
                          href={owner.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-blue-600"
                        >
                          {isEn ? "View Profile" : "ดูโปรไฟล์"}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {/* ผู้สร้างข้อมูล */}
                    <TableCell>
                      <span className="text-sm text-slate-500 font-medium">{owner.created_by_name || "-"}</span>
                    </TableCell>
                    {/* จำนวนทรัพย์ */}
                    <TableCell className="text-right">
                      <span className="font-semibold">
                        {owner.property_count || 0}
                      </span>{" "}
                      <span className="text-muted-foreground text-sm">
                        {isEn ? "listings" : "ทรัพย์"}
                      </span>
                    </TableCell>
                    {/* จัดการ */}
                    <TableCell className="text-right">
                      <OwnerRowActions
                        owner={owner}
                        isAdmin={isAdmin}
                        isMultiTenant={isMultiTenant}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile/Tablet Card View - Premium Adaptive Grid */}
        <div className="lg:hidden p-4 bg-slate-50/30">
          <AnimatePresence mode="popLayout">
            <m.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {owners.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-400 font-semibold text-sm bg-white rounded-2xl border border-slate-200/60 shadow-xs">
                  {isEn ? "No property owners match your filters" : "ไม่พบข้อมูลเจ้าของทรัพย์ที่ตรงตามตัวเลือก"}
                </div>
              ) : (
                owners.map((owner, idx) => {
                  const isItemNew =
                    owner.created_at &&
                    differenceInHours(new Date(), new Date(owner.created_at)) <
                      24;
                  const initials = owner.full_name
                    ? owner.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "??";
                  const selected = isSelected(owner.id);

                  return (
                    <m.div
                      key={owner.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        delay: idx * 0.03,
                      }}
                      className={cn(
                        "group relative flex flex-col h-full bg-white rounded-[32px] border transition-all duration-300",
                        selected
                          ? "border-blue-500 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)] ring-2 ring-blue-500/20"
                          : "border-slate-200/60 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/50",
                      )}
                    >
                      {/* Card Header: Selection & Avatar & Actions */}
                      <div className="p-5 pb-3">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex items-center gap-3">
                            <div className="relative flex items-center justify-center h-5 w-5 shrink-0 pointer-events-auto z-10">
                              <Checkbox
                                checked={selected}
                                onCheckedChange={() => toggleSelect(owner.id)}
                                className="rounded-full h-5 w-5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                            </div>

                            <Avatar className="h-10 w-10 border-2 border-slate-50 shadow-sm shrink-0">
                              <AvatarFallback className="bg-blue-50 text-blue-600 font-semibold text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                          </div>

                          <div className="shrink-0">
                            <OwnerRowActions
                              owner={owner}
                              isAdmin={isAdmin}
                              isMultiTenant={isMultiTenant}
                            />
                          </div>
                        </div>

                        {/* Name and Basic Info */}
                        <div className="mt-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div
                              onClick={() => {
                                setNavigatingId(`m-${owner.id}`);
                                router.push(`/protected/owners/${owner.id}`);
                              }}
                              className="text-base font-semibold text-slate-900 hover:text-blue-700 hover:underline transition-colors line-clamp-1 cursor-pointer relative"
                            >
                              {navigatingId === `m-${owner.id}` && (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600 absolute -left-6 top-0.5" />
                              )}
                              {owner.full_name}
                            </div>
                            {isItemNew && (
                              <Badge className="h-4.5 px-2 text-[10px] bg-amber-500 hover:bg-amber-600 border-0 font-semibold tracking-tighter shrink-0 animate-pulse">
                                NEW
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <div className="bg-blue-50 text-[10px] font-semibold text-blue-700 px-2.5 py-1 rounded-full uppercase tracking-tighter border border-blue-100/50 flex items-center gap-1">
                              <User className="h-2.5 w-2.5" />
                              {owner.property_count || 0} {isEn ? "Properties" : "ทรัพย์สิน"}
                            </div>
                            {showBranch && owner.tenants?.name && (
                              <div className="bg-slate-100 text-[10px] font-semibold text-slate-600 px-2.5 py-1 rounded-full uppercase tracking-tighter border border-slate-200/50">
                                {isEn ? "Branch: " : "สาขา: "}{owner.tenants.name}
                              </div>
                            )}
                            {owner.created_by_name && (
                              <div className="bg-purple-50 text-[10px] font-semibold text-purple-700 px-2.5 py-1 rounded-full uppercase tracking-tighter border border-purple-100/50">
                                {isEn ? "By: " : "โดย: "}{owner.created_by_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-slate-100/80 mx-5" />

                      {/* Card Body: Contact Action Pills (Hardened Layout) */}
                      <div className="p-5 pt-4 flex-1">
                        <div className="grid grid-cols-1 gap-2">
                          {/* Phone Pill */}
                          <a
                            href={owner.phone ? `tel:${owner.phone}` : "#"}
                            className={cn(
                              "flex items-center justify-between min-h-[46px] w-full px-4 rounded-2xl transition-all font-semibold text-sm",
                              owner.phone
                                ? "bg-blue-50/50 text-blue-700 hover:bg-blue-600 hover:text-white shadow-xs"
                                : "bg-slate-50 text-slate-300 pointer-events-none cursor-not-allowed",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <FaPhone className="h-3.5 w-3.5 mb-0.5" />
                              <span>{owner.phone || (isEn ? "No phone" : "ไม่มีเบอร์โทร")}</span>
                            </div>
                            {owner.phone && (
                              <FaChevronRight className="h-3 w-3 opacity-50" />
                            )}
                          </a>

                          <div className="grid grid-cols-2 gap-2">
                            {/* LINE Pill */}
                            <a
                              href={owner.line_id ? `https://line.me/ti/p/~${owner.line_id}` : "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "flex items-center justify-center gap-2 min-h-[46px] rounded-2xl transition-all font-semibold text-sm px-2",
                                owner.line_id
                                  ? "bg-emerald-50/50 text-emerald-700 border border-emerald-100/50 hover:bg-emerald-600 hover:text-white"
                                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed pointer-events-none",
                              )}
                            >
                              <FaLine className="h-4 w-4 shrink-0 mb-0.5" />
                              <span className="truncate">
                                {owner.line_id || "LINE"}
                              </span>
                            </a>

                            {/* Facebook Action */}
                            <a
                              href={owner.facebook_url || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "flex items-center justify-center gap-2 min-h-[46px] rounded-2xl transition-all font-semibold text-sm px-2",
                                owner.facebook_url
                                  ? "bg-indigo-50/50 text-indigo-700 border border-indigo-100/50 hover:bg-indigo-600 hover:text-white shadow-xs"
                                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed",
                              )}
                            >
                              <FaFacebook className="h-4 w-4 shrink-0 mb-0.5" />
                              <span>Facebook</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </m.div>
                  );
                })
              )}
            </m.div>
          </AnimatePresence>
        </div>
      </div>

      <PaginationControls
        totalCount={count}
        pageSize={10}
        currentPage={currentPage}
      />
    </div>
  );
}
