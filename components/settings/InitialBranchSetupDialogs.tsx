"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2, ArrowRight, Building2, Database } from "lucide-react";
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {step === "create" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                สร้างสาขาแรกของคุณ
              </DialogTitle>
              <DialogDescription>
                เนื่องจากเพิ่งเปิดใช้งาน Multi-Branch ครั้งแรก
                กรุณาสร้างสาขาแรกเพื่อเริ่มต้นใช้งาน (คุณจะถูกตั้งเป็นบทบาท
                OWNER อัตโนมัติ)
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleCreateBranch)}
                className="space-y-4 pt-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อสาขา / สำนักงาน</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="เช่น สำนักงานใหญ่, สาขาสุขุมวิท"
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
                    <FormItem>
                      <FormLabel>URL Slug (ภาษาอังกฤษ)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="เช่น headquarter, sukhumvit"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        ใช้สำหรับ URL ของระบบ (ตัวพิมพ์เล็กและขีดกลางเท่านั้น)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={form.formState.isSubmitting}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {form.formState.isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    ต่อไป <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}

        {step === "migrate" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-600" />
                ดึงข้อมูลที่มีอยู่เข้าสาขาไหม?
              </DialogTitle>
              <DialogDescription>
                คุณต้องการย้ายข้อมูล ทรัพย์ ลูกค้า ดีล สัญญา และ{" "}
                <strong>พนักงานทุกคน</strong> ที่มีอยู่ในปัจจุบัน เข้าไปยังสาขา
                "{form.getValues("name")}" ที่เพิ่งสร้างด้วยหรือไม่?
              </DialogDescription>
            </DialogHeader>

            <div className="bg-amber-50 rounded-md p-3 text-sm text-amber-800 border border-amber-200 mt-2 mb-4">
              <p className="font-semibold mb-1">สิ่งที่จะเกิดขึ้น:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>
                  ทรัพย์ ลูกค้า และเอกสารทั้งหมดในระบบจะถูกผูกเข้ากับสาขานี้
                </li>
                <li>พนักงานปัจจุบันทุกคนจะสามารถเข้าถึงและทำงานต่อได้ปกติ</li>
                <li>
                  หากเลือก <strong>เริ่มใหม่</strong> สาขานี้จะว่างเปล่า
                  พนักงานคนอื่นจะมองไม่เห็นข้อมูล
                </li>
              </ul>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => handleMigrateDecision(false)}
                disabled={isMigrating}
              >
                ไม่, เริ่มใหม่ทั้งหมด
              </Button>
              <Button
                onClick={() => handleMigrateDecision(true)}
                disabled={isMigrating}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 font-medium"
              >
                {isMigrating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    กำลังย้ายข้อมูล...
                  </>
                ) : (
                  "ใช่, ดึงข้อมูลเข้าสาขานี้"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
