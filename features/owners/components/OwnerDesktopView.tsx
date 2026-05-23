"use client";

import { UseFormReturn } from "react-hook-form";
import {
  User,
  Phone,
  AtSign,
  Loader2,
  Save,
  X,
  Building2,
} from "lucide-react";
import { FaFacebook, FaLine } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface OwnerDesktopViewProps {
  form: UseFormReturn<any>;
  isPending: boolean;
  error: string | null;
  mode: "create" | "edit";
  handleCancel: () => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isInDialog?: boolean;
}

export function OwnerDesktopView({
  form,
  isPending,
  error,
  mode,
  handleCancel,
  onSubmit,
  isInDialog,
}: OwnerDesktopViewProps) {
  return (
    <form 
      className="space-y-8" 
      onSubmit={onSubmit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      }}
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium flex items-center gap-2">
          <X className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="space-y-6 pb-24 bg-white">
        {/* Main Info Card */}
        <div className="bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-200/60 pb-2 mb-2">
            <User className="h-4 w-4 text-blue-600" />
            ข้อมูลทั่วไป
          </div>

          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                ชื่อเจ้าของ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="เช่น คุณสมชาย ใจดี"
                  className="pl-9 h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all rounded-xl"
                  {...form.register("full_name")}
                />
              </div>
              {form.formState.errors.full_name && (
                <p className="text-xs text-red-500 font-medium ml-1">
                  {(form.formState.errors.full_name as any).message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">ประเภทเจ้าของ</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                {[
                  { id: "individual", label: "บุคคลธรรมดา" },
                  { id: "corporate", label: "นิติบุคคล / บริษัท" },
                ].map((type) => {
                  const isActive = form.watch("owner_type") === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => form.setValue("owner_type", type.id, { shouldDirty: true })}
                      className={cn(
                        "h-11 px-2 rounded-lg text-xs font-bold transition-all duration-300",
                        isActive 
                          ? "bg-white text-emerald-600 shadow-sm border border-emerald-100" 
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                      )}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-semibold text-slate-700">ชื่อบริษัท (ถ้ามี)</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="เช่น บริษัท วี-ลิงค์ แอสเซท จำกัด"
                  className="pl-9 h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all rounded-xl"
                  {...form.register("company_name")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info Card */}
        <div className="bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-200/60 pb-2 mb-2">
            <Phone className="h-4 w-4 text-emerald-600" />
            ข้อมูลการติดต่อ
          </div>

          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                เบอร์โทร
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                 
                  placeholder="089-xxx-xxxx"
                  className="pl-9 h-11 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all rounded-xl"
                  {...form.register("phone")}
                />
              </div>
            </div>

            {/* Line ID */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Line ID
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <FaLine className="h-4 w-4 text-[#06C755]" />
                </div>
                <Input
                  placeholder="@lineid"
                  className="pl-9 h-11 bg-white border-slate-200 focus:border-[#06C755] focus:ring-[#06C755]/20 transition-all rounded-xl"
                  {...form.register("line_id")}
                />
              </div>
            </div>

            {/* Facebook */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Facebook URL
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <FaFacebook className="h-4 w-4 text-[#1877F2]" />
                </div>
                <Input
                  placeholder="facebook.com/..."
                  className="pl-9 h-11 bg-white border-slate-200 focus:border-[#1877F2] focus:ring-[#1877F2]/20 transition-all rounded-xl"
                  {...form.register("facebook_url")}
                />
              </div>
              {form.formState.errors.facebook_url && (
                <p className="text-xs text-red-500 font-medium ml-1">
                  {(form.formState.errors.facebook_url as any).message}
                </p>
              )}
            </div>

            {/* Other Contact */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                ช่องทางอื่นๆ
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="WhatsApp, WeChat..."
                  className="pl-9 h-11 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-400/20 transition-all rounded-xl"
                  {...form.register("other_contact")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons (Sticky Bottom) - Premium Redesign */}
      <div className="sticky bottom-0 z-40 p-6 bg-white/90 backdrop-blur-xl border-t border-slate-100/80 flex items-center justify-end gap-4">
        {isInDialog ? (
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              className="h-12 px-8 rounded-2xl font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 transition-all"
            >
              ยกเลิก
            </Button>
          </DialogClose>
        ) : (
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={handleCancel}
            className="h-12 px-8 rounded-2xl font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 transition-all"
          >
            ยกเลิก
          </Button>
        )}

        <Button
          type="submit"
          disabled={
            isPending || !form.formState.isValid || !form.formState.isDirty
          }
          className="h-12 px-10 rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold shadow-[0_8px_25px_-8px_rgba(16,185,129,0.5)] hover:shadow-[0_12px_30px_-10px_rgba(16,185,129,0.6)] hover:scale-[1.02] active:scale-95 transition-all gap-2.5 disabled:opacity-50 disabled:scale-100"
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          <span className="tracking-wide">
            {isPending
              ? "กำลังบันทึก..."
              : mode === "create"
                ? "เพิ่มเจ้าของ"
                : "บันทึกข้อมูล"}
          </span>
        </Button>
      </div>
    </form>
  );
}
