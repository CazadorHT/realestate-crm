import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Calculator, Plus, Search, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

interface LandlordPaymentCardProps {
  accountName: string;
  setAccountName: (val: string) => void;
  bankName: string;
  bankAccountNo: string;
  setBankAccountNo: (val: string) => void;
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
  paymentPeriod: string;
  setPaymentPeriod: (val: string) => void;
  setIsManageBanksOpen: (val: boolean) => void;
  setIsBankSelectorOpen: (val: boolean) => void;
  paymentMethodDialogOpen: boolean;
  setPaymentMethodDialogOpen: (val: boolean) => void;
}

export function LandlordPaymentCard({
  accountName,
  setAccountName,
  bankName,
  bankAccountNo,
  setBankAccountNo,
  paymentMethod,
  setPaymentMethod,
  paymentPeriod,
  setPaymentPeriod,
  setIsManageBanksOpen,
  setIsBankSelectorOpen,
  paymentMethodDialogOpen,
  setPaymentMethodDialogOpen,
}: LandlordPaymentCardProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  // Helper สำหรับดึงชื่อวิธีชำระเงินมาแสดง
  const getPaymentMethodLabel = () => {
    switch (paymentMethod) {
      case "Transfer":
        return isEn ? "Bank Transfer" : "โอนเงิน (Transfer)";
      case "Cash":
        return isEn ? "Cash" : "เงินสด (Cash)";
      case "Cheque":
        return isEn ? "Cheque" : "เช็ค (Cheque)";
      case "Credit Card":
        return isEn ? "Credit Card" : "บัตรเครดิต (Credit Card)";
      default:
        return "";
    }
  };

  return (
    <div className="p-6 rounded-3xl border border-slate-100 bg-white space-y-6 shadow-sm">
      {/* Header Section */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="p-2.5 bg-blue-50/80 text-blue-600 rounded-xl">
          <Calculator className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-800 tracking-tight">
            {isEn ? "1. Payment Account & Details" : "1. บัญชีรับเงิน & รายละเอียดการชำระเงิน"}
          </h4>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {isEn
              ? "Specify landlord bank account and payment cycle details"
              : "ระบุบัญชีธนาคารและรายละเอียดรอบการชำระเงินของเจ้าของ"}
          </p>
        </div>
      </div>

      {/* Row 1: Account Name & Bank Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
        {/* ฝั่งซ้าย: ชื่อบัญชี */}
        <div className="flex flex-col gap-2">
          <div className="h-5" />
          <Label
            htmlFor="accountName"
            className="text-xs font-semibold text-slate-600 ml-1"
          >
            {isEn ? "Beneficiary Account Name" : "ชื่อบัญชีผู้รับเงิน"}
          </Label>
          <Input
            id="accountName"
            placeholder={isEn ? "Enter account holder name..." : "ระบุชื่อเจ้าของบัญชีสำหรับรับเงิน"}
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="h-10 px-3 rounded-xl border-slate-200 bg-white text-xs text-slate-700 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-400 transition-all"
          />
        </div>

        {/* ฝั่งขวา: ธนาคาร */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between ml-1 h-5">
            <Label className="text-xs font-semibold text-slate-600">
              {isEn ? "Receiving Bank" : "ธนาคารที่รับเงิน"}
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsManageBanksOpen(true);
              }}
              className="h-5 text-[10px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold px-2 py-0 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="h-3 w-3" /> {isEn ? "Manage Banks" : "จัดการธนาคาร"}
            </Button>
          </div>

          <div className="relative group">
            <Input
              readOnly
              inputMode="none" // ป้องกันคีย์บอร์ดเด้งในมือถือ
              onClick={() => setIsBankSelectorOpen(true)}
              value={bankName || ""}
              placeholder={isEn ? "Select bank..." : "เลือกธนาคาร..."}
              className="h-10 px-3 pr-10 rounded-xl border-slate-200 bg-white text-xs text-slate-700 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-400 transition-all cursor-pointer"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Row 2: Account No, Payment Method, Period */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label
            htmlFor="bankAccountNo"
            className="text-xs font-semibold text-slate-600 ml-1"
          >
            {isEn ? "Account Number" : "เลขที่บัญชี"}
          </Label>
          <Input
            id="bankAccountNo"
            placeholder="000 000 0000"
            value={bankAccountNo}
            onChange={(e) => setBankAccountNo(e.target.value)}
            className="h-10 px-3 rounded-xl border-slate-200 bg-white text-xs text-slate-700 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-400 transition-all"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-600 ml-1">
            {isEn ? "Payment Method" : "วิธีชำระเงิน"}
          </Label>
          <ResponsiveDialog
            open={paymentMethodDialogOpen}
            onOpenChange={setPaymentMethodDialogOpen}
            title={isEn ? "Select Payment Method" : "เลือกวิธีชำระเงิน"}
            description={isEn ? "Specify how the client will make payments for this document" : "ระบุวิธีที่ลูกค้าจะใช้ชำระเงินสำหรับเอกสารนี้"}
            className="sm:max-w-md"
            trigger={
              <button
                type="button"
                onClick={() => setPaymentMethodDialogOpen(true)}
                className="flex items-center justify-between w-full h-10 px-3 text-left bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all group cursor-pointer"
              >
                <span
                  className={cn(
                    "text-xs truncate pr-4",
                    paymentMethod
                      ? "text-slate-700 font-medium"
                      : "text-slate-400",
                  )}
                >
                  {getPaymentMethodLabel() || (isEn ? "Select method..." : "เลือกวิธีชำระ...")}
                </span>
                <FileText className="h-4 w-4 text-slate-400 group-hover:text-blue-500 shrink-0 transition-colors" />
              </button>
            }
          >
            <div className="p-2 space-y-2">
              {[
                { id: "Transfer", label: isEn ? "Bank Transfer" : "โอนเงิน (Transfer)", icon: "🏦" },
                { id: "Cash", label: isEn ? "Cash" : "เงินสด (Cash)", icon: "💵" },
                { id: "Cheque", label: isEn ? "Cheque" : "เช็ค (Cheque)", icon: "📜" },
                {
                  id: "Credit Card",
                  label: isEn ? "Credit Card" : "บัตรเครดิต (Credit Card)",
                  icon: "💳",
                },
              ].map((method) => (
                <div
                  key={method.id}
                  className={cn(
                    "p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4",
                    paymentMethod === method.id
                      ? "border-blue-500 bg-blue-50/60 shadow-sm"
                      : "border-slate-100 hover:border-blue-200 hover:bg-slate-50",
                  )}
                  onClick={() => {
                    setPaymentMethod(method.id);
                    setPaymentMethodDialogOpen(false);
                  }}
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-lg transition-colors",
                      paymentMethod === method.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {method.icon}
                  </div>
                  <span
                    className={cn(
                      "font-medium text-sm flex-1",
                      paymentMethod === method.id
                        ? "text-blue-900"
                        : "text-slate-700",
                    )}
                  >
                    {method.label}
                  </span>
                  {paymentMethod === method.id && (
                    <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ResponsiveDialog>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="paymentPeriod"
            className="text-xs font-semibold text-slate-600 ml-1"
          >
            {isEn ? "Payment Period / Installment" : "รอบการชำระเงิน (งวด)"}
          </Label>
          <Input
            id="paymentPeriod"
            placeholder={isEn ? "e.g. Installment 1 / 12" : "เช่น งวดที่ 1 / 12"}
            value={paymentPeriod}
            onChange={(e) => setPaymentPeriod(e.target.value)}
            className="h-10 px-3 rounded-xl border-slate-200 bg-white text-xs text-slate-700 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-400 transition-all"
          />
        </div>
      </div>
    </div>
  );
}

