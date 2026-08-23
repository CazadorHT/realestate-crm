"use client";

import React, { useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Database as DatabaseIcon,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { 
  createTenantAction, 
  migrateDataToTenantAction 
} from "@/lib/actions/tenant-management";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types.generated";
import { z } from "zod";
import { useLanguage } from "@/components/providers/LanguageProvider";

type TenantRow = Database["public"]["Tables"]["tenants_v3"]["Row"];

interface BranchOnboardingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BranchOnboardingDialog({ isOpen, onClose }: BranchOnboardingDialogProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [step, setStep] = useState<1 | 2>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: "", slug: "" });
  const [createdTenant, setCreatedTenant] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  const slugSchema = z
    .string()
    .min(2, isEn ? "Slug must be at least 2 characters" : "Slug ต้องมีอย่างน้อย 2 ตัวอักษร")
    .regex(/^[a-z0-9-]+$/, isEn ? "Slug must be lowercase alphanumeric and hyphens only" : "Slug ต้องเป็นภาษาอังกฤษตัวเล็กและขีดกลางเท่านั้น");

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation before sending to server
    const slugValidation = slugSchema.safeParse(newBranch.slug);
    if (!slugValidation.success) {
      setSlugError(slugValidation.error.issues[0].message);
      return;
    }
    setSlugError(null);

    setIsProcessing(true);
    try {
      const res = await createTenantAction(newBranch);
      if (res.data) {
        setCreatedTenant(res.data);
        setStep(2);
        toast.success(isEn ? "Branch created successfully!" : "สร้างสาขาสำเร็จ!");
      } else {
        toast.error(res.error || (isEn ? "Failed to create branch" : "ไม่สามารถสร้างสาขาได้"));
      }
    } catch (error) {
      toast.error(isEn ? "Connection error" : "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMigrateData = async (shouldMigrate: boolean) => {
    if (!shouldMigrate || !createdTenant) {
      onClose();
      return;
    }

    setIsProcessing(true);
    try {
      const res = await migrateDataToTenantAction(createdTenant.id);
      if (res.success) {
        toast.success(isEn ? "Data successfully migrated to new branch" : "ย้ายข้อมูลเข้าสู่สาขาใหม่เรียบร้อยแล้ว");
        onClose();
      } else {
        toast.error(res.error || (isEn ? "Failed to migrate data" : "ไม่สามารถย้ายข้อมูลได้"));
      }
    } catch (error) {
      toast.error(isEn ? "Error during data migration" : "เกิดข้อผิดพลาดระหว่างการย้ายข้อมูล");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={(open) => !open && step === 2 ? null : onClose()}
      title={
        step === 1 ? (
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 leading-tight">
                {isEn ? "Welcome!" : "ยินดีต้อนรับ!"}
              </span>
              <span className="text-xs font-bold text-blue-600/80 uppercase tracking-wider">
                {isEn ? "Multi-tenant Mode" : "โหมด Multi-tenant"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-emerald-600">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <span className="text-xl font-black leading-tight">
              {isEn ? "Branch Created!" : "สร้างสาขาสมบูรณ์!"}
            </span>
          </div>
        )
      }
      description={
        step === 1 
          ? (isEn ? "Let's start by creating your primary branch to organize data segregation." : "มาเริ่มสร้างสาขาหลักของคุณเพื่อแยกการจัดการข้อมูลครับ")
          : (isEn ? `Do you want to migrate existing unassigned records into "${createdTenant?.name}"?` : `ย้ายข้อมูลเดิมของคุณเข้าสู่สาขาใหม่ "${createdTenant?.name}" หรือไม่?`)
      }
      footer={
        step === 1 ? (
          <Button 
            onClick={handleCreateBranch}
            disabled={isProcessing}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all group shrink-0 cursor-pointer"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <>
                {isEn ? "Create Branch & Next" : "สร้างสาขาและถัดไป"}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        ) : (
          <div className="flex flex-col xs:grid xs:grid-cols-2 gap-3 sm:gap-4 w-full shrink-0">
            <Button
              variant="outline"
              className="h-12 font-bold rounded-xl border-slate-200 text-slate-500 order-2 xs:order-1 cursor-pointer"
              onClick={() => handleMigrateData(false)}
              disabled={isProcessing}
            >
              {isEn ? "Later" : "ไว้ทีหลัง"}
            </Button>
            <Button
              className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all order-1 xs:order-2 cursor-pointer"
              onClick={() => handleMigrateData(true)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                isEn ? "Yes, Migrate Data" : "ตกลง ย้ายข้อมูล"
              )}
            </Button>
          </div>
        )
      }
    >
      {step === 1 ? (
        <div className="space-y-6 py-2">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="branch-name" className="text-sm font-bold text-slate-700 ml-1">
                {isEn ? "Branch / Company Name" : "ชื่อสาขา / แฟรนไชส์"}
              </Label>
              <Input
                id="branch-name"
                placeholder={isEn ? "e.g. Head Office, Real Estate Group" : "เช่น สำนักงานใหญ่, Real Estate Group"}
                value={newBranch.name}
                onChange={(e) =>
                  setNewBranch({ ...newBranch, name: e.target.value })
                }
                className="h-12 border-slate-200 focus:border-blue-500 transition-all rounded-xl bg-slate-50/50"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="branch-slug" className="text-sm font-bold text-slate-700 ml-1">
                {isEn ? "Slug Name (URL Extension)" : "Slug Name (URL Extension)"}
              </Label>
              <Input
                id="branch-slug"
                placeholder={isEn ? "e.g. head-office (lowercase English only)" : "เช่น head-office (ภาษาอังกฤษเท่านั้น)"}
                value={newBranch.slug}
                onChange={(e) => {
                  setNewBranch({
                    ...newBranch,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  });
                  setSlugError(null);
                }}
                className={cn(
                  "h-12 transition-all rounded-xl bg-slate-50/50",
                  slugError ? "border-red-500 focus-visible:ring-red-500" : "border-slate-200 focus:border-blue-500"
                )}
                required
              />
              {slugError ? (
                <p className="text-xs text-red-500 font-bold ml-1">{slugError}</p>
              ) : (
                <p className="text-[10px] text-slate-400 font-medium ml-1">
                  {isEn ? "Example: " : "ตัวอย่าง: "}crm-real-estate.com/branch/<span className="text-blue-600 font-bold">{newBranch.slug || "slug-name"}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 py-2">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5">
              <DatabaseIcon className="h-20 w-20" />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed relative z-10">
              {isEn
                ? `Existing records without branch assignment (properties, clients, contacts) were detected. Would you like to associate them with "${createdTenant?.name}"?`
                : `ระบบตรวจสอบพบข้อมูลที่ยังไม่ระบุสาขา (ทรัพย์สิน, ลูกค้า, รายชื่อผู้ติดต่อ) คุณต้องการนำข้อมูลเหล่านี้มาใส่ในสาขา "${createdTenant?.name}" เลยไหมครับ?`}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-amber-600 font-black bg-amber-50 p-2.5 rounded-xl border border-amber-100">
              <DatabaseIcon className="h-3.5 w-3.5" />
              {isEn ? "All legacy records will be linked to this branch immediately" : "ข้อมูลเดิมทั้งหมดจะถูกเชื่อมโยงกับสาขานี้ทันที"}
            </div>
          </div>
          <p className="text-center text-[11px] text-slate-400 leading-tight">
            {isEn
              ? "If you have multiple branches later, you can also reassign records individually."
              : "หากคุณมีหลายสาขาในอนาคต สามารถเลือกย้ายข้อมูลแยกทีละรายการได้ภายหลัง"}
          </p>
        </div>
      )}
    </ResponsiveDialog>
  );
}
