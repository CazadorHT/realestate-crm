"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, ArrowRight, Building2, Database, Check } from "lucide-react";
import { toast } from "sonner";
import {
  createInitialTenantAction,
  migrateDataToTenantAction,
} from "@/lib/actions/tenant-management";

const branchSchema = z.object({
  name: z.string().min(2, "ชื่อสาขาต้องมีอย่างน้อย 2 ตัวอักษร"),
  slug: z
    .string()
    .min(2, "Slug ต้องมีอย่างน้อย 2 ตัวอักษร")
    .regex(/^[a-z0-h-]+$/, "Slug ต้องเป็นภาษาอังกฤษตัวเล็กและขีดกลางเท่านั้น"),
});

interface InitialBranchSetupDialogsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSetupComplete: () => void;
}

export function InitialBranchSetupDialogs({
  open,
  onOpenChange,
  onSetupComplete,
}: InitialBranchSetupDialogsProps) {
  const [step, setStep] = useState<"create" | "migrate">("create");
  const [createdTenantId, setCreatedTenantId] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  const form = useForm<z.infer<typeof branchSchema>>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const handleCreateBranch = async (values: z.infer<typeof branchSchema>) => {
    try {
      const { data, error } = await createInitialTenantAction(values);

      if (error) {
        toast.error(error);
        return;
      }

      if (data) {
        setCreatedTenantId(data.id);
        setStep("migrate");
        toast.success("สร้างสาขาสำเร็จ! ย้ายไปขั้นตอนต่อไป");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการสร้างสาขา");
    }
  };

  const handleMigrateDecision = async (shouldMigrate: boolean) => {
    if (!createdTenantId) return;

    if (shouldMigrate) {
      setIsMigrating(true);
      try {
        const { success, error } =
          await migrateDataToTenantAction(createdTenantId);

        if (error) {
          toast.error(error);
          setIsMigrating(false);
          return;
        }

        if (success) {
          toast.success("ดึงข้อมูลเข้าสาขาเสร็จสมบูรณ์");
        }
      } catch (error) {
        toast.error("เกิดข้อผิดพลาดในการย้ายข้อมูล");
        setIsMigrating(false);
        return;
      }
    }

    // Complete setup either way
    onSetupComplete();
    resetState();
  };

  const resetState = () => {
    form.reset();
    setStep("create");
    setCreatedTenantId(null);
    setIsMigrating(false);
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing if we are in the middle of the flow
    if (!newOpen && step === "migrate") {
      toast.info("กรุณาเลือกว่าจะย้ายข้อมูลหรือไม่");
      return;
    }

    if (!newOpen) {
      resetState();
    } else {
      onOpenChange(true);
    }
  };

  // Convert name to slug automatically
  const watchName = form.watch("name");
  const handleNameBlur = () => {
    const currentSlug = form.getValues("slug");
    if (!currentSlug && watchName) {
      // Basic slugification for Thai/English
      const generatedSlug = watchName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric with dash
        .replace(/(^-|-$)/g, ""); // remove leading/trailing dashes

      // Only set if we got valid english chars, otherwise leave blank
      if (/^[a-z0-9-]+$/.test(generatedSlug)) {
        form.setValue("slug", generatedSlug, { shouldValidate: true });
      }
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            {step === "create" ? (
              <Building2 className="h-5 w-5 text-indigo-600" />
            ) : (
              <Database className="h-5 w-5 text-indigo-600" />
            )}
          </div>
          <span className="font-bold">
            {step === "create" ? "สร้างสาขาแรกของคุณ" : "ดึงข้อมูลเข้าสาขาใหม่"}
          </span>
        </div>
      }
      description={
        step === "create" 
          ? "กรุณาสร้างสาขาแรกเพื่อเริ่มต้นใช้งานระบบ Multi-Branch" 
          : "คุณต้องการย้ายข้อมูลที่มีอยู่เดิมเข้าสู่สาขานี้หรือไม่?"
      }
      footer={
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {step === "create" ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={form.formState.isSubmitting}
                className="flex-1 h-12 rounded-xl font-bold text-slate-500"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={form.handleSubmit(handleCreateBranch)}
                disabled={form.formState.isSubmitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl font-bold text-white shadow-lg shadow-indigo-100 transition-all active:scale-95"
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                สร้างสาขา <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                className="flex-1 h-12 rounded-xl font-bold text-slate-500"
                onClick={() => handleMigrateDecision(false)}
                disabled={isMigrating}
              >
                ไม่, เริ่มใหม่ทั้งหมด
              </Button>
              <Button
                onClick={() => handleMigrateDecision(true)}
                disabled={isMigrating}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl font-bold text-white shadow-lg shadow-indigo-100 transition-all active:scale-95"
              >
                {isMigrating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    กำลังย้าย...
                  </>
                ) : (
                  "ใช่, ดึงข้อมูลเดิมมาด้วย"
                )}
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="py-4 pb-6">
        {step === "create" && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreateBranch)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="font-bold text-slate-700 ml-1">ชื่อสาขา / สำนักงาน</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="เช่น สำนักงานใหญ่, สาขาสุขุมวิท"
                        className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500/10"
                        {...field}
                        onBlur={(e) => {
                          field.onBlur();
                          handleNameBlur();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="font-bold text-slate-700 ml-1">URL Slug (ภาษาอังกฤษ)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="เช่น headquarter, sukhumvit"
                        className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500/10 font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[11px] ml-1">
                      ใช้สำหรับ URL ของระบบ (ตัวพิมพ์เล็กและขีดกลางเท่านั้น)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        )}

        {step === "migrate" && (
          <div className="space-y-4">
            <div className="bg-amber-50 rounded-2xl p-5 text-sm text-amber-800 border border-amber-100 shadow-sm leading-relaxed">
              <p className="font-bold mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-amber-500 rounded-full" />
                สิ่งที่จะเกิดขึ้นเมื่อเลือกย้ายข้อมูล:
              </p>
              <ul className="space-y-2 text-[13px] opacity-90">
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  ทรัพย์ ลูกค้า และเอกสารทั้งหมดในระบบจะถูกผูกเข้ากับสาขานี้
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  พนักงานปัจจุบันทุกคนจะย้ายมาสังกัดสาขานี้ และทำงานต่อได้ทันที
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-amber-200/30">
                <p className="text-xs font-bold text-amber-700 italic">
                  * หากคุณต้องการเริ่มแบบสาขาที่ว่างเปล่า ให้เลือก "เริ่มใหม่ทั้งหมด"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}
