"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  MoreHorizontal,
  Calendar,
  Users,
  Home,
  Trash2,
  Send,
  Edit,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  toggleRentNotificationRule,
  deleteRentNotificationRule,
  deleteRentNotificationRules,
  toggleRentNotificationRules,
  testSendRentNotification,
} from "@/features/rent-notifications/actions";
import { toast } from "sonner";
import { AddRuleDialog } from "./AddRuleDialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RentNotificationRule, LINEGroup, SimpleProperty } from "../types";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface RuleListProps {
  initialRules: RentNotificationRule[];
  groups: LINEGroup[];
  properties: SimpleProperty[];
  tenantId: string | null;
  totalCount: number;
  currentPage: number;
}

export function RuleList({
  initialRules,
  groups,
  properties,
  tenantId,
  totalCount,
  currentPage,
}: RuleListProps) {
  const [rules, setRules] = useState<RentNotificationRule[]>(initialRules);
  const [editingRule, setEditingRule] = useState<RentNotificationRule | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState<string | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const { t, language } = useLanguage();

  // Handle Search Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm) {
        params.set("search", searchTerm);
      } else {
        params.delete("search");
      }
      // Reset to page 1 on new search
      params.set("page", "1");
      
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, pathname, router]);

  // Sync with server data when it changes (e.g. after router.refresh())
  useEffect(() => {
    setRules(initialRules);
  }, [initialRules]);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setRules((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, is_active: !currentStatus } : r,
      ),
    );

    const res = await toggleRentNotificationRule(id, !currentStatus);
    if (!res.success) {
      toast.error("Failed to update status");
      // Revert
      setRules((prev: any) =>
        prev.map((r: any) =>
          r.id === id ? { ...r, is_active: currentStatus } : r,
        ),
      );
    }
  };

  const handleDelete = async () => {
    if (!isDeleting) return;
    const id = isDeleting;
    const res = await deleteRentNotificationRule(id);
    if (res.success) {
      toast.success("ลบรายการแล้ว");
      setRules((prev) => prev.filter((r) => r.id !== id));
      setIsDeleting(null);
    } else {
      toast.error("ลบรายการไม่สำเร็จ");
    }
  };

  const handleTestSend = async (id: string) => {
    if (isSendingTest) return;
    setIsSendingTest(id);
    const toastId = toast.loading("กำลังส่งข้อความทดสอบ...");
    try {
      const res = await testSendRentNotification(id);
      if (res.success) {
        toast.success("ส่งข้อความทดสอบแล้ว", { id: toastId });
      } else {
        toast.error("เกิดข้อผิดพลาดในการส่ง: " + res.message, { id: toastId });
      }
    } finally {
      setIsSendingTest(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`คุณแน่ใจว่าต้องการลบ ${selectedIds.length} รายการ?`)) return;

    setIsBulkActionLoading(true);
    const res = await deleteRentNotificationRules(selectedIds);
    if (res.success) {
      toast.success(`ลบ ${selectedIds.length} รายการเรียบร้อยแล้ว`);
      setRules((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      setSelectedIds([]);
    } else {
      toast.error("ล้มเหลวในการลบรายการแบบกลุ่ม");
    }
    setIsBulkActionLoading(false);
  };

  const handleBulkToggle = async (active: boolean) => {
    if (selectedIds.length === 0) return;
    setIsBulkActionLoading(true);
    const res = await toggleRentNotificationRules(selectedIds, active);
    if (res.success) {
      toast.success(`${active ? "เปิด" : "ปิด"}การใช้งาน ${selectedIds.length} รายการแล้ว`);
      setRules((prev) =>
        prev.map((r) =>
          selectedIds.includes(r.id) ? { ...r, is_active: active } : r,
        ),
      );
      setSelectedIds([]);
    } else {
      toast.error("ล้มเหลวในการเปลี่ยนสถานะรายการแบบกลุ่ม");
    }
    setIsBulkActionLoading(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === rules.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rules.map((r) => r.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const formatLastSent = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: language === "th" ? th : enUS,
      });
    } catch {
      return "-";
    }
  };

  const allSelected = rules.length > 0 && selectedIds.length === rules.length;

  if (rules.length === 0) {
    return (
      <div className="p-16 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Calendar className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          ยังไม่มีการตั้งค่าแจ้งเตือน
        </h3>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
          เริ่มต้นสร้างการแจ้งเตือนอัตโนมัติเพื่อให้บอทช่วยตามค่าเช่าและแจ้งเตือนเมื่อสัญญาใกล้สิ้นสุด
        </p>
        <AddRuleDialog
          groups={groups}
          properties={properties}
          tenantId={tenantId}
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="ค้นหาทรัพย์ หรือ ชื่อกลุ่ม..."
            className="pl-10 h-10 bg-white border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <span className="text-sm font-medium text-blue-700 mr-2">
              เลือก {selectedIds.length} รายการ
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 bg-white border-blue-200 text-blue-700 hover:bg-blue-100"
              disabled={isBulkActionLoading}
              onClick={() => handleBulkToggle(true)}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              เปิด
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 bg-white border-blue-200 text-slate-600 hover:bg-slate-100"
              disabled={isBulkActionLoading}
              onClick={() => handleBulkToggle(false)}
            >
              <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
              ปิด
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 bg-white border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={isBulkActionLoading}
                >
                  จัดการแบบกลุ่ม
                  <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  ลบที่เลือกทั้งหมด
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-slate-400 hover:text-slate-600"
              onClick={() => setSelectedIds([])}
            >
              ยกเลิก
            </Button>
          </div>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            {tenantId === "ALL" && <TableHead>สาขา (Branch)</TableHead>}
            <TableHead>ทรัพย์ (Property)</TableHead>
            <TableHead>กลุ่มไลน์ (LINE Group)</TableHead>
            <TableHead>การแจ้งเตือน</TableHead>
            <TableHead>ส่งล่าสุด</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead className="text-right whitespace-nowrap">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-slate-400">
                ไม่พบข้อมูลที่ตรงกับการค้นหา
              </TableCell>
            </TableRow>
          ) : (
            rules.map((rule) => (
              <TableRow key={rule.id} className={selectedIds.includes(rule.id) ? "bg-blue-50/50" : ""}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(rule.id)}
                    onCheckedChange={() => toggleSelectOne(rule.id)}
                  />
                </TableCell>
                {tenantId === "ALL" && (
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-slate-100 text-slate-700 border-slate-200 whitespace-nowrap font-normal"
                    >
                      {rule.tenants?.name || "Global"}
                    </Badge>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden border border-slate-100">
                      {rule.properties?.property_images?.[0]?.image_url ? (
                        <img
                          src={rule.properties.property_images[0].image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Home className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="max-w-[200px] lg:max-w-[300px]">
                      <div className="font-semibold text-slate-900 line-clamp-1 leading-tight text-sm">
                        {rule.properties?.title || "Unknown Property"}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-medium">
                        ID: {rule.property_id.split("-")[0]}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                      {(() => {
                        const group = Array.isArray(rule.line_groups)
                          ? rule.line_groups[0]
                          : rule.line_groups;
                        return group?.picture_url ? (
                          <img
                            src={group.picture_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-4 h-4 text-slate-400" />
                        );
                      })()}
                    </div>
                    <span
                      className="text-xs truncate max-w-[120px] font-medium text-slate-600"
                      title={
                        (Array.isArray(rule.line_groups)
                          ? rule.line_groups[0]
                          : rule.line_groups
                        )?.group_name ?? undefined
                      }
                    >
                      {(Array.isArray(rule.line_groups)
                        ? rule.line_groups[0]
                        : rule.line_groups
                      )?.group_name || "Unknown Group"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-blue-500" />
                      ทุกวันที่ {rule.notification_day}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      สัญญาจบ: {(() => {
                        const contracts =
                          rule.properties?.deals?.[0]?.rental_contracts || [];
                        const latestContract = contracts[0];
                        if (!latestContract?.end_date) return "-";
                        return new Date(latestContract.end_date).toLocaleDateString(
                          language === "th" ? "th-TH" : "en-US",
                          { month: "short", year: "numeric" }
                        );
                      })()}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {formatLastSent(rule.last_sent_at)}
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={rule.is_active ?? true}
                    onCheckedChange={() => handleToggle(rule.id, rule.is_active ?? true)}
                    className="scale-90"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full">
                        <MoreHorizontal className="h-4 w-4 text-slate-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">จัดการ</DropdownMenuLabel>
                      <DropdownMenuItem 
                        className="cursor-pointer text-sm" 
                        onClick={() => handleTestSend(rule.id)}
                        disabled={isSendingTest === rule.id}
                      >
                        <Send className="mr-2 h-4 w-4 text-blue-500" />
                        ส่งข้อความทดสอบ
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => setEditingRule(rule)}>
                        <Edit className="mr-2 h-4 w-4 text-slate-500" /> แก้ไขกฎ
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 cursor-pointer text-sm font-medium"
                        onClick={() => setIsDeleting(rule.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        ลบทิ้ง
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Edit Dialog */}
      {editingRule && (
        <AddRuleDialog
          groups={groups}
          properties={properties}
          existingRule={editingRule}
          tenantId={tenantId}
          open={!!editingRule}
          onOpenChange={(open: boolean) => !open && setEditingRule(null)}
        />
      )}

      {/* Standardized Pagination Controls */}
      <div className="mt-6 pt-6 border-t border-slate-100">
        <PaginationControls
          totalCount={totalCount}
          pageSize={20}
          currentPage={currentPage}
        />
      </div>

      {/* Confirm Deletion */}
      <ConfirmDialog
        open={!!isDeleting}
        onOpenChange={(open) => !open && setIsDeleting(null)}
        title={t("common.confirm")}
        description={t("common.are_you_sure")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
