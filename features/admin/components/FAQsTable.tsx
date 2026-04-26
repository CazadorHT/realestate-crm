"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, HelpCircle, RotateCcw, Trash, AlertTriangle, Eye, Search, X } from "lucide-react";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkMoveToTrashAction, emptyFaqTrashAction } from "@/features/admin/faqs-bulk-actions";
import { moveToTrashAction, restoreFaqAction, permanentDeleteFaqAction } from "@/features/admin/faqs-actions";
import { toast } from "sonner";
import { useState  } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Loader2 } from "lucide-react";
import { EditFAQDialog } from "./EditFAQDialog";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useDebounce } from "use-debounce";
import { useEffect } from "react";
import { Database } from "@/lib/database.types";

type FAQ = Database["public"]["Tables"]["faqs"]["Row"];

interface FAQsTableProps {
  faqs: FAQ[];
  totalCount: number;
  currentPage: number;
  activeTab: string;
  activeCount: number;
  trashCount: number;
  isSuperAdmin?: boolean;
}

export function FAQsTable({ 
  faqs, 
  totalCount, 
  currentPage, 
  activeTab,
  activeCount,
  trashCount,
  isSuperAdmin = false
}: FAQsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [deleteConfirmFaq, setDeleteConfirmFaq] = useState<FAQ | null>(null);
  const [permanentDeleteFaq, setPermanentDeleteFaq] = useState<FAQ | null>(null);
  const [restoreConfirmFaq, setRestoreConfirmFaq] = useState<FAQ | null>(null);
  const [isEmptyTrashConfirm, setIsEmptyTrashConfirm] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [navigatingTab, setNavigatingTab] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState(searchParams.get("q") || "");
  const [debouncedSearchValue] = useDebounce(searchValue, 500);
  
  const isTrash = activeTab === "trash";
  const allIds = useMemo(() => faqs?.map((f) => f.id) || [], [faqs]);
  
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

  const handleSuccessFeedback = () => {
    router.refresh();
  };

  const handleTabChange = (value: string) => {
    if (value === activeTab) return;
    setNavigatingTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", value);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
    clearSelection();
  };

  useEffect(() => {
    const currentQ = searchParams.get("q") || "";
    if (debouncedSearchValue === currentQ) return;

    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearchValue) {
      params.set("q", debouncedSearchValue);
      params.set("page", "1");
    } else {
      params.delete("q");
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [debouncedSearchValue, pathname, router, searchParams]);

  const handleBulkTrash = async () => {
    const ids = Array.from(selectedIds);
    setIsLoading(true);
    const result = await bulkMoveToTrashAction(ids);
    setIsLoading(false);
    if (result.success) {
      toast.success(result.message);
      clearSelection();
      handleSuccessFeedback();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleEmptyTrash = async () => {
    setIsLoading(true);
    const result = await emptyFaqTrashAction();
    setIsLoading(false);
    if (result.success) {
      toast.success(result.message);
      setIsEmptyTrashConfirm(false);
      handleSuccessFeedback();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleMoveToTrash = async (faq: FAQ) => {
    setIsLoading(true);
    try {
      const res = await moveToTrashAction(faq.id);
      if (res.success) {
        toast.success(res.message);
        handleSuccessFeedback();
      } else {
        toast.error(res.message);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่รู้จัก";
      toast.error("เกิดข้อผิดพลาดในการย้ายลงถังขยะ: " + message);
    } finally {
      setIsLoading(false);
      setDeleteConfirmFaq(null);
    }
  };

  const handleRestore = async (faq: FAQ) => {
    setIsLoading(true);
    try {
      const res = await restoreFaqAction(faq.id);
      if (res.success) {
        toast.success(res.message);
        handleSuccessFeedback();
      } else {
        toast.error(res.message);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่รู้จัก";
      toast.error("เกิดข้อผิดพลาดในการกู้คืนข้อมูล: " + message);
    } finally {
      setIsLoading(false);
      setRestoreConfirmFaq(null);
    }
  };

  const handlePermanentDelete = async (faq: FAQ) => {
    setIsLoading(true);
    try {
      const res = await permanentDeleteFaqAction(faq.id);
      if (res.success) {
        toast.success(res.message);
        handleSuccessFeedback();
      } else {
        toast.error(res.message);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่รู้จัก";
      toast.error("เกิดข้อผิดพลาดในการลบข้อมูลถาวร: " + message);
    } finally {
      setIsLoading(false);
      setPermanentDeleteFaq(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 h-12 rounded-2xl border border-slate-200">
            <TabsTrigger 
              value="active" 
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-bold transition-all relative"
            >
              {navigatingTab === "active" && (
                <Loader2 className="absolute -left-1 h-3 w-3 animate-spin text-blue-600" />
              )}
              ใช้งานปกติ ({activeCount})
            </TabsTrigger>
            <TabsTrigger 
              value="trash"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-rose-600 font-bold transition-all relative"
            >
              {navigatingTab === "trash" && (
                <Loader2 className="absolute -left-1 h-3 w-3 animate-spin text-rose-600" />
              )}
              ถังขยะ ({trashCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="ค้นหาคำถามหรือคำตอบ..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 pr-10 h-11 bg-slate-100 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:bg-white transition-all font-medium"
            />
            {searchValue && (
              <button 
                onClick={() => setSearchValue("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="h-3 w-3 text-slate-500" />
              </button>
            )}
          </div>

          {isTrash && isSuperAdmin && trashCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEmptyTrashConfirm(true)}
              className="h-11 px-4 text-rose-600 border-rose-200 bg-rose-50/50 hover:bg-rose-50 rounded-xl font-bold transition-all"
            >
              <Trash className="w-4 h-4 mr-2" />
              ล้างถังขยะ
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        {isSuperAdmin && (
          <BulkActionToolbar
            selectedCount={selectedCount}
            onClear={clearSelection}
            onDelete={isTrash ? async () => {} : handleBulkTrash}
            entityName="คำถาม"
            onDeleteLabel={isTrash ? "กู้คืนข้อมูล" : "ย้ายลงถังขยะ"}
          />
        )}

        {/* Desktop Table View */}
        <div className="hidden lg:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-in fade-in duration-500">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-200">
                <TableHead className="w-[50px] px-6 py-4">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={() => toggleSelectAll(allIds)}
                    aria-label="เลือกทั้งหมด"
                    className="rounded-md border-slate-300"
                  />
                </TableHead>
                <TableHead className="w-[80px] font-bold text-[11px] uppercase tracking-wider text-slate-500 px-6">
                  ลำดับ
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500 px-6">
                  คำถามสำคัญ
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500 px-6">
                   หมวดหมู่คำถาม
                </TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider text-slate-500 px-6">
                  {isTrash ? "ลบเมื่อ" : "สถานะ"}
                </TableHead>
                {isSuperAdmin && (
                  <TableHead className="text-right font-bold text-[11px] uppercase tracking-wider text-slate-500 px-6">
                    จัดการข้อมูล
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-4 bg-slate-50 rounded-full">
                        <HelpCircle className="h-10 w-10 text-slate-200" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-600">
                          {isTrash ? "ไม่มีรายการในถังขยะ" : "ยังไม่มีข้อมูลคำถามที่พบบ่อย"}
                        </p>
                        <p className="text-sm text-slate-400">
                          {isTrash ? "ข้อมูลที่ถูกลบชั่วคราวจะมาแสดงที่นี่" : "สร้างคำถามแรกของคุณเพื่อเริ่มต้นใช้งาน"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                faqs.map((faq) => (
                  <TableRow
                    key={faq.id}
                    className={cn(
                      "group hover:bg-slate-50/80 transition-all duration-200 border-b border-slate-100",
                      isSelected(faq.id) ? "bg-blue-50/50" : ""
                    )}
                  >
                    <TableCell className="px-6 py-4">
                      <Checkbox
                        checked={isSelected(faq.id)}
                        onCheckedChange={() => toggleSelect(faq.id)}
                        aria-label={`เลือก ${faq.question}`}
                        className="rounded-md"
                      />
                    </TableCell>
                    <TableCell className="px-6">
                      <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        #{faq.sort_order ?? "-"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {faq.question}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                           <Eye className="h-3 w-3 text-slate-400" />
                           <span className="text-[10px] text-slate-400">{faq.view_count ?? 0} ครั้ง</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6">
                      {faq.category ? (
                        <Badge
                          variant="outline"
                          className="font-bold text-[10px] bg-slate-50/50 border-slate-200 text-slate-600 rounded-lg px-2"
                        >
                          {faq.category}
                        </Badge>
                      ) : (
                        <span className="text-slate-300 text-xs italic">ไม่ได้ระบุ</span>
                      )}
                    </TableCell>
                    <TableCell className="px-6">
                      {isTrash ? (
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(faq.deleted_at!).toLocaleDateString("th-TH", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      ) : faq.is_active ? (
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/80 shadow-none font-bold text-[10px] rounded-lg px-2">
                          ใช้งาน
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100/80 shadow-none font-bold text-[10px] rounded-lg px-2">
                          ปิดใช้งาน
                        </Badge>
                      )}
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell className="px-6 text-right">
                        {!isTrash ? (
                          <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-blue-600 hover:bg-blue-100/50 rounded-xl"
                              onClick={() => setEditingFaq(faq)}
                            >
                              <Edit className="w-4.5 h-4.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-rose-600 hover:bg-rose-100/50 rounded-xl"
                              onClick={() => setDeleteConfirmFaq(faq)}
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-emerald-600 hover:bg-emerald-100/50 rounded-xl"
                              onClick={() => setRestoreConfirmFaq(faq)}
                            >
                              <RotateCcw className="w-4.5 h-4.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-rose-600 hover:bg-rose-100/50 rounded-xl"
                              onClick={() => setPermanentDeleteFaq(faq)}
                            >
                              <Trash className="w-4.5 h-4.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200">
            <PaginationControls
              totalCount={totalCount}
              pageSize={10}
              currentPage={currentPage}
            />
          </div>
        </div>

        {/* Mobile & Tablet Card View */}
        <div className="lg:hidden space-y-4">
          {faqs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
              <HelpCircle className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="font-bold text-slate-400">ยังไม่มีข้อมูล</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className={cn(
                    "p-5 bg-white rounded-3xl border transition-all active:scale-[0.98] shadow-sm relative overflow-hidden",
                    isSelected(faq.id) ? "border-blue-200 bg-blue-50/30" : "border-slate-200"
                  )}
                  onClick={() => toggleSelect(faq.id)}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <Checkbox
                        checked={isSelected(faq.id)}
                        onCheckedChange={() => toggleSelect(faq.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg mt-1"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                           <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                             #{faq.sort_order ?? "-"}
                           </span>
                           {!isTrash ? (
                             faq.is_active ? (
                               <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] h-5 px-1.5 py-0 font-bold rounded-md">
                                 ใช้งาน
                               </Badge>
                             ) : (
                               <Badge className="bg-slate-50 text-slate-400 border-slate-100 text-[10px] h-5 px-1.5 py-0 font-bold rounded-md">
                                 ปิด
                               </Badge>
                             )
                           ) : (
                             <Badge className="bg-rose-50 text-rose-600 border-rose-100 text-[10px] h-5 px-1.5 py-0 font-bold rounded-md">
                               ในถังขยะ
                             </Badge>
                           )}
                        </div>
                        <h4 className="font-bold text-slate-900 leading-tight">
                          {faq.question}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 opacity-60">
                           <Eye className="h-3 w-3" />
                           <span className="text-[10px] font-bold">{faq.view_count ?? 0} การเข้าชม</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 gap-4">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        หมวดหมู่
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold bg-slate-50/50 max-w-full truncate block whitespace-nowrap rounded-lg px-2 py-0.5"
                      >
                        {faq.category || "ไม่ได้ระบุ"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSuperAdmin && (
                        !isTrash ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-10 px-4 text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-50 rounded-2xl font-bold transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingFaq(faq);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              แก้ไข
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 text-rose-600 border-rose-100 bg-rose-50/50 hover:bg-rose-50 rounded-2xl transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmFaq(faq);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-10 px-4 text-emerald-600 border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl font-bold transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRestoreConfirmFaq(faq);
                              }}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              กู้คืน
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 text-rose-600 border-rose-100 bg-rose-50/50 hover:bg-rose-50 rounded-2xl transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPermanentDeleteFaq(faq);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Move to Trash Dialog */}
      <ResponsiveDialog
        open={!!deleteConfirmFaq}
        onOpenChange={(open) => !open && setDeleteConfirmFaq(null)}
        title="ย้ายลงถังขยะ"
        description={
          deleteConfirmFaq ? (
            <div className="flex flex-col gap-4 py-2">
              <p className="text-slate-600">คุณแน่ใจหรือไม่ว่าต้องการย้ายคำถามนี้ลงถังขยะ? คุณสามารถกู้คืนข้อมูลได้ในภายหลัง</p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <p className="text-slate-900 font-bold mb-1 italic">"{deleteConfirmFaq.question}"</p>
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400 bg-white">
                   ID: {deleteConfirmFaq.id.slice(0, 8)}...
                </Badge>
              </div>
            </div>
          ) : ""
        }
        footer={
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmFaq(null)}
              disabled={isLoading}
              className="flex-1 h-12 rounded-2xl font-bold text-slate-500 hover:bg-slate-100"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={() => deleteConfirmFaq && handleMoveToTrash(deleteConfirmFaq)}
              disabled={isLoading}
              variant="destructive"
              className="flex-1 h-12 rounded-2xl font-bold bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังย้าย...
                </>
              ) : (
                "ยืนยันย้ายลงถังขยะ"
              )}
            </Button>
          </div>
        }
      />

      {/* Restore Dialog */}
      <ResponsiveDialog
        open={!!restoreConfirmFaq}
        onOpenChange={(open) => !open && setRestoreConfirmFaq(null)}
        title="กู้คืนข้อมูลคืน"
        description={
          restoreConfirmFaq ? (
            <div className="flex flex-col gap-4 py-2">
              <p className="text-slate-600">คุณต้องการกู้คืนคำถามนี้กลับไปยังรายการที่ใช้งานปกติใช่ไหม?</p>
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <p className="text-emerald-900 font-bold italic">"{restoreConfirmFaq.question}"</p>
              </div>
            </div>
          ) : ""
        }
        footer={
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="ghost"
              onClick={() => setRestoreConfirmFaq(null)}
              disabled={isLoading}
              className="flex-1 h-12 rounded-2xl font-bold text-slate-500"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={() => restoreConfirmFaq && handleRestore(restoreConfirmFaq)}
              disabled={isLoading}
              className="flex-1 h-12 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 transition-all"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "ยืนยันการกู้คืน"
              )}
            </Button>
          </div>
        }
      />

      {/* Permanent Delete Dialog */}
      <ResponsiveDialog
        open={!!permanentDeleteFaq}
        onOpenChange={(open) => !open && setPermanentDeleteFaq(null)}
        title="ลบทิ้งถาวร"
        description={
          permanentDeleteFaq ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-bold">คำเตือน: การลบถาวรจะไม่สามารถกู้กลับคืนมาได้อีก!</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                 <p className="text-slate-900 font-bold italic">"{permanentDeleteFaq.question}"</p>
              </div>
            </div>
          ) : ""
        }
        footer={
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="ghost"
              onClick={() => setPermanentDeleteFaq(null)}
              disabled={isLoading}
              className="flex-1 h-12 rounded-2xl font-bold text-slate-500"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={() => permanentDeleteFaq && handlePermanentDelete(permanentDeleteFaq)}
              disabled={isLoading}
              variant="destructive"
              className="flex-1 h-12 rounded-2xl font-bold bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "ลบถาวรทันที"
              )}
            </Button>
          </div>
        }
      />

      {/* Empty Trash Confirm Dialog */}
      <ResponsiveDialog
        open={isEmptyTrashConfirm}
        onOpenChange={(open) => !open && setIsEmptyTrashConfirm(false)}
        title="ล้างถังขยะทั้งหมด"
        description={
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700">
              <AlertTriangle className="h-8 w-8 shrink-0" />
              <p className="text-sm font-bold lh-tight">
                คุณกำลังจะลบคำถามทั้งหมดในถังขยะทิ้งถาวร ({trashCount} รายการ) 
                ระบบจะไม่สามารถกู้คืนข้อมูลเหล่านี้ได้อีกในอนาคต
              </p>
            </div>
            <p className="text-center text-slate-500 px-4">กรุณายืนยันการดำเนินงานเพื่อความปลอดภัย</p>
          </div>
        }
        footer={
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="ghost"
              onClick={() => setIsEmptyTrashConfirm(false)}
              disabled={isLoading}
              className="flex-1 h-12 rounded-2xl font-bold text-slate-500"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleEmptyTrash}
              disabled={isLoading}
              variant="destructive"
              className="flex-1 h-12 rounded-2xl font-bold bg-red-600 hover:bg-red-700 shadow-xl shadow-red-100"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "ล้างถังขยะทั้งหมด"
              )}
            </Button>
          </div>
        }
      />

      <EditFAQDialog
        faq={editingFaq}
        open={!!editingFaq}
        onOpenChange={(open) => !open && setEditingFaq(null)}
        onSuccess={() => {
          handleSuccessFeedback();
        }}
      />
    </div>
  );
}
