"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Check, ChevronsUpDown, Bell, Clock, Languages, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  rentNotificationRuleSchema,
  RentNotificationRuleInput,
} from "../schema";
import {
  createRentNotificationRule,
  updateRentNotificationRule,
} from "../actions";
import { useRouter } from "next/navigation";
import { LINEGroup, SimpleProperty } from "../types";

interface AddRuleDialogProps {
  groups: LINEGroup[];
  properties: SimpleProperty[];
  tenantId?: string | null;
  existingRule?: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddRuleDialog({
  groups,
  properties,
  tenantId,
  existingRule,
  open,
  onOpenChange,
}: AddRuleDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [propertySearchOpen, setPropertySearchOpen] = useState(false);
  const [propertySearchQuery, setPropertySearchQuery] = useState("");
  const { t } = useLanguage();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isHourOpen, setIsHourOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [pendingValues, setPendingValues] =
    useState<RentNotificationRuleInput | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const steps = [
    { title: "เลือกทรัพย์", desc: "Property" },
    { title: "ตั้งค่ากลุ่ม LINE", desc: "Communication" },
    { title: "กำหนดเวลา", desc: "Schedule" },
  ];
  const isEdit = !!existingRule;
  const router = useRouter();

  // Sync external open state if provided
  useEffect(() => {
    if (open !== undefined) setIsOpen(open);
  }, [open]);

  // Handle internal open change
  const updateOpen = (val: boolean) => {
    setIsOpen(val);
    onOpenChange?.(val);
    if (!val) {
      form.reset();
      setCurrentStep(1);
    }
  };

  const form = useForm<RentNotificationRuleInput>({
    resolver: zodResolver(rentNotificationRuleSchema),
    defaultValues: {
      property_id: existingRule?.property_id || "",
      line_group_id: existingRule?.line_group_id || "",
      notification_day: existingRule?.notification_day || 1,
      notification_hour: existingRule?.notification_hour ?? 9,
      is_active: existingRule?.is_active ?? true,
      language: (existingRule?.language as "th" | "en" | "cn") || "th",
      tenant_id: existingRule?.tenant_id || tenantId || null,
    },
  });

  useEffect(() => {
    if (existingRule) {
      form.reset({
        property_id: existingRule.property_id,
        line_group_id: existingRule.line_group_id,
        notification_day: existingRule.notification_day,
        notification_hour: existingRule.notification_hour ?? 9,
        is_active: existingRule.is_active ?? true,
        language: (existingRule.language as "th" | "en" | "cn") || "th",
        tenant_id: existingRule.tenant_id || tenantId || null,
      });
    }
  }, [existingRule, form, tenantId]);

  const executeSubmit = async (values: RentNotificationRuleInput) => {
    try {
      let res;
      if (isEdit) {
        res = await updateRentNotificationRule(existingRule.id, values);
      } else {
        res = await createRentNotificationRule(values);
      }

      if (res.success) {
        toast.success(isEdit ? "บันทึกการแก้ไขแล้ว" : "สร้างการแจ้งเตือนแล้ว");
        updateOpen(false);
        router.refresh();
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาด");
      }
    } catch (e: any) {
      toast.error("เกิดข้อผิดพลาด: " + e.message);
    }
  };

  const onSubmit = async (values: RentNotificationRuleInput) => {
    if (isEdit) {
      setPendingValues(values);
      setIsConfirming(true);
    } else {
      await executeSubmit(values);
    }
  };

  return (
    <>
      <ResponsiveDialog
        open={isOpen}
        onOpenChange={updateOpen}
        className="max-w-xl"
        trigger={
          !isEdit ? (
            <Button className="gap-2 bg-white text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-all shadow-md rounded-xl h-11 font-bold">
              <Plus className="w-4 h-4" />
              สร้างการแจ้งเตือน
            </Button>
          ) : undefined
        }
        title={
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Bell className="w-5 h-5" />
            </div>
            <span>{isEdit ? "แก้ไขการแจ้งเตือน" : "สร้างการแจ้งเตือนใหม่"}</span>
          </div>
        }
        description="ระบุทรัพย์และกลุ่มไลน์ที่ต้องการให้แจ้งเตือนค่าเช่า"
        footer={
          <div className="flex flex-row gap-3 w-full">
            {currentStep > 1 ? (
              <Button
                variant="outline"
                type="button"
                onClick={() => setCurrentStep(s => s - 1)}
                className="flex-1 rounded-xl h-12 font-bold border-slate-200 text-slate-500 gap-2"
              >
                ย้อนกลับ
              </Button>
            ) : (
              <Button
                variant="outline"
                type="button"
                onClick={() => updateOpen(false)}
                className="flex-1 rounded-xl h-12 font-bold border-slate-200 text-slate-500"
              >
                ยกเลิก
              </Button>
            )}

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={() => {
                  if (currentStep === 1 && !form.getValues("property_id")) {
                    toast.error("กรุณาเลือกทรัพย์ก่อนไปขั้นตอนถัดไป");
                    return;
                  }
                  if (currentStep === 2 && !form.getValues("line_group_id")) {
                    toast.error("กรุณาเลือกกลุ่มไลน์ก่อนไปขั้นตอนถัดไป");
                    return;
                  }
                  setCurrentStep(s => s + 1);
                }}
                className="flex-2 bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-500/10 gap-2"
              >
                ถัดไป
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-emerald-500/10"
              >
                {isEdit ? "บันทึกการเปลี่ยนแปลง" : "สร้างการแจ้งเตือน"}
              </Button>
            )}
          </div>
        }
      >
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-10">
            {steps.map((step, idx) => {
              const s = idx + 1;
              return (
                <div key={s} className={cn("flex items-center", s < 3 ? "flex-1" : "")}>
                  <div className="flex flex-col items-center gap-2 relative">
                    <div 
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
                        currentStep >= s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-400 border-slate-100"
                      )}
                    >
                      {currentStep > s ? <Check className="w-5 h-5" /> : s}
                    </div>
                    <div className="absolute -bottom-6 w-max text-center">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider transition-colors",
                        currentStep === s ? "text-blue-600" : "text-slate-400"
                      )}>
                        {step.title}
                      </span>
                    </div>
                  </div>
                  {s < 3 && (
                    <div 
                      className={cn(
                        "flex-1 h-0.5 mx-4 transition-all rounded-full",
                        currentStep > s ? "bg-blue-600" : "bg-slate-100"
                      )} 
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Form {...form}>
          <form className="space-y-6 pb-6 px-6">
            <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4 no-scrollbar">
              <div className="space-y-6 pb-4">
                {/* Step 1: Property Select */}
                {currentStep === 1 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <FormField
                      control={form.control as any}
                      name="property_id"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-bold text-slate-700 ml-1">เลือกทรัพย์ (Property)</FormLabel>
                          <ResponsiveDialog
                            open={propertySearchOpen}
                            onOpenChange={setPropertySearchOpen}
                            title="เลือกทรัพย์"
                            description="ค้นหาและเลือกทรัพย์ที่ต้องการตั้งค่าแจ้งเตือน (แสดงเฉพาะทรัพย์ที่มีสัญญาเช่าแล้ว)"
                            className="sm:max-w-md"
                            trigger={
                              <FormControl>
                                <Button
                                  variant="outline"
                                  type="button"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between h-11 rounded-xl border-slate-200 bg-slate-50/50",
                                    !field.value && "text-slate-400"
                                  )}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    {field.value
                                      ? properties.find((p: any) => p.id === field.value)
                                          ?.title ||
                                        existingRule?.properties?.title ||
                                        "Unknown Property"
                                      : "ค้นหาทรัพย์..."}
                                  </div>
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            }
                          >
                            <div className="flex flex-col h-[60vh] sm:h-auto">
                              <div className="p-4 border-b border-slate-50 sticky top-0 bg-white z-10">
                                <div className="relative">
                                  <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-45" />
                                  <Input
                                    placeholder="พิมพ์ชื่อทรัพย์..."
                                    className="pl-10 h-10 rounded-xl"
                                    value={propertySearchQuery}
                                    onChange={(e) => setPropertySearchQuery(e.target.value)}
                                    autoFocus
                                  />
                                </div>
                              </div>
                              <div className="flex-1 overflow-y-auto p-2 pointer-events-auto">
                                {(() => {
                                  const filtered = properties.filter((p) =>
                                    p.title.toLowerCase().includes(propertySearchQuery.toLowerCase())
                                  );

                                  if (filtered.length === 0) {
                                    return (
                                      <div className="p-8 text-center text-sm text-slate-400">
                                        ไม่พบทรัพย์ที่คุณกำลังหา
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="space-y-1">
                                      {filtered.map((property: any) => (
                                        <button
                                          key={property.id}
                                          type="button"
                                          className={cn(
                                            "w-full flex items-center justify-between p-3 rounded-xl transition-all active:scale-[0.98]",
                                            property.id === field.value
                                              ? "bg-blue-50 text-blue-700"
                                              : "hover:bg-slate-50 text-slate-700"
                                          )}
                                          onClick={() => {
                                            form.setValue("property_id", property.id);
                                            setPropertySearchOpen(false);
                                          }}
                                        >
                                          <div className="flex flex-col text-left min-w-0">
                                            <span className="font-bold text-sm truncate">{property.title}</span>
                                          </div>
                                          {property.id === field.value && (
                                            <Check className="h-4 w-4 text-blue-600 shrink-0" />
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </ResponsiveDialog>
                          <FormDescription className="text-[11px] text-rose-500 font-medium ml-1">
                            * แสดงเฉพาะทรัพย์ที่มีสัญญาเช่า (Active Contract) เท่านั้น
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 2: LINE Group & Language */}
                {currentStep === 2 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* 2. LINE Group Select */}
                      <FormField
                        control={form.control as any}
                        name="line_group_id"
                        render={({ field }) => {
                          const selectedGroup = groups.find(g => g.group_id === field.value);
                          return (
                            <FormItem className="flex flex-col">
                              <FormLabel className="text-sm font-bold text-slate-700 ml-1">กลุ่มไลน์ (LINE Group)</FormLabel>
                              <ResponsiveDialog
                                open={isGroupOpen}
                                onOpenChange={setIsGroupOpen}
                                title="เลือกกลุ่มไลน์"
                                className="lg:max-w-[400px]!"
                                description="เลือกกลุ่มที่ต้องการให้ระบบแจ้งเตือนค่าเช่า (ต้องเชิญบอทเข้ากลุ่มก่อน)"
                                trigger={
                                  <Button
                                    variant="outline"
                                    type="button"
                                    className="w-full h-11 justify-between px-4 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:text-blue-500 transition-colors font-medium"
                                  >
                                    {selectedGroup ? (
                                      <div className="flex items-center gap-2 ">
                                        {selectedGroup.picture_url && (
                                          <img
                                            src={selectedGroup.picture_url}
                                            className="w-5 h-5 rounded-full"
                                            alt=""
                                          />
                                        )}
                                        <span className="text-slate-900">{selectedGroup.group_name}</span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400">เลือกกลุ่มไลน์...</span>
                                    )}
                                    <ChevronsUpDown className="w-4 h-4 text-slate-400" />
                                  </Button>
                                }
                              >
                                <div className="flex flex-col gap-1  max-h-[60vh] overflow-y-auto pointer-events-auto">
                                  {groups.length === 0 ? (
                                    <div className="py-12 text-center">
                                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Bell className="w-6 h-6 text-slate-300" />
                                      </div>
                                      <p className="text-sm text-slate-500">
                                        ยังไม่มีกลุ่มไลน์ในระบบ <br />
                                        เชิญบอทเข้ากลุ่มเพื่อเริ่มต้นใช้งานครับ
                                      </p>
                                    </div>
                                  ) : (
                                    groups.map((group) => (
                                      <Button
                                        key={group.group_id}
                                        variant="ghost"
                                        type="button"
                                        className={cn(
                                          "w-full h-14 justify-start gap-3 px-4 rounded-xl text-left hover:bg-slate-100 transition-all",
                                          field.value === group.group_id && "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                        )}
                                        onClick={() => {
                                          field.onChange(group.group_id);
                                          setIsGroupOpen(false);
                                        }}
                                      >
                                        {group.picture_url ? (
                                          <img
                                            src={group.picture_url}
                                            className="w-8 h-8 rounded-full border border-slate-100"
                                            alt=""
                                          />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                                            LG
                                          </div>
                                        )}
                                        <div className="flex flex-col ">
                                          <span className="font-bold text-sm">{group.group_name}</span>
                                          <span className="text-[10px] text-slate-400">{group.group_id}</span>
                                        </div>
                                        {field.value === group.group_id && (
                                          <Check className="w-4 h-4 ml-auto" />
                                        )}
                                      </Button>
                                    ))
                                  )}
                                </div>
                              </ResponsiveDialog>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      {/* 3. Language Select */}
                      <FormField
                        control={form.control as any}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                              <Languages className="w-3.5 h-3.5" /> ภาษาที่แจ้งเตือน
                            </FormLabel>
                            <ResponsiveDialog
                              open={isLanguageOpen}
                              onOpenChange={setIsLanguageOpen}
                              title="เลือกภาษา"
                              className="lg:max-w-[300px]!"
                              description="เลือกภาษาที่ต้องการใช้ในการส่งข้อความแจ้งเตือน"
                              trigger={
                                <Button
                                  variant="outline"
                                  type="button"
                                  className="w-full h-11 justify-between hover:text-blue-500 px-4 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 transition-colors font-medium"
                                >
                                  <span className="flex items-center gap-2">
                                    {field.value === "th" && "🇹🇭 ไทย"}
                                    {field.value === "en" && "🇬🇧 อังกฤษ (English)"}
                                    {field.value === "cn" && "🇨🇳 จีน (Chinese)"}
                                  </span>
                                  <ChevronsUpDown className="w-4 h-4 text-slate-400" />
                                </Button>
                              }
                            >
                              <div className="grid gap-2 p-4 pointer-events-auto ">
                                {[
                                  { value: "th", label: "ไทย", flag: "🇹🇭" },
                                  { value: "en", label: "อังกฤษ (English)", flag: "🇬🇧" },
                                  { value: "cn", label: "จีน (Chinese)", flag: "🇨🇳" },
                                ].map((lang) => (
                                  <Button
                                    key={lang.value}
                                    variant="ghost"
                                    type="button"
                                    className={cn(
                                      "w-full h-12 justify-start gap-3 px-4 rounded-xl text-left hover:bg-slate-100 transition-all",
                                      field.value === lang.value && "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                    )}
                                    onClick={() => {
                                      field.onChange(lang.value);
                                      setIsLanguageOpen(false);
                                    }}
                                  >
                                    <span className="text-xl">{lang.flag}</span>
                                    <span className="font-medium">{lang.label}</span>
                                    {field.value === lang.value && (
                                      <Check className="w-4 h-4 ml-auto" />
                                    )}
                                  </Button>
                                ))}
                              </div>
                            </ResponsiveDialog>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Notification Time */}
                {currentStep === 3 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* 4. Notification Day */}
                      <FormField
                        control={form.control as any}
                        name="notification_day"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              วันที่แจ้งเตือน (1-31)
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min={1}
                                  max={31}
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                  className="h-11 rounded-xl pr-16 border-slate-200 bg-slate-50/50 font-medium"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">
                                  ทุกเดือน
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 5. Notification Hour */}
                      <FormField
                        control={form.control as any}
                        name="notification_hour"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" /> เวลาส่งแจ้งเตือน
                            </FormLabel>
                            <ResponsiveDialog
                              open={isHourOpen}
                              onOpenChange={setIsHourOpen}
                              title="เลือกเวลาส่ง"
                              description="เลือกเวลาที่ต้องการให้ระบบส่งข้อความแจ้งเตือนอัตโนมัติ"
                              trigger={
                                <Button
                                  variant="outline"
                                  type="button"
                                  className="w-full h-11 justify-between px-4 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 transition-colors font-medium"
                                >
                                  <span className="flex items-center gap-2 text-slate-900">
                                    {field.value !== undefined ? `${field.value.toString().padStart(2, "0")}:00 น.` : "เลือกเวลา"}
                                  </span>
                                  <ChevronsUpDown className="w-4 h-4 text-slate-400" />
                                </Button>
                              }
                            >
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-4 max-h-[60vh] overflow-y-auto pointer-events-auto">
                                {Array.from({ length: 24 }).map((_, i) => (
                                  <Button
                                    key={i}
                                    variant="ghost"
                                    type="button"
                                    className={cn(
                                      "h-12 rounded-xl font-medium transition-all hover:bg-slate-100",
                                      field.value === i && "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100"
                                    )}
                                    onClick={() => {
                                      field.onChange(i);
                                      setIsHourOpen(false);
                                    }}
                                  >
                                    {i.toString().padStart(2, "0")}:00
                                  </Button>
                                ))}
                              </div>
                            </ResponsiveDialog>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </Form>
      </ResponsiveDialog>

      <ConfirmDialog
        open={isConfirming}
        onOpenChange={setIsConfirming}
        title={t("common.confirm")}
        description={t("common.are_you_sure")}
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        onConfirm={async () => {
          if (pendingValues) {
            await executeSubmit(pendingValues);
            setIsConfirming(false);
            setPendingValues(null);
          }
        }}
      />
    </>
  );
}

export default AddRuleDialog;
