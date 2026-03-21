"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import type { Database } from "@/lib/database.types";
import { z } from "zod";

type TenantRow = Database["public"]["Tables"]["tenants"]["Row"];

// Base validation matching the server schema
const slugSchema = z
  .string()
  .min(2, "Slug ต้องมีอย่างน้อย 2 ตัวอักษร")
  .regex(/^[a-z0-h-]+$/, "Slug ต้องเป็นภาษาอังกฤษตัวเล็กและขีดกลางเท่านั้น");

interface BranchOnboardingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BranchOnboardingDialog({ isOpen, onClose }: BranchOnboardingDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: "", slug: "" });
  const [createdTenant, setCreatedTenant] = useState<TenantRow | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

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
        toast.success("สร้างสาขาสำเร็จ!");
      } else {
        toast.error(res.error || "ไม่สามารถสร้างสาขาได้");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
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
        toast.success("ย้ายข้อมูลเข้าสู่สาขาใหม่เรียบร้อยแล้ว");
        onClose();
      } else {
        toast.error(res.error || "ไม่สามารถย้ายข้อมูลได้");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดระหว่างการย้ายข้อมูล");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && step === 2 ? null : onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-2xl">
        {step === 1 ? (
          <form onSubmit={handleCreateBranch} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                <Building2 className="h-24 w-24 rotate-12" />
              </div>
              <DialogHeader className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-md">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <DialogTitle className="text-2xl font-black mb-2">ยินดีต้อนรับสู่ระบบบริหารจัดการ!</DialogTitle>
                <DialogDescription className="text-blue-100/80 font-medium">
                  ดูเหมือนคุณจะเปิดโหมด Multi-tenant เป็นครั้งแรก มาเริ่มสร้างสาขาหลักของคุณกันครับ
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-8 space-y-6 bg-white">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="branch-name" className="text-slate-700 font-bold">ชื่อสาขา / แฟรนไชส์</Label>
                  <Input
                    id="branch-name"
                    placeholder="เช่น สาขาสำนักงานใหญ่, Real Estate Group"
                    value={newBranch.name}
                    onChange={(e) =>
                      setNewBranch({ ...newBranch, name: e.target.value })
                    }
                    className="h-12 border-slate-200 focus:border-blue-500 transition-all rounded-xl"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="branch-slug" className="text-slate-700 font-bold">Slug Name (URL)</Label>
                  <Input
                    id="branch-slug"
                    placeholder="เช่น head-office (ภาษาอังกฤษเท่านั้น)"
                    value={newBranch.slug}
                    onChange={(e) => {
                      setNewBranch({
                        ...newBranch,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      });
                      setSlugError(null); // Clear error on type
                    }}
                    className={cn(
                      "h-12 transition-all rounded-xl",
                      slugError ? "border-red-500 focus-visible:ring-red-500" : "border-slate-200 focus:border-blue-500"
                    )}
                    required
                  />
                  {slugError && (
                    <p className="text-sm text-red-500 font-medium">{slugError}</p>
                  )}
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button 
                  type="submit" 
                  disabled={isProcessing}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all group"
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      สร้างสาขาและถัดไป
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </form>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-linear-to-br from-emerald-500 to-teal-600 p-8 text-white relative overflow-hidden text-center">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <DatabaseIcon className="h-24 w-24" />
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black mb-2">สร้างสาขาสมบูรณ์!</DialogTitle>
                <DialogDescription className="text-emerald-50/80 font-medium">
                  ย้ายข้อมูลเดิมของคุณเข้าสู่สาขาใหม่นี้หรือไม่?
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-8 space-y-6 bg-white">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <p className="text-sm text-slate-600 leading-relaxed">
                  ระบบตรวจสอบพบข้อมูลที่ยังไม่ระบุสาขา (ทรัพย์สิน, ลูกค้า, รายชื่อผู้ติดต่อ) คุณต้องการนำข้อมูลเหล่านี้มาใส่ในสาขา <span className="font-bold text-slate-900">"{createdTenant?.name}"</span> ที่พึ่งสร้างขึ้นมาเลยไหมครับ?
                </p>
                <div className="flex items-center gap-2 text-xs text-amber-600 font-bold bg-amber-50 p-2 rounded-lg">
                  <DatabaseIcon className="h-4 w-4" />
                   ข้อมูลเดิมทั้งหมดจะถูกเชื่อมโยงกับสาขานี้ทันที
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-12 font-bold rounded-xl border-slate-200"
                  onClick={() => handleMigrateData(false)}
                  disabled={isProcessing}
                >
                  ไว้ทีหลัง
                </Button>
                <Button
                  className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all"
                  onClick={() => handleMigrateData(true)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "ตกลง ย้ายข้อมูลเลย"
                  )}
                </Button>
              </div>
              <p className="text-center text-[11px] text-slate-400">
                หากคุณมีหลายสาขาในอนาคต สามารถเลือกย้ายข้อมูลแยกทีละรายการได้ภายหลัง
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
