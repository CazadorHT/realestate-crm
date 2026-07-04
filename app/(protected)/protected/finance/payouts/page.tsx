"use client";

import { useState, useEffect } from "react";
import { 
  Wallet, Search, Filter, ArrowUpRight, Clock, 
  CheckCircle2, AlertCircle, FileUp, History as HistoryIcon, Plus as PlusIcon, 
  ChevronDown, ShieldCheck, Loader2, Plus, Table, PieChart 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  bulkMarkAsReadyToPayAction,
  createCommissionAdjustmentAction,
  markAsPaidAction,
  markAsReadyToPayAction,
  getCommissionAuditTrailAction,
  getPayoutQueueAction,
  recalculatePayoutTotalsAction,
  getPayoutStatsAction
} from "@/features/finance/actions";
import { CommissionPayoutRecord, RecalculatePreview } from "@/features/finance/types";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from "@/components/ui/sheet";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table as TableComponent } from "@/components/ui/table";
import { usePayoutStore } from "@/features/finance/stores/payoutStore";
import { PayoutSkeleton } from "@/features/finance/components/PayoutSkeleton";
import dynamic from "next/dynamic";

const FinanceAnalytics = dynamic(() => import("@/features/finance/components/FinanceAnalytics").then(mod => mod.FinanceAnalytics), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-white/50 backdrop-blur-xl rounded-[2.5rem] border border-dashed border-slate-200">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
      <p className="text-sm font-medium text-slate-500 font-sarabun">กำลังเตรียมเครื่องมือวิเคราะห์การเงิน...</p>
    </div>
  ),
});

