"use client";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Download, ExternalLink, ShieldCheck } from "lucide-react";

interface PayoutCompletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPayout: any;
  formatCurrency: (amt: number) => string;
}

export function PayoutCompletionDialog({
  isOpen,
  onClose,
  selectedPayout,
  formatCurrency
}: PayoutCompletionDialogProps) {
  if (!selectedPayout) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-white rounded-4xl border-none shadow-2xl p-0 overflow-hidden">
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
                            {selectedPayout.agent?.name}
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
        </DialogContent>
    </Dialog>
  );
}
