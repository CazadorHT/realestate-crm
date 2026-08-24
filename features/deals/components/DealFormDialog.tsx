"use client";

import { useState, useEffect } from "react";
import { differenceInMonths } from "date-fns";
import { useForm, type Resolver, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createDealSchema, getCreateDealSchema, CreateDealInput } from "../schema";
import { createDealAction, updateDealAction } from "../actions";
import { DealWithProperty, DealPropertyOption } from "../types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Building2, Briefcase, Calendar } from "lucide-react";
import { RiEdit2Line } from "react-icons/ri";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TopLoader } from "@/components/ui/top-loader";

import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveDialog, DialogClose, DrawerClose } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { DealForm } from "./DealForm";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface DealFormDialogProps {
  leadId: string;
  properties?: DealPropertyOption[];
  deal?: DealWithProperty; // Existing deal for editing
  onSuccess?: () => void;
  refreshOnSuccess?: boolean;
  trigger?: React.ReactNode;
}

export function DealFormDialog({
  leadId,
  properties = [],
  deal,
  onSuccess,
  refreshOnSuccess,
  trigger,
}: DealFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<CreateDealInput | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const isEn = language === "en";

  const isEditing = !!deal;

  const getInitialValues = (): CreateDealInput => {
    if (deal) {
      const sanitized = { ...deal, deal_type: (deal.deal_type as "RENT" | "SALE") ?? "RENT" };
      const cleanupKeys = [
        "co_agent_name", 
        "co_agent_contact", 
        "co_agent_online", 
        "source",
        "commission_amount",
        "commission_percent"
      ] as const;
      
      cleanupKeys.forEach((k) => {
        const key = k as keyof typeof sanitized;
        if (sanitized[key] === null) {
          // @ts-ignore - dynamic cleanup for Zod compatibility
          sanitized[key] = undefined;
        }
      });

      if (sanitized.transaction_date)
        sanitized.transaction_date = sanitized.transaction_date.split("T")[0];
      if (sanitized.transaction_end_date)
        sanitized.transaction_end_date =
          sanitized.transaction_end_date.split("T")[0];
      
      const duration = sanitized.transaction_date && sanitized.transaction_end_date
          ? differenceInMonths(
              new Date(sanitized.transaction_end_date),
              new Date(sanitized.transaction_date),
            )
          : 12;

      return {
        lead_id: sanitized.lead_id || "",
        property_id: sanitized.property_id || "",
        deal_type: sanitized.deal_type,
        status: (sanitized.status as CreateDealInput["status"]) ?? "NEGOTIATING",
        commission_amount: sanitized.commission_amount as number | undefined,
        commission_percent: sanitized.commission_percent as number | undefined,
        co_agent_name: sanitized.co_agent_name as string | undefined,
        co_agent_contact: sanitized.co_agent_contact as string | undefined,
        co_agent_online: sanitized.co_agent_online as string | undefined,
        source: sanitized.source as string | undefined,
        transaction_date: sanitized.transaction_date as string | undefined,
        transaction_end_date: sanitized.transaction_end_date as string | undefined,
        duration_months: duration,
        undetermined_date: !sanitized.transaction_date,
        partner_co_broker_id: sanitized.partner_co_broker_id as string | undefined,
        internal_co_agent_id_temp: (sanitized.metadata as any)?.co_agent_id as string | undefined,
      };
    }

    return {
      lead_id: leadId || "",
      deal_type: "RENT",
      status: "NEGOTIATING",
      commission_amount: undefined,
      transaction_date: new Date().toISOString().split("T")[0],
      duration_months: 12,
      property_id: "",
      co_agent_name: undefined,
      co_agent_contact: undefined,
      co_agent_online: undefined,
      undetermined_date: false,
      partner_co_broker_id: undefined,
      internal_co_agent_id_temp: undefined,
    };
  };

  const form = useForm<CreateDealInput>({
    resolver: zodResolver(getCreateDealSchema(isEn)) as Resolver<CreateDealInput>,
    mode: "onChange",
    defaultValues: getInitialValues(),
  });

  // Reset to step 1 and reset form when opening
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      form.reset(getInitialValues());
    }
  }, [open, deal, leadId]);


  const handleNext = async () => {
    let fieldsToValidate: (keyof CreateDealInput)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ["property_id"];
      if (!leadId) fieldsToValidate.push("lead_id");
    } else if (currentStep === 2) {
      fieldsToValidate = ["deal_type", "status", "commission_amount"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    } else {
      toast.error(isEn ? "Please fill in all required fields" : "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
    }
  };

  const onSubmit = (data: CreateDealInput) => {
    setPendingData(data);
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingData) return;
    setIsSubmitting(true);
    try {
      const result: Awaited<ReturnType<typeof createDealAction>> = isEditing && deal
        ? await updateDealAction({ ...pendingData, id: deal.id })
        : await createDealAction(pendingData);

      if (result.success) {
        toast.success(isEditing ? (isEn ? "Deal updated successfully" : "อัปเดตดีลเรียบร้อย") : (isEn ? "Deal created successfully" : "สร้างดีลเรียบร้อย"));
        setIsConfirmOpen(false);
        setOpen(false);
        if (!isEditing) form.reset();
        if (onSuccess) onSuccess();
        if (refreshOnSuccess) {
          const url = new URL(window.location.href);
          url.searchParams.set("success", "true");
          router.push(url.pathname + url.search);
          router.refresh();
        }
      } else {
        toast.error(result.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"));
        setIsConfirmOpen(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (isEn ? "Error saving deal" : "เกิดข้อผิดพลาดในการบันทึก");
      toast.error(message);
      setIsConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFooter = () => {
    if (isMobile) {
      return (
        <div className="flex items-center gap-3 w-full pb-6">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="flex-1 h-12 rounded-xl font-bold border-slate-200 cursor-pointer"
            >
              {isEn ? "Back" : "ย้อนกลับ"}
            </Button>
          ) : (
            <DrawerClose asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex-1 h-12 rounded-xl font-bold text-slate-500 cursor-pointer"
              >
                {isEn ? "Cancel" : "ยกเลิก"}
              </Button>
            </DrawerClose>
          )}

          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="flex-2 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 transition-all cursor-pointer"
            >
              {isEn ? "Next" : "ถัดไป"}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={form.handleSubmit(onSubmit, (errors) => {
                const firstError = Object.values(errors)[0]?.message;
                toast.error(firstError ? String(firstError) : (isEn ? "Please check form errors" : "กรุณากรอกข้อมูลให้ถูกต้อง"));
              })}
              className="flex-2 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-200 transition-all gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEn ? "Saving..." : "กำลังบันทึก..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEn ? "Save Deal" : "บันทึกข้อมูลดีล"}
                </>
              )}
            </Button>
          )}
        </div>
      );
    }

    // Desktop Footer
    return (
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="flex-1 flex gap-3">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="flex-1 sm:flex-none h-12 px-6 rounded-xl font-bold border-slate-200 cursor-pointer"
            >
              {isEn ? "Back" : "ย้อนกลับ"}
            </Button>
          ) : (
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex-1 sm:flex-none h-12 px-6 text-slate-500 hover:text-slate-800 font-bold rounded-xl border border-slate-100 cursor-pointer"
              >
                {isEn ? "Cancel" : "ยกเลิก"}
              </Button>
            </DialogClose>
          )}
        </div>

        {currentStep < 3 ? (
          <Button
            type="button"
            onClick={handleNext}
            className="flex-1 sm:flex-none h-12 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            {isEn ? "Next Step" : "ขั้นตอนถัดไป"}
          </Button>
        ) : (
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={form.handleSubmit(onSubmit, (errors) => {
              const firstError = Object.values(errors)[0]?.message;
              toast.error(firstError ? String(firstError) : (isEn ? "Please check form errors" : "กรุณากรอกข้อมูลให้ถูกต้อง"));
            })}
            className="flex-1 sm:flex-none h-12 px-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all gap-2 font-bold disabled:opacity-50 disabled:grayscale cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEn ? "Saving..." : "กำลังบันทึก..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEn ? "Save Deal" : "บันทึกข้อมูลดีล"}
              </>
            )}
          </Button>
        )}
      </div>
    );
  };

  const getStepHeader = () => {
    switch (currentStep) {
      case 1:
        return {
          icon: <Building2 className="w-5 h-5 text-blue-600" />,
          iconBg: "bg-blue-50 ring-1 ring-blue-100/50",
          title: isEn ? "Property & Lead Info" : "ข้อมูลทรัพย์และลูกค้า",
        };
      case 2:
        return {
          icon: <Briefcase className="w-5 h-5 text-emerald-600" />,
          iconBg: "bg-emerald-50 ring-1 ring-emerald-100/50",
          title: isEn ? "Deal Details" : "รายละเอียดดีล",
        };
      case 3:
        return {
          icon: <Calendar className="w-5 h-5 text-orange-600" />,
          iconBg: "bg-orange-50 ring-1 ring-orange-100/50",
          title: isEn ? "Timeline & Info" : "ระยะเวลาและข้อมูลอื่น",
        };
      default:
        return null;
    }
  };
  const stepHeader = getStepHeader();

  return (
    <ResponsiveDialog
      open={open}
      confirmOnClose={form.formState.isDirty}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) {
          // Reset form to default values when fully closed to prevent stale data
          form.reset(getInitialValues());
        }
      }}
      title={
        <span className="flex items-center gap-3.5 text-left font-normal">
          {stepHeader && (
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${stepHeader.iconBg}`}>
              {stepHeader.icon}
            </span>
          )}
          <span className="flex flex-col">
            <span className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900">
                {isEditing ? (isEn ? "Edit Deal" : "แก้ไขดีล") : (isEn ? "Create New Deal" : "สร้างดีลใหม่")}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-semibold leading-none">
                {isEn ? `Step ${currentStep}/3` : `ขั้นตอนที่ ${currentStep}/3`}
              </span>
            </span>
            {stepHeader && (
              <span className="text-xs text-slate-500 font-medium mt-0.5">
                {stepHeader.title}
              </span>
            )}
          </span>
        </span>
      }
      description={undefined}
      className="md:max-w-4xl"
      shouldScaleBackground={false}
      onOpenAutoFocus={(e) => e.preventDefault()}
      onCloseAutoFocus={(e) => e.preventDefault()}
      trigger={
        trigger ||
        (deal ? (
          <Button className="bg-white/20 h-11 cursor-pointer text-white border-0 hover:bg-white/30 transition-all hover:scale-105 active:scale-95 rounded-xl">
            <RiEdit2Line className="h-4 w-4 mr-2" />
            {isEn ? "Edit" : "แก้ไข"}
          </Button>
        ) : (
          <Button size="sm" className="rounded-xl px-4 font-bold h-11 cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            {isEn ? "Create Deal" : "สร้าง Deal"}
          </Button>
        ))
      }
      footer={renderFooter()}
    >
      <TopLoader isLoading={isSubmitting} />
      <FormProvider {...form}>
        <DealForm leadId={leadId} properties={properties} deal={deal} step={currentStep} />
      </FormProvider>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={isEditing ? (isEn ? "Confirm Deal Update" : "ยืนยันการแก้ไขดีล") : (isEn ? "Confirm Deal Creation" : "ยืนยันการสร้างดีล")}
        description={isEditing ? (isEn ? "Are you sure you want to save changes to this deal?" : "คุณต้องการบันทึกการเปลี่ยนแปลงของดีลนี้ใช่หรือไม่?") : (isEn ? "Are all deal details correct and ready to be saved?" : "ข้อมูลดีลถูกต้องและคุณต้องการบันทึกข้อมูลใช่หรือไม่?")}
        confirmText={isEditing ? (isEn ? "Save Changes" : "บันทึกการแก้ไข") : (isEn ? "Create Deal" : "บันทึกดีล")}
        cancelText={isEn ? "Review Again" : "ตรวจสอบอีกรอบ"}
        onConfirm={handleConfirmSave}
      />
    </ResponsiveDialog>
  );
}

