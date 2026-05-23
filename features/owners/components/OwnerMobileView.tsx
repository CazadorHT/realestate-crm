"use client";

import { UseFormReturn } from "react-hook-form";
import { m, AnimatePresence } from "framer-motion";
import {
  User,
  Phone,
  Globe,
  AtSign,
  Loader2,
  Save,
  ChevronRight,
  ChevronLeft,
  Building2,
} from "lucide-react";
import { FaFacebook, FaLine } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { DrawerClose } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface OwnerMobileViewProps {
  form: UseFormReturn<any>;
  currentStep: number;
  totalSteps: number;
  isPending: boolean;
  mode: "create" | "edit";
  nextStep: () => Promise<void>;
  prevStep: () => void;
  handleCancel: () => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isInDialog?: boolean;
}

export function OwnerMobileView({
  form,
  currentStep,
  totalSteps,
  isPending,
  mode,
  nextStep,
  prevStep,
  handleCancel,
  onSubmit,
  isInDialog,
}: OwnerMobileViewProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Mobile Header / Progress */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">
            {mode === "create" ? "เพิ่มเจ้าของใหม่" : "แก้ไขข้อมูลเจ้าของ"}
          </h2>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
            Step {currentStep}/{totalSteps}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <m.div
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <AnimatePresence mode="wait">
            <m.div
              key={currentStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wide">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <User size={16} />
                      </div>
                      ข้อมูลพื้นฐาน
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">
                          ชื่อเจ้าของ <span className="text-red-500">*</span>
                        </label>
                        <Input
                          placeholder="กรอกชื่อ-นามสกุล"
                          className="h-13 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                          {...form.register("full_name")}
                        />
                        {form.formState.errors.full_name && (
                          <p className="text-xs font-semibold text-red-500 mt-1 ml-1">
                            {(form.formState.errors.full_name as any).message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700">
                          ประเภทเจ้าของ
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                          {[
                            { id: "individual", label: "บุคคลธรรมดา" },
                            { id: "corporate", label: "นิติบุคคล / บริษัท" },
                          ].map((type) => {
                            const isActive =
                              form.watch("owner_type") === type.id;
                            return (
                              <button
                                key={type.id}
                                type="button"
                                onClick={() =>
                                  form.setValue("owner_type", type.id, {
                                    shouldDirty: true,
                                  })
                                }
                                className={cn(
                                  "py-3 px-2 rounded-xl text-xs font-bold transition-all duration-300",
                                  isActive
                                    ? "bg-white text-emerald-600 shadow-sm border border-emerald-100 ring-4 ring-emerald-500/5"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50",
                                )}
                              >
                                {type.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">
                          ชื่อบริษัท (ถ้ามี)
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="กรอกชื่อบริษัท"
                            className="h-13 pl-11 rounded-2xl bg-slate-50 border-transparent focus:bg-white transition-all font-medium"
                            {...form.register("company_name")}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wide">
                      <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                        <Phone size={16} />
                      </div>
                      ช่องทางติดต่อหลัก
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">
                          เบอร์โทรศัพท์
                        </label>
                        <Input
                          placeholder="08X-XXX-XXXX"
                          className="h-13 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                          {...form.register("phone")}
                        />
                        {form.formState.errors.phone && (
                          <p className="text-xs font-semibold text-red-500 mt-1 ml-1">
                            {(form.formState.errors.phone as any).message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">
                          Line ID
                        </label>
                        <div className="relative">
                          <FaLine className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#06C755]" />
                          <Input
                            placeholder="@lineid"
                            className="h-13 pl-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-[#06C755] focus:ring-4 focus:ring-[#06C755]/10 transition-all font-medium"
                            {...form.register("line_id")}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wide">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <Globe size={16} />
                      </div>
                      โซเชียลและช่องทางอื่นๆ
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">
                          Facebook URL
                        </label>
                        <div className="relative">
                          <FaFacebook className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#1877F2]" />
                          <Input
                            placeholder="facebook.com/your-profile"
                            className="h-13 pl-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-[#1877F2] focus:ring-4 focus:ring-[#1877F2]/10 transition-all font-medium"
                            {...form.register("facebook_url")}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">
                          ช่องทางอื่นๆ
                        </label>
                        <div className="relative">
                          <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="WhatsApp, WeChat, ฯลฯ"
                            className="h-13 pl-11 rounded-2xl bg-slate-50 border-transparent focus:bg-white transition-all font-medium"
                            {...form.register("other_contact")}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </m.div>
          </AnimatePresence>
        </div>

        {/* Mobile Footer Navigation */}
        <div className="p-6 bg-white border-t border-slate-100 flex items-center gap-3">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={prevStep}
              className="h-14 px-6 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
            >
              <ChevronLeft className="mr-2 h-5 w-5" />
              กลับ
            </Button>
          ) : (
            <>
              {isInDialog ? (
                <DrawerClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-14 px-6 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    ยกเลิก
                  </Button>
                </DrawerClose>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancel}
                  className="h-14 px-6 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  ยกเลิก
                </Button>
              )}
            </>
          )}

          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={nextStep}
              className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
            >
              ถัดไป
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isPending || !form.formState.isValid}
              className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xl shadow-emerald-600/20 active:scale-95 transition-all gap-2"
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {isPending
                ? "กำลังบันทึก..."
                : mode === "create"
                  ? "เพิ่มเจ้าของ"
                  : "บันทึกข้อมูล"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
