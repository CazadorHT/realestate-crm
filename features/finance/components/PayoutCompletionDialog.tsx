import { useState, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle2, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  UploadCloud, 
  Copy, 
  Check, 
  Loader2,
  AlertCircle,
  Wallet
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markAsPaidAction, bulkMarkAsPaidAction } from "../actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PayoutCompletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPayout: any;
  formatCurrency: (amt: number) => string;
  onSuccess?: () => void;
}

export function PayoutCompletionDialog({
  isOpen,
  onClose,
  selectedPayout,
  formatCurrency,
  onSuccess
}: PayoutCompletionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [slipUrl, setSlipUrl] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!selectedPayout) return null;

  const isBulk = Array.isArray(selectedPayout);
  const isPaid = !isBulk && selectedPayout.status === 'PAID';
  const recipient = !isBulk ? (selectedPayout.agent || selectedPayout.co_broker) : null;
  
  const bankName = !isBulk ? (recipient?.bank?.name_th || recipient?.bank_code || "ไม่ได้ระบุ") : "";
  const bankAccNo = !isBulk ? (recipient?.bank_account_no || "ไม่ได้ระบุ") : "";
  const bankAccName = !isBulk ? (recipient?.bank_account_name || recipient?.full_name || recipient?.name || "ไม่ได้ระบุ") : "";
  const totalAmount = isBulk 
    ? selectedPayout.reduce((sum: number, p: any) => sum + (Number(p.net_amount || p.net_transfer_amount) || 0), 0)
    : (selectedPayout.net_amount || selectedPayout.net_transfer_amount || 0);

  const handleCopyAccNo = () => {
    if (isBulk || !bankAccNo || bankAccNo === "ไม่ได้ระบุ") return;
    navigator.clipboard.writeText(bankAccNo);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.success("คัดลอกเลขบัญชีแล้ว");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("ไฟล์ขนาดใหญ่เกินไป (จำกัด 5MB)");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();

    try {
      const fileExt = file.name.split(".").pop();
      const firstId = isBulk ? selectedPayout[0].id : selectedPayout.id;
      const tenantId = isBulk ? selectedPayout[0].tenant_id : selectedPayout.tenant_id;
      const fileName = `${firstId}-${isBulk ? 'bulk-' : ''}${Date.now()}.${fileExt}`;
      const filePath = `${tenantId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from("payout-slips")
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("payout-slips")
        .getPublicUrl(filePath);

      setSlipUrl(publicUrl);
      toast.success("อัปโหลดสลิปเรียบร้อยแล้ว");
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let res;
      if (isBulk) {
        const ids = selectedPayout.map((p: any) => p.id);
        res = await bulkMarkAsPaidAction(ids, {
          slip_url: slipUrl,
          payment_reference: paymentRef || `TRF-BULK-${Date.now()}`
        });
      } else {
        res = await markAsPaidAction(selectedPayout.id, {
          slip_url: slipUrl,
          payment_reference: paymentRef || `TRF-${selectedPayout.id.slice(0, 8).toUpperCase()}`
        });
      }

      if (res.success) {
        toast.success(res.message || "บันทึกการชำระเงินเรียบร้อยแล้ว");
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-white rounded-4xl border-none shadow-2xl p-0 overflow-hidden">
            {isPaid ? (
              <>
                <div className="bg-emerald-600 p-8 text-white text-center relative">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <ShieldCheck className="w-20 h-20 -rotate-12" />
                    </div>
                    <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold">แจ้งชำระเงินสำเร็จ</h3>
                    <p className="text-emerald-100/80 text-sm mt-1">รายการถูกบันทึกและแจ้งไปยังเอเยนต์แล้ว</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-4">
                            <span className="text-slate-500 font-medium">หมายเลขรายการ</span>
                            <span className="font-bold text-slate-900 font-mono">#{selectedPayout.id.slice(0, 8)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-4">
                            <span className="text-slate-500 font-medium">ยอดเงินโอนสุทธิ</span>
                            <span className="text-xl font-bold text-emerald-600">{formatCurrency(selectedPayout.net_amount || selectedPayout.net_transfer_amount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">ผู้รับเงิน</span>
                            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none font-bold">
                                {selectedPayout.agent?.full_name || selectedPayout.co_broker?.name}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1 h-12 rounded-xl border-slate-200 font-semibold" onClick={onClose}>
                            <Download className="w-4 h-4 mr-2" /> โหลดใบสำคัญ
                        </Button>
                        <Button className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold">
                            <ExternalLink className="w-4 h-4 mr-2" /> ดูรายละเอียด
                        </Button>
                    </div>
                </div>
              </>
            ) : (
              <>
                <DialogHeader className="p-8 pb-4">
                  <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-blue-600" />
                    </div>
                    {isBulk ? "ดำเนินการโอนเงินแบบกลุ่ม" : "ดำเนินการโอนเงิน"}
                  </DialogTitle>
                  <DialogDescription>
                    {isBulk ? "ตรวจสอบสัดส่วนบัญชีและยอดโอนรวม" : "ตรวจสอบข้อมูลธนาคารและอัปโหลดหลักฐานการโอนเงิน"}
                  </DialogDescription>
                </DialogHeader>

                <div className="px-8 pb-8 space-y-6">
                  {/* Bank Information Card */}
                  {isBulk ? (
                    <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">บัญชีธนาคารผู้รับโอน ({selectedPayout.length} รายการ)</p>
                      <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
                        {selectedPayout.map((p: any) => {
                          const rec = p.agent || p.co_broker;
                          const bName = rec?.bank?.name_th || rec?.bank_code || "ไม่ได้ระบุ";
                          const bAccNo = rec?.bank_account_no || "ไม่ได้ระบุ";
                          const bAccName = rec?.bank_account_name || rec?.full_name || rec?.name || "ไม่ได้ระบุ";
                          const bAmt = p.net_amount || p.net_transfer_amount || 0;
                          return (
                            <div key={p.id} className="text-xs border-b border-slate-200/40 pb-2 last:border-none last:pb-0 space-y-0.5">
                              <div className="flex justify-between font-bold text-slate-900">
                                <span>{p.recipient_name || rec?.full_name || rec?.name || "ไม่ระบุชื่อ"}</span>
                                <span className="text-blue-600">{formatCurrency(bAmt)}</span>
                              </div>
                              <div className="text-slate-500 flex items-center justify-between text-[10px]">
                                <span className="truncate max-w-[150px]">{bName} • {bAccName}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="font-mono">{bAccNo}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-5 w-5 text-slate-400 hover:text-blue-600 p-0"
                                    onClick={() => {
                                      if (bAccNo && bAccNo !== "ไม่ได้ระบุ") {
                                        navigator.clipboard.writeText(bAccNo);
                                        toast.success(`คัดลอกเลขบัญชีของ ${p.recipient_name || rec?.full_name || rec?.name} แล้ว`);
                                      }
                                    }}
                                    disabled={bAccNo === "ไม่ได้ระบุ"}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                        <p className="text-sm font-bold text-slate-500">ยอดเงินรวมที่ต้องโอน</p>
                        <p className="text-2xl font-black text-slate-900 underline decoration-blue-500/30">
                          {formatCurrency(totalAmount)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ธนาคารผู้รับ</p>
                          <p className="font-bold text-slate-900">{bankName}</p>
                        </div>
                        <Badge className="bg-blue-600 text-white border-none">PromptPay / Bank</Badge>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">เลขที่บัญชี</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-mono font-bold text-blue-600 tracking-tighter">{bankAccNo}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-blue-600"
                            onClick={handleCopyAccNo}
                            disabled={bankAccNo === "ไม่ได้ระบุ"}
                          >
                            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ชื่อบัญชี</p>
                        <p className="font-bold text-slate-700">{bankAccName}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/50 flex justify-between items-center">
                        <p className="text-sm font-bold text-slate-500">ยอดเงินที่ต้องโอน</p>
                        <p className="text-2xl font-black text-slate-900 underline decoration-blue-500/30">
                          {formatCurrency(totalAmount)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Payment Form */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">อัปโหลดหลักฐาน (Slip) <span className="text-red-500">*</span></Label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "group relative h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden",
                          slipUrl ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-blue-400 hover:bg-blue-50/30"
                        )}
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                            <span className="text-xs font-bold text-blue-600">กำลังอัปโหลด...</span>
                          </div>
                        ) : slipUrl ? (
                          <div className="flex flex-col items-center gap-1">
                            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-600">อัปโหลดสำเร็จ</span>
                            <span className="text-[10px] text-emerald-500/70 truncate max-w-[200px]">คลิกเพื่อเปลี่ยนไฟล์</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-blue-500">
                            <UploadCloud className="h-8 w-8" />
                            <div className="text-center">
                              <p className="text-xs font-bold">คลิกเพื่ออัปโหลดสลิป</p>
                              <p className="text-[10px]">JPG, PNG หรือ PDF (ไม่เกิน 5MB)</p>
                            </div>
                          </div>
                        )}
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          className="hidden" 
                          accept="image/*,.pdf"
                          onChange={handleFileUpload}
                          disabled={isUploading || isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">เลขที่อ้างอิง (Optional)</Label>
                      <Input 
                        placeholder="เช่น เลขที่รายการธนาคาร" 
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        className="h-12 rounded-xl bg-slate-50/50 border-slate-200 font-medium"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                      การกดยืนยันจะเป็นการบันทึกสถานะเป็น <span className="font-bold">ชำระเงินแล้ว</span> และระบบจะส่งการแจ้งเตือนไปยังผู้รับทันทีผ่าน Line/Telegram (หากตั้งค่าไว้)
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      variant="ghost" 
                      className="flex-1 h-12 rounded-xl font-bold text-slate-500" 
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      ยกเลิก
                    </Button>
                    <Button 
                      className="flex-2 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-100 disabled:opacity-50"
                      onClick={handleSubmit}
                      disabled={isSubmitting || isUploading}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          ยืนยันการจ่ายเงิน
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
        </DialogContent>
    </Dialog>
  );
}
