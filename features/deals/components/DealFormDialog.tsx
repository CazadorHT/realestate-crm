"use client";

import { useState, useEffect } from "react";
import { differenceInMonths } from "date-fns";
import { useForm, type Resolver, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createDealSchema, CreateDealInput } from "../schema";
import { createDealAction, updateDealAction } from "../actions";
import { DealWithProperty, DealPropertyOption } from "../types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save } from "lucide-react";
import { RiEdit2Line } from "react-icons/ri";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TopLoader } from "@/components/ui/top-loader";

import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { DealForm } from "./DealForm";

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
    };
  };

  const form = useForm<CreateDealInput>({
    resolver: zodResolver(createDealSchema) as Resolver<CreateDealInput>,
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
      toast.error("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
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
        toast.success(isEditing ? "อัปเดตดีลเรียบร้อย" : "สร้างดีลเรียบร้อย");
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
        toast.error(result.message || "เกิดข้อผิดพลาด");
        setIsConfirmOpen(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก";
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
              className="flex-1 h-12 rounded-xl font-bold border-slate-200"
            >
              ย้อนกลับ
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                form.reset();
                setOpen(false);
              }}
              className="flex-1 h-12 rounded-xl font-bold text-slate-500"
            >
              ยกเลิก
            </Button>
          )}

          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="flex-2 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 transition-all"
            >
              ถัดไป
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isSubmitting || !form.formState.isValid}
              onClick={form.handleSubmit(onSubmit)}
              className="flex-2 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-200 transition-all gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  บันทึกข้อมูลดีล
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
              className="flex-1 sm:flex-none h-12 px-6 rounded-xl font-bold border-slate-200"
            >
              ย้อนกลับ
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                form.reset();
                setOpen(false);
              }}
              className="flex-1 sm:flex-none h-12 px-6 text-slate-500 hover:text-slate-800 font-bold rounded-xl border border-slate-100"
            >
              ยกเลิก
            </Button>
          )}
        </div>

        {currentStep < 3 ? (
          <Button
            type="button"
            onClick={handleNext}
            className="flex-1 sm:flex-none h-12 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 transition-all"
          >
            ขั้นตอนถัดไป
          </Button>
        ) : (
          <Button
            type="button"
            disabled={isSubmitting || !form.formState.isValid}
            onClick={form.handleSubmit(onSubmit)}
            className="flex-1 sm:flex-none h-12 px-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all gap-2 font-bold disabled:opacity-50 disabled:grayscale"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                บันทึกข้อมูลดีล
              </>
            )}
          </Button>
        )}
      </div>
    );
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) {
          // Reset form to default values when fully closed to prevent stale data
          form.reset(getInitialValues());
        }
      }}
      title={isEditing ? "แก้ไขดีล" : "สร้างดีลใหม่"}
      description="กรอกข้อมูลดีลที่เกี่ยวข้อง (วันที่เป็นค่าสามารถเว้นว่างได้)"
      className="md:max-w-4xl"
      shouldScaleBackground={false}
      onOpenAutoFocus={(e) => e.preventDefault()}
      onCloseAutoFocus={(e) => e.preventDefault()}
      trigger={
        trigger ||
        (deal ? (
          <Button className="bg-white/20 h-11 cursor-pointer text-white border-0 hover:bg-white/30 transition-all hover:scale-105 active:scale-95 rounded-xl">
            <RiEdit2Line className="h-4 w-4 mr-2" />
            แก้ไข
          </Button>
        ) : (
          <Button size="sm" className="rounded-xl px-4 font-bold h-11">
            <Plus className="mr-2 h-4 w-4" />
            สร้าง Deal
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
        title={isEditing ? "ยืนยันการแก้ไขดีล" : "ยืนยันการสร้างดีล"}
        description={isEditing ? "คุณต้องการบันทึกการเปลี่ยนแปลงของดีลนี้ใช่หรือไม่?" : "ข้อมูลดีลถูกต้องและคุณต้องการบันทึกข้อมูลใช่หรือไม่?"}
        confirmText={isEditing ? "บันทึกการแก้ไข" : "บันทึกดีล"}
        cancelText="ตรวจสอบอีกรอบ"
        onConfirm={handleConfirmSave}
      />
    </ResponsiveDialog>
  );
}
