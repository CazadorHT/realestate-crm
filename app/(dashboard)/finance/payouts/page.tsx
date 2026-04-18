"use client";

import { useState, useEffect } from "react";
import { 
  Wallet, Search, Filter, ArrowUpRight, Clock, CheckCircle2, 
  AlertCircle, FileUp, History as HistoryIcon, Plus as PlusIcon, ChevronDown, ShieldCheck, Loader2,
  Plus,
  Table,
  PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  recalculatePayoutTotalsAction
} from "@/features/finance/actions";
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
import { PayoutTableRow } from "@/features/finance/components/PayoutTableRow";
import { FinanceMath } from "@/lib/finance/precision";
import { PayoutSkeleton } from "@/features/finance/components/PayoutSkeleton";
import { FinanceAnalytics } from "@/features/finance/components/FinanceAnalytics";
export default function PayoutDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [view, setView] = useState<'LIST' | 'ANALYTICS'>('LIST');
  
  // 📑 Pagination State
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  
  // ✅ High Performance Store (Zustand)
  const selectedIds = usePayoutStore(state => state.selectedIds);
  const selectVisible = usePayoutStore(state => state.selectVisible);
  const clearSelection = usePayoutStore(state => state.clearSelection);
  const getTotalSelectedAmount = usePayoutStore(state => state.getTotalSelectedAmount);
  
  // Modals / Sheets State
  const [isPaidDialogOpen, setIsPaidDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Form States
  const [paymentRef, setPaymentRef] = useState("");
  const [slipUrl, setSlipUrl] = useState("");
  const [adjDesc, setAdjDesc] = useState("");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjType, setAdjType] = useState<any>("OTHER");

  const fetchPayouts = async (targetPage: number = page) => {
    setLoading(true);
    const res = await getPayoutQueueAction({ page: targetPage, pageSize });
    if (res.success) {
      setPayouts(res.data || []);
      setTotalCount(res.totalCount);
      clearSelection(); 
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayouts(page);
  }, [page]);

  // Filtered payouts based on search (Pro Tip: Case-insensitive)
  const filteredPayouts = payouts.filter(p => 
    p.agent?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.deal?.property?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const visibleIds = payouts.map((p: any) => p.id);
  const currentTotal = getTotalSelectedAmount(payouts);

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    const res = await bulkMarkAsReadyToPayAction(Array.from(selectedIds));
    if (res.success) {
      toast.success(res.message);
      clearSelection(); // ✅ Store Action
      fetchPayouts();
    } else {
      toast.error(res.error);
    }
    setIsBulkProcessing(false);
  };

  const handleRecalculate = async (id: string) => {
    setIsRecalculating(true);
    const res = await recalculatePayoutTotalsAction(id);
    if (res.success) {
      toast.success(res.message);
      fetchPayouts();
    } else {
      toast.error(res.error || "คำนวณใหม่ไม่สำเร็จ");
    }
    setIsRecalculating(false);
  };

  const handleOpenHistory = async (payout: any) => {
    setSelectedPayout(payout);
    setIsHistoryOpen(true);
    setLoadingHistory(true);
    const res = await getCommissionAuditTrailAction(payout.id);
    if (res.success) setHistory(res.data || []);
    setLoadingHistory(false);
  };

  const handleCreateAdjustment = async () => {
    if (!adjDesc || !adjAmount) return toast.error("กรุณากรอกข้อมูลให้ครบ");
    const res = await createCommissionAdjustmentAction({
      commission_id: selectedPayout.id,
      description: adjDesc,
      amount: parseFloat(adjAmount),
      adjustment_type: adjType
    });

    if (res.success) {
      toast.success("บันทึกรายการปรับปรุงเรียบร้อย");
      setIsAdjustmentOpen(false);
      setAdjDesc(""); setAdjAmount("");
      fetchPayouts();
    } else {
      toast.error(res.error);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!paymentRef) return toast.error("กรุณาระบุเลขอ้างอิง");
    const res = await markAsPaidAction(selectedPayout.id, {
      payment_reference: paymentRef,
      slip_url: slipUrl || "https://placeholder.com/slip.jpg"
    });

    if (res.success) {
      toast.success(res.message);
      setIsPaidDialogOpen(false);
      setPaymentRef(""); setSlipUrl("");
      fetchPayouts();
    } else {
      toast.error(res.error);
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 2
    }).format(amt);
  };

  if (loading) return <PayoutSkeleton />;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 border-l-4 border-indigo-600 pl-4 uppercase">Finance Pro</h1>
          <p className="text-slate-500 mt-1">บริหารจัดการกระแสเงินเข้า-ออกและรายการภาษีครบวงจร</p>
        </div>
        
        {view === 'LIST' && (
          <Button 
            onClick={() => setView('ANALYTICS')}
            className="bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 shadow-sm font-bold h-11 px-6 rounded-xl"
          >
            <PieChart className="w-4 h-4 mr-2" />
            Report & Analytics
          </Button>
        )}
      </div>

      {view === 'ANALYTICS' ? (
        <FinanceAnalytics onBack={() => setView('LIST')} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-indigo-600 text-white border-none shadow-lg">
          <CardContent className="pt-6">
            <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Ready to Transfer</span>
            <h2 className="text-2xl font-black mt-1">
              {formatCurrency(payouts.filter(p => p.status === 'READY_TO_PAY').reduce((acc, p) => acc + (p.net_transfer_amount || p.net_amount), 0))}
            </h2>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-100 shadow-sm">
          <CardContent className="pt-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Audit</span>
            <h2 className="text-2xl font-black mt-1 text-amber-600">{payouts.filter(p => p.status === 'UNPAID').length} ดีล</h2>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" /> รายการรอโอนเงินเอเยนต์
            </CardTitle>
            <Input 
              placeholder="ค้นหา..." className="w-full md:w-64 bg-white"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center">
                  <Checkbox 
                    checked={selectedIds.size > 0 && selectedIds.size === visibleIds.length}
                    onCheckedChange={(checked) => checked ? selectVisible(visibleIds) : clearSelection()}
                  />
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 text-left">เอเยนต์ / บทบาท</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">สถานะ</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500">ยอดคอมมิชชัน</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-red-500">ภาษี (WHT)</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-400">สุทธิ (Net)</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-slate-400 italic">
                    ไม่พบรายการที่ค้นหา
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayouts.map((payout) => (
                  <PayoutTableRow 
                    key={payout.id}
                    payout={payout}
                    onOpenHistory={handleOpenHistory}
                    onOpenPaidDialog={(p) => { setSelectedPayout(p); setIsPaidDialogOpen(true); }}
                    onRecalculate={handleRecalculate}
                    isRecalculating={isRecalculating}
                  />
                ))
              )}
            </TableBody>
          </Table>

          {/* 📑 Professional Pagination Bar */}
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500 font-medium">
              แสดง {Math.min((page - 1) * pageSize + 1, totalCount)} - {Math.min(page * pageSize, totalCount)} จาก {totalCount} รายการ
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs font-bold"
                disabled={page <= 1 || loading}
                onClick={() => setPage(prev => prev - 1)}
              >
                ย้อนกลับ
              </Button>
              <div className="flex items-center gap-1">
                 <span className="h-8 w-8 flex items-center justify-center bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-sm ring-1 ring-indigo-500">
                   {page}
                 </span>
                 <span className="text-xs text-slate-400 px-2">/</span>
                 <span className="text-xs text-slate-500 font-bold px-1">
                   {Math.ceil(totalCount / pageSize) || 1}
                 </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs font-bold"
                disabled={page >= Math.ceil(totalCount / pageSize) || loading}
                onClick={() => setPage(prev => prev + 1)}
              >
                ถัดไป
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🚀 Floating Action Bar (Optimized for Large Batches) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-500">
          <div className="bg-slate-900/90 backdrop-blur-md text-white rounded-2xl px-6 py-4 shadow-2xl border border-white/10 flex items-center gap-8 ring-1 ring-slate-700/50">
            <div className="flex items-center gap-4 border-r border-white/10 pr-8">
              <div className="h-10 w-10 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-lg shadow-inner">
                {selectedIds.size}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-left">Selected Batch</p>
                <p className="text-sm text-slate-100 font-medium whitespace-nowrap">เลือก {selectedIds.size} รายการ</p>
              </div>
            </div>
            
            <div className="flex items-center gap-10">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-left">Total Net Transfer</p>
                <p className="text-xl font-black text-indigo-400 whitespace-nowrap">฿ {FinanceMath.format(currentTotal)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => clearSelection()}
                  className="text-slate-400 hover:text-white"
                >
                  ยกเลิก
                </Button>
                <Button 
                  onClick={handleBulkApprove} 
                  disabled={isBulkProcessing}
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-lg px-6 font-bold"
                >
                  {isBulkProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 mr-2" />
                  )}
                  อนุมัติรอจ่าย (Mark as Ready)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📜 History Drawer */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent className="sm:max-w-md bg-white text-slate-900 border-l border-slate-200 shadow-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-indigo-600" />
              ประวัติการเงิน (Financial Trail)
            </SheetTitle>
            <SheetDescription>การเคลื่อนไหวของยอดเงิน ID: {selectedPayout?.id.slice(0, 8)}</SheetDescription>
          </SheetHeader>
          <div className="mt-8 space-y-6">
            {loadingHistory ? <div className="text-center italic text-slate-400 text-xs">กำลังสืบค้นประวัติ...</div> : (
              history.map((h, i) => (
                <div key={h.id} className="relative pl-6 pb-6 border-l border-slate-200 last:border-0 last:pb-0">
                  <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400">{format(new Date(h.created_at), "d MMM HH:mm", { locale: th })}</span>
                    <span className="text-sm font-bold text-slate-800 mt-1">{h.summary}</span>
                    <span className="text-[10px] text-slate-500">โดย: {h.user_full_name}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ➕ Adjustment Modal */}
      <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle>ปรับปรุงยอดเงิน (Adjustment)</DialogTitle>
            <DialogDescription>เพิ่มยอดโบนัส หรือ หักค่าใช้จ่ายส่วนเกิน</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">ประเภท</label>
              <Select value={adjType} onValueChange={setAdjType}>
                <SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FEE">ค่าธรรมเนียม / หักใช้จ่าย</SelectItem>
                  <SelectItem value="BONUS">เงินรางวัล / โบนัสพิเศษ</SelectItem>
                  <SelectItem value="MARKETING">ค่าการตลาด</SelectItem>
                  <SelectItem value="OTHER">อื่นๆ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">คำอธิบาย</label>
              <Input placeholder="เช่น ค่าธรรมเนียมโอนต่างธนาคาร" value={adjDesc} onChange={(e) => setAdjDesc(e.target.value)} className="bg-slate-50" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">จำนวนเงิน (ติดลบคือหักออก)</label>
              <Input type="number" placeholder="0.00" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} className="bg-slate-50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAdjustmentOpen(false)}>ยกเลิก</Button>
            <Button className="bg-indigo-600" onClick={handleCreateAdjustment}>ตกลง บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 💸 Mark as Paid Dialog (Updated with Net Info) */}
      <Dialog open={isPaidDialogOpen} onOpenChange={setIsPaidDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader><DialogTitle>แจ้งโอนเงินสำเร็จ</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 mb-2">
              <span className="text-xs text-indigo-700 font-bold uppercase tracking-tighter">ยอดโอนสุทธิ (Net Transfer)</span>
              <p className="text-3xl font-black text-indigo-900">{selectedPayout && formatCurrency(selectedPayout.net_transfer_amount)}</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase">เลขอ้างอิงการโอน</label>
              <Input placeholder="TXN..." value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} className="bg-slate-50" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase">สลิปการโอน</label>
              <Input placeholder="URL สลิป" value={slipUrl} onChange={(e) => setSlipUrl(e.target.value)} className="bg-slate-50" />
            </div>
          </div>
          <DialogFooter>
            <Button className="bg-emerald-600 w-full" onClick={handleMarkAsPaid}>ยืนยันการโอนและแจ้งเอเยนต์</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
}