import { PageHeader } from "@/components/dashboard/PageHeader";
import { PayoutStats } from "@/features/finance/components/PayoutStats";
import { PayoutTable } from "@/features/finance/components/PayoutTable";
import { PayoutHistoryDrawer } from "@/features/finance/components/PayoutHistoryDrawer";
import { PayoutAdjustmentDialog } from "@/features/finance/components/PayoutAdjustmentDialog";
import { PayoutCompletionDialog } from "@/features/finance/components/PayoutCompletionDialog";
import { RecalculateConfirmDialog } from "@/features/finance/components/RecalculateConfirmDialog";
export default function PayoutDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [payouts, setPayouts] = useState<CommissionPayoutRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNPAID" | "READY_TO_PAY" | "PAID">("ALL");
  
  // 📑 Pagination State
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [globalStats, setGlobalStats] = useState({
    readyToPayAmount: 0,
    unpaidCount: 0,
    paidAmountThisMonth: 0,
    totalPoolAmount: 0
  });
  const pageSize = 50;
  
  // ✅ High Performance Store (Zustand)
  const selectedIds = usePayoutStore(state => state.selectedIds);
  const selectVisible = usePayoutStore(state => state.selectVisible);
  const clearSelection = usePayoutStore(state => state.clearSelection);
  const getTotalSelectedAmount = usePayoutStore(state => state.getTotalSelectedAmount);
  
  // Modals / Sheets State
  const [selectedPayout, setSelectedPayout] = useState<CommissionPayoutRecord | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [view, setView] = useState<'LIST' | 'ANALYTICS'>('LIST');
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalculatingIds, setRecalculatingIds] = useState<Set<string>>(new Set());
  
  // 🔍 Context Detection: Check if we are in "All Branches" mode
  const [isAllBranches, setIsAllBranches] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const activeTenantId = document.cookie.split('; ').find(row => row.startsWith('active_tenant_id='))?.split('=')[1];
      const isAll = activeTenantId === 'ALL';
      
      if (isAll) {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          if (profile && (profile.role === "ADMIN" || profile.role === "MANAGER")) {
            setIsAllBranches(false);
            return;
          }
        }
      }
      setIsAllBranches(isAll);
    };
    checkAccess();
  }, []);

  // Recalculate Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<RecalculatePreview | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);

  const fetchPayouts = async (targetPage: number = page, isFilterChange: boolean = false) => {
    if (isFilterChange) {
      setLoading(true);
    } else {
      setIsInitialLoading(true);
    }

    // [PERFORMANCE] Parallel Fetching: Table Data & Global Stats
    const [queueRes, statsRes] = await Promise.all([
      getPayoutQueueAction({ 
        page: targetPage, 
        pageSize,
        status: statusFilter === "ALL" ? undefined : statusFilter as "UNPAID" | "READY_TO_PAY" | "PAID",
      }),
      getPayoutStatsAction()
    ]);

    if (queueRes.success) {
      setPayouts(queueRes.data || []);
      setTotalCount(queueRes.totalCount);
      clearSelection(); 
    }

    if (statsRes.success && statsRes.data) {
      setGlobalStats(statsRes.data);
    }
    setLoading(false);
    setIsInitialLoading(false);
  };

  const handleRecalculate = async (id: string, isFromDialog: boolean = false) => {
    setRecalculatingIds(prev => new Set(prev).add(id));
    
    // If not from dialog, this is a "Preview Request"
    if (!isFromDialog) {
      const res = await recalculatePayoutTotalsAction(id, true);
      if (res.success && res.data) {
        setPreviewData(res.data);
        setTargetId(id);
        setIsPreviewOpen(true);
      } else {
        toast.error(res.error || "ไม่สามารถดึงข้อมูลพรีวิวได้");
      }
    } else {
      // Confirmed Recalculation
      const res = await recalculatePayoutTotalsAction(id, false);
      if (res.success) {
        toast.success(res.message);
        setIsPreviewOpen(false);
        setPreviewData(null);
        setTargetId(null);
        fetchPayouts();
      } else {
        toast.error(res.error || "คำนวณใหม่ไม่สำเร็จ");
      }
    }

    setRecalculatingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  useEffect(() => {
    fetchPayouts(page, true);
  }, [page, statusFilter]);

  const filteredPayouts = payouts.filter(p => 
    p.agent?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.property?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const visibleIds = payouts.map((p: CommissionPayoutRecord) => p.id);
  const currentTotal = getTotalSelectedAmount(payouts);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0
    }).format(amt);
  };

  if (isInitialLoading) return <PayoutSkeleton />;
 
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-indigo-50/50 via-slate-50 to-white p-4 sm:p-8 space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title={
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-semibold uppercase tracking-widest w-fit mb-1 border border-white/10">
              <ShieldCheck className="w-3 h-3" /> ศูนย์กลางการเงินปลอดภัย
            </div>
            <span>จัดการเงินและคอมมิชชัน</span>
          </div>
        }
        subtitle="แดชบอร์ดบริหารจัดการคอมมิชชันและภาษีระดับองค์กร"
        icon="pieChart"
        gradient="purple"
        breadcrumbs={[
          { label: "แดชบอร์ด", href: "/protected" },
          { label: "การเงิน", href: "/protected/finance/payouts" },
          { label: "การเบิกจ่ายเอเยนต์" }
        ]}
        actionSlot={
          <div className="flex items-center gap-3">
            {view === 'LIST' && (
              <Button 
                onClick={() => setView('ANALYTICS')}
                className="bg-white h-12 text-slate-800 hover:bg-white/90 shadow-lg font-semibold rounded-xl"
              >
                <PieChart className="w-4 h-4 mr-2" />
                วิเคราะห์การเงิน
              </Button>
            )}
            <Button 
              onClick={() => setIsAdjustmentOpen(true)}
              className="bg-white h-12 text-slate-800 hover:bg-white/90 shadow-lg font-semibold rounded-xl"
              disabled={isAllBranches}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              เพิ่มรายการปรับปรุง
            </Button>
          </div>
        }
      />

      {isAllBranches && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-3xl flex items-center gap-4 text-amber-800 animate-in slide-in-from-top-4 duration-500 shadow-sm">
           <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
           </div>
           <div>
              <p className="font-semibold text-sm">โหมดดูภาพรวม (Read-only)</p>
              <p className="text-[10px] opacity-80">คุณกำลังดูข้อมูลรวมทุกสาขา ระบบจะไม่อนุญาตให้แก้ไขตัวเลขหรือโอนเงินจนกว่าจะสลับสาขาให้ถูกต้อง</p>
           </div>
           <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto bg-white border-amber-200 text-amber-700 hover:bg-amber-100 rounded-xl font-semibold h-8 text-[10px]"
              onClick={() => {
                // Focus sidebar or dispatch a branch selector event
                const sidebar = document.getElementById('sidebar-nav');
                if (sidebar) sidebar.scrollIntoView({ behavior: 'smooth' });
                toast.info("กรุณาสลับสาขาที่เมนูด้านซ้าย");
              }}
           >
              สลับสาขาเดี๋ยวนี้
           </Button>
        </div>
      )}
 
      {view === 'ANALYTICS' ? (
        <FinanceAnalytics onBack={() => setView('LIST')} />
      ) : (
        <>
          <PayoutStats 
            readyToPayAmount={globalStats.readyToPayAmount}
            unpaidCount={globalStats.unpaidCount}
            paidAmountThisMonth={globalStats.paidAmountThisMonth}
            totalPoolAmount={globalStats.totalPoolAmount}
            formatCurrency={formatCurrency}
            isLoading={loading}
          />

          <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden p-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-slate-100/50 bg-white/50">
              <div className="relative group flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <Input
                  placeholder="ค้นหาชื่อเอเยนต์ หรือ รายการ..."
                  className="w-full h-12 pl-12 bg-slate-100/50 border-none rounded-2xl ring-0 focus-visible:ring-2 focus-visible:ring-indigo-100 transition-all font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
                {(['ALL', 'UNPAID', 'READY_TO_PAY', 'PAID'] as const).map((status) => (
                  <Button
                    key={status}
                    onClick={() => {
                        setStatusFilter(status);
                        setPage(1);
                    }}
                    variant={statusFilter === status ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-9 px-4 rounded-xl text-[10px] uppercase font-semibold tracking-wider transition-all",
                      statusFilter === status 
                        ? "bg-white text-indigo-700 shadow-sm" 
                        : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {status === 'ALL' ? 'ทั้งหมด' : 
                     status === 'UNPAID' ? 'รอดำเนินการ' : 
                     status === 'READY_TO_PAY' ? 'พร้อมจ่าย' : 'ชำระแล้ว'}
                  </Button>
                ))}
              </div>
            </div>

            <PayoutTable 
              payouts={filteredPayouts}
              isLoading={loading}
              hasActiveFilters={!!searchTerm || statusFilter !== "ALL"}
              currentPage={page}
              totalPages={Math.ceil(totalCount / pageSize) || 1}
              onPageChange={handlePageChange}
              onViewHistory={(payout: CommissionPayoutRecord) => {
                setSelectedPayout(payout);
                setIsHistoryOpen(true);
              }}
              onViewReceipt={(payout: any) => {
                setSelectedPayout(payout);
                setIsReceiptDialogOpen(true);
              }}
              onUpdate={fetchPayouts}
              onRecalculate={handleRecalculate}
              recalculatingIds={recalculatingIds}
              disabledAction={isAllBranches}
              formatCurrency={formatCurrency}
            />
          </Card>
        </>
      )}

      {/* Modular Drawers & Dialogs */}
      <PayoutHistoryDrawer 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        selectedPayout={selectedPayout}
      />

      <PayoutAdjustmentDialog 
        isOpen={isAdjustmentOpen}
        onClose={() => setIsAdjustmentOpen(false)}
        onSuccess={fetchPayouts}
        payouts={payouts}
      />

      <PayoutCompletionDialog 
        isOpen={isReceiptDialogOpen}
        onClose={() => setIsReceiptDialogOpen(false)}
        selectedPayout={selectedPayout}
        formatCurrency={formatCurrency}
        onSuccess={fetchPayouts}
      />

      <RecalculateConfirmDialog 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        isLoading={recalculatingIds.has(targetId || "")}
        previewData={previewData}
        onConfirm={() => targetId && handleRecalculate(targetId, true)}
      />

      {/* 🟢 Bulk Action Floating Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom duration-300 border border-slate-800">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-slate-400">เลือกแล้ว {selectedIds.size} รายการ</span>
            <span className="text-sm font-bold text-indigo-400">
              ยอดสุทธิรวม: {formatCurrency(currentTotal)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-4 h-10 border-none"
              onClick={async () => {
                const ids = Array.from(selectedIds);
                setLoading(true);
                const res = await bulkMarkAsReadyToPayAction(ids);
                if (res.success) {
                  toast.success(res.message || "อนุมัติรายการสำเร็จ");
                  clearSelection();
                  fetchPayouts();
                } else {
                  toast.error(res.error || "เกิดข้อผิดพลาดในการอนุมัติ");
                }
                setLoading(false);
              }}
              disabled={loading || isAllBranches}
            >
              อนุมัติพร้อมจ่าย (Approve Ready)
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl px-4 h-10 font-semibold"
              onClick={clearSelection}
            >
              ยกเลิก
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}