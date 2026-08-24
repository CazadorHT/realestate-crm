"use client";

import { useState } from "react";
import { Plus, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  contractFormSchema,
  type ContractFormInput,
  type ContractDealSummary,
} from "@/features/rental-contracts/schema";
import { useContractForm } from "../hooks/useContractForm";
import { Step1DealSelection } from "./steps/Step1DealSelection";
import { Step2ContractDetails } from "./steps/Step2ContractDetails";
import { Step3Financials } from "./steps/Step3Financials";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

export function CreateContractDialog() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [open, setOpen] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const router = useRouter();

  const {
    form,
    currentStep,
    nextStep,
    prevStep,
    selectedDeal,
    setSelectedDeal,
    isSubmitting,
    alreadyHasContract,
    isPriceEditing,
    setIsPriceEditing,
    onSubmit,
    isSale,
    updateEndDateFromTerm,
    clearDraft,
  } = useContractForm(() => {
    setOpen(false);
    setShowSuccessDialog(true);
  });

  const handleClose = () => {
    setOpen(false);
    form.reset();
    setSelectedDeal(null);
    setIsPriceEditing(false);
    clearDraft();
  };

  const steps = [
    { title: isEn ? "Select Deal" : "เลือกดีล", desc: isEn ? "Deal" : "ดีล" },
    { title: isEn ? "Contract Details" : "ข้อมูลสัญญา", desc: isEn ? "Details" : "สัญญา" },
    { title: isEn ? "Financials & Terms" : "การเงินและเงื่อนไข", desc: isEn ? "Terms" : "เงื่อนไข" },
  ];

  const rentPrice = form.watch("rent_price");
  const isRental = selectedDeal?.deal_type === "RENT";

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={(val) => !val && handleClose()}
        trigger={
          <Button
            onClick={() => setOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 shadow-md h-12 rounded-xl font-bold cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" /> {isEn ? "New Contract" : "สร้างสัญญาใหม่"}
          </Button>
        }
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <span>{isEn ? "Create New Contract" : "สร้างสัญญาใหม่"}</span>
          </div>
        }
        description={isEn ? "Contract details for closed deals (rent/sale)" : "รายละเอียดสัญญาสำหรับดีลที่ปิดการขายหรือเช่าแล้ว"}
        className="sm:max-w-[700px]"
        footer={
          <div className="flex flex-row gap-3 w-full">
            {currentStep > 1 ? (
              <Button
                variant="outline"
                type="button"
                onClick={prevStep}
                disabled={isSubmitting}
                className="flex-1 rounded-xl h-12 font-bold border-slate-200 text-slate-500 cursor-pointer"
              >
                {isEn ? "Back" : "ย้อนกลับ"}
              </Button>
            ) : (
              <Button
                variant="outline"
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 rounded-xl h-12 font-bold border-slate-200 text-slate-500 cursor-pointer"
              >
                {isEn ? "Cancel" : "ยกเลิก"}
              </Button>
            )}

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="flex-2 bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-500/10 gap-2 cursor-pointer"
              >
                {isEn ? "Next" : "ถัดไป"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={onSubmit}
                className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer"
                disabled={isSubmitting || !selectedDeal}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEn ? "Saving..." : "กำลังบันทึก..."}
                  </>
                ) : (
                  isEn ? "Create Contract" : "สร้างสัญญา"
                )}
              </Button>
            )}
          </div>
        }
      >
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-10 px-6">
            {steps.map((step, idx) => {
              const s = idx + 1;
              return (
                <div
                  key={s}
                  className={cn("flex items-center", s < 3 ? "flex-1" : "")}
                >
                  <div className="flex flex-col items-center gap-2 relative">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
                        currentStep >= s
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-400 border-slate-100",
                      )}
                    >
                      {currentStep > s ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        s
                      )}
                    </div>
                    <div className="absolute -bottom-6 w-max text-center">
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider transition-colors",
                          currentStep === s
                            ? "text-blue-600"
                            : "text-slate-400",
                        )}
                      >
                        {step.title}
                      </span>
                    </div>
                  </div>
                  {s < 3 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-4 transition-all rounded-full",
                        currentStep > s ? "bg-blue-600" : "bg-slate-100",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Form {...form}>
          <form 
            className="space-y-8 pb-6 px-4"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                e.preventDefault();
              }
            }}
          >
            <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4 no-scrollbar">
              <div className="space-y-8 pb-4">
                {currentStep === 1 && (
                  <Step1DealSelection
                    selectedDeal={selectedDeal}
                    onDealSelect={(val, picked) => {
                      form.setValue("deal_id", val, { shouldDirty: true });
                      setSelectedDeal(picked);
                      if (picked) {
                        const price =
                          picked.deal_type === "RENT"
                            ? (picked.rental_price ??
                              picked.original_rental_price)
                            : (picked.price ?? picked.original_price);

                        form.setValue("rent_price", price ?? 0);
                        if (picked.deal_type === "RENT") {
                          form.setValue(
                            "deposit_amount",
                            price ? price * 2 : 0,
                          );
                          form.setValue("advance_payment_amount", price ?? 0);
                          form.setValue(
                            "lease_term_months",
                            picked.duration_months || 12,
                          );
                        } else {
                          form.setValue("lease_term_months", 1);
                        }
                      }
                    }}
                    alreadyHasContract={alreadyHasContract}
                  />
                )}

                {currentStep === 2 && (
                  <Step2ContractDetails
                    isSale={isSale}
                    isPriceEditing={isPriceEditing}
                    setIsPriceEditing={setIsPriceEditing}
                    updateEndDateFromTerm={updateEndDateFromTerm}
                  />
                )}

                {currentStep === 3 && <Step3Financials isSale={isSale} />}
              </div>
            </div>
          </form>
        </Form>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        className="sm:max-w-md"
      >
        <div className="flex flex-col items-center text-center py-6 space-y-6">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
            <CheckCircle2 className="w-10 h-10 text-green-600 shadow-sm" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {isEn ? "Contract Created Successfully" : "สร้างสัญญาเรียบร้อยแล้ว"}
            </h3>
            <p className="text-slate-500 text-sm font-medium px-4">
              {isEn 
                ? "Contract has been saved. You can configure rent reminder schedules or view details immediately." 
                : "สัญญาถูกบันทึกเข้าระบบเรียบร้อย คุณสามารถจัดการแจ้งเตือนหรือพิมพ์เอกสารได้ทันที"}
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full px-2">
            {isRental && (
              <Button
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-100 cursor-pointer"
                onClick={() => {
                  handleClose();
                  setShowSuccessDialog(false);
                  router.push("/protected/rent-notifications");
                }}
              >
                {isEn ? "Configure Rent Reminders" : "ไปตั้งค่าแจ้งเตือนค่าเช่า"}
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full h-11 rounded-xl font-bold border-slate-200 text-slate-600 cursor-pointer"
              onClick={() => {
                handleClose();
                setShowSuccessDialog(false);
                const url = new URL(window.location.href);
                url.searchParams.set("success", "true");
                router.push(url.pathname + url.search);
              }}
            >
              {isEn ? "OK" : "ตกลง"}
            </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </>
  );
}

