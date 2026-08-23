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
import { PropertyCombobox } from "@/components/PropertyCombobox";
import { DealCombobox } from "@/features/deals/components/DealCombobox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Handshake } from "lucide-react";
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
import Image from "next/image";

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
  const { t, language: uiLang } = useLanguage();
  const isEn = uiLang === "en";
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isHourOpen, setIsHourOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [pendingValues, setPendingValues] =
    useState<RentNotificationRuleInput | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<"property" | "deal">("property");
  const steps = [
    { 
      title: targetType === "deal" ? (isEn ? "Select Deal" : "เลือกดีล") : (isEn ? "Select Property" : "เลือกทรัพย์"), 
      desc: targetType === "deal" ? "Deal" : "Property" 
    },
    { 
      title: isEn ? "LINE Group Settings" : "ตั้งค่ากลุ่ม LINE", 
      desc: "Communication" 
    },
    { 
      title: isEn ? "Schedule" : "กำหนดเวลา", 
      desc: "Schedule" 
    },
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
      setTargetType("property");
      setSelectedDealId(null);
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
      language: (existingRule?.language as "th" | "en" | "cn" | "ru") || "th",
      tenant_id: existingRule?.tenant_id || tenantId || null,
      custom_group_name: existingRule?.custom_group_name || "",
    },
  });

  useEffect(() => {
    if (existingRule) {
      form.reset({
        property_id: existingRule.property_id,
        line_group_id: existingRule.line_group_id,
        notification_day: existingRule.notification_day,
        notification_hour: existingRule.notification_hour,
        is_active: existingRule.is_active,
        language: existingRule.language,
        tenant_id: existingRule.tenant_id,
        custom_group_name: existingRule.custom_group_name || "",
      });
    }
  }, [existingRule, form]);

  const onSubmit = (values: RentNotificationRuleInput) => {
    setPendingValues(values);
    setIsConfirming(true);
  };

  const executeSubmit = async (values: RentNotificationRuleInput) => {
    try {
      if (isEdit) {
        await updateRentNotificationRule(existingRule.id, values);
        toast.success(isEn ? "Updated notification rule successfully" : "อัปเดตการแจ้งเตือนสำเร็จ");
      } else {
        await createRentNotificationRule(values);
        toast.success(isEn ? "Created notification rule successfully" : "สร้างการแจ้งเตือนสำเร็จ");
      }
      updateOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || (isEn ? "Failed to save notification rule" : "เกิดข้อผิดพลาดในการบันทึก"));
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
            <Button className="gap-2 bg-white text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-all shadow-md rounded-xl h-11 font-bold cursor-pointer">
              <Plus className="w-4 h-4" />
              {isEn ? "Create Notification" : "สร้างการแจ้งเตือน"}
            </Button>
          ) : undefined
        }
        title={
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Bell className="w-5 h-5" />
            </div>
            <span>{isEdit ? (isEn ? "Edit Notification Rule" : "แก้ไขการแจ้งเตือน") : (isEn ? "Create New Notification" : "สร้างการแจ้งเตือนใหม่")}</span>
          </div>
        }
        description={isEn ? "Specify property and LINE group to receive automated rent reminders." : "ระบุทรัพย์และกลุ่มไลน์ที่ต้องการให้แจ้งเตือนค่าเช่า"}
        footer={
          <div className="flex flex-row gap-3 w-full">
            {currentStep > 1 ? (
              <Button
                variant="outline"
                type="button"
                onClick={() => setCurrentStep(s => s - 1)}
                className="flex-1 rounded-xl h-12 font-bold border-slate-200 text-slate-500 gap-2 cursor-pointer"
              >
                {isEn ? "Back" : "ย้อนกลับ"}
              </Button>
            ) : (
              <Button
                variant="outline"
                type="button"
                onClick={() => updateOpen(false)}
                className="flex-1 rounded-xl h-12 font-bold border-slate-200 text-slate-500 cursor-pointer"
              >
                {isEn ? "Cancel" : "ยกเลิก"}
              </Button>
            )}

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={() => {
                  if (currentStep === 1 && !form.getValues("property_id")) {
                    toast.error(
                      targetType === "deal" 
                        ? (isEn ? "Please select a deal before proceeding" : "กรุณาเลือกดีลก่อนไปขั้นตอนถัดไป")
                        : (isEn ? "Please select a property before proceeding" : "กรุณาเลือกทรัพย์ก่อนไปขั้นตอนถัดไป")
                    );
                    return;
                  }
                  if (currentStep === 2 && !form.getValues("line_group_id")) {
                    toast.error(isEn ? "Please select a LINE group before proceeding" : "กรุณาเลือกกลุ่มไลน์ก่อนไปขั้นตอนถัดไป");
                    return;
                  }
                  setCurrentStep(s => s + 1);
                }}
                className="flex-2 bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-500/10 gap-2 cursor-pointer"
              >
                {isEn ? "Next" : "ถัดไป"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer"
              >
                {isEdit ? (isEn ? "Save Changes" : "บันทึกการเปลี่ยนแปลง") : (isEn ? "Create Notification" : "สร้างการแจ้งเตือน")}
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
                    <div className="text-center">
                      <p className={cn("text-xs font-bold leading-none", currentStep >= s ? "text-slate-800" : "text-slate-400")}>
                        {step.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                  {s < 3 && (
                    <div 
                      className={cn(
                        "h-0.5 flex-1 mx-4 mb-6 transition-all",
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
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-6"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
                e.preventDefault();
              }
            }}
          >
            <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4 no-scrollbar">
              <div className="space-y-6 pb-4">
                {/* Step 1: Target Select (Property / Deal) */}
                {currentStep === 1 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                    <div className="flex flex-col gap-2">
                      <FormLabel className="text-sm font-bold text-slate-700 ml-1">
                        {isEn ? "Select target type for notification" : "เลือกประเภทข้อมูลที่ต้องการสร้างการแจ้งเตือน"}
                      </FormLabel>
                      <Tabs
                        value={targetType}
                        onValueChange={(val) => {
                          setTargetType(val as "property" | "deal");
                          form.setValue("property_id", "");
                        }}
                        className="w-full"
                      >
                        <TabsList className="grid grid-cols-2 w-full h-11 bg-slate-100 p-1 rounded-xl">
                          <TabsTrigger
                            value="property"
                            className="rounded-lg font-bold gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm cursor-pointer"
                          >
                            <Building2 className="w-4 h-4" />
                            {isEn ? "From Property" : "เลือกจากทรัพย์"}
                          </TabsTrigger>
                          <TabsTrigger
                            value="deal"
                            className="rounded-lg font-bold gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm cursor-pointer"
                          >
                            <Handshake className="w-4 h-4" />
                            {isEn ? "From Deal" : "เลือกจากดีล"}
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    <FormField
                      control={form.control as any}
                      name="property_id"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-bold text-slate-700 ml-1">
                            {targetType === "deal" ? (isEn ? "Select Deal" : "เลือกดีล (Deal)") : (isEn ? "Select Property" : "เลือกทรัพย์ (Property)")}
                          </FormLabel>
                          <FormControl>
                            {targetType === "property" ? (
                              <PropertyCombobox
                                value={field.value}
                                onChangeAction={(id) => {
                                  field.onChange(id);
                                }}
                                placeholder={isEn ? "Search and select property..." : "ค้นหาและเลือกทรัพย์..."}
                                className="w-full"
                                initialProperty={existingRule?.properties ? {
                                  id: existingRule.properties.id,
                                  title: existingRule.properties.title,
                                  cover_image_url: (existingRule.properties as any).cover_image,
                                } : null}
                              />
                            ) : (
                              <DealCombobox
                                value={selectedDealId}
                                onChange={(dealId, picked) => {
                                  setSelectedDealId(dealId);
                                  if (picked) {
                                    if (picked.property_id) {
                                      field.onChange(picked.property_id);
                                    }
                                    if (picked.tenant_id) {
                                      form.setValue("tenant_id", picked.tenant_id);
                                    }
                                  } else {
                                    field.onChange("");
                                  }
                                }}
                                placeholder={isEn ? "Search and select deal..." : "ค้นหาและเลือกดีล..."}
                              />
                            )}
                          </FormControl>
                          <FormDescription className="text-[11px] text-rose-500 font-medium ml-1">
                            {targetType === "property" 
                              ? (isEn ? "* Shows only properties with active rental contracts" : "* แสดงเฉพาะทรัพย์ที่มีสัญญาเช่า (Active Contract) เท่านั้น")
                              : (isEn ? "* Shows all deals in system" : "* แสดงเฉพาะดีลในระบบ")
                            }
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
                              <FormLabel className="text-sm font-bold text-slate-700 ml-1">
                                {isEn ? "LINE Group" : "กลุ่มไลน์ (LINE Group)"}
                              </FormLabel>
                              <ResponsiveDialog
                                open={isGroupOpen}
                                onOpenChange={setIsGroupOpen}
                                title={isEn ? "Select LINE Group" : "เลือกกลุ่มไลน์"}
                                className="lg:max-w-[400px]!"
                                description={isEn ? "Select group to receive reminders (invite bot first)" : "เลือกกลุ่มที่ต้องการให้ระบบแจ้งเตือนค่าเช่า (ต้องเชิญบอทเข้ากลุ่มก่อน)"}
                                trigger={
                                  <Button
                                    variant="outline"
                                    type="button"
                                    className="w-full h-11 justify-between px-4 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:text-blue-500 transition-colors font-medium cursor-pointer"
                                  >
                                    {selectedGroup ? (
                                      <div className="flex items-center gap-2 ">
                                        {selectedGroup.picture_url && (
                                          <Image
                                            src={selectedGroup.picture_url}
                                            className="w-5 h-5 rounded-full"
                                            alt={selectedGroup.group_name || "LINE group"}
                                            width={20}
                                            height={20}
                                            unoptimized
                                          />
                                        )}
                                        <span className="text-slate-900">{selectedGroup.group_name}</span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400">{isEn ? "Select LINE group..." : "เลือกกลุ่มไลน์..."}</span>
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
                                        {isEn ? "No LINE groups connected yet." : "ยังไม่มีกลุ่มไลน์ในระบบ"} <br />
                                        {isEn ? "Invite bot to group to get started." : "เชิญบอทเข้ากลุ่มเพื่อเริ่มต้นใช้งานครับ"}
                                      </p>
                                    </div>
                                  ) : (
                                    groups.map((group) => (
                                      <Button
                                        key={group.group_id}
                                        variant="ghost"
                                        type="button"
                                        className={cn(
                                          "w-full h-14 justify-start gap-3 px-4 rounded-xl text-left hover:bg-slate-100 transition-all cursor-pointer",
                                          field.value === group.group_id && "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                        )}
                                        onClick={() => {
                                          field.onChange(group.group_id);
                                          setIsGroupOpen(false);
                                        }}
                                      >
                                        {group.picture_url ? (
                                          <Image
                                            src={group.picture_url}
                                            className="w-8 h-8 rounded-full border border-slate-100"
                                            alt={group.group_name || "LINE group"}
                                            width={32}
                                            height={32}
                                            unoptimized
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

                              {/* 📝 Custom Group Name Input */}
                              {field.value && (
                                <div className="mt-3.5 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                                  <FormLabel className="text-xs font-bold text-slate-500 ml-1">
                                    {isEn 
                                      ? `Rename this group (custom alias from ${selectedGroup?.group_name})`
                                      : `ตั้งชื่อกลุ่มไลน์นี้ใหม่ (เปลี่ยนจาก ${selectedGroup?.group_name})`}
                                  </FormLabel>
                                  <Input
                                    placeholder={isEn ? "e.g. Condo 202 Group, Boss Group..." : "เช่น กลุ่มคอนโด 202, กลุ่มเจ้านาย ฯลฯ"}
                                    {...form.register("custom_group_name")}
                                    className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
                                  />
                                </div>
                              )}
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
                              <Languages className="w-3.5 h-3.5" /> {isEn ? "Alert Language" : "ภาษาที่แจ้งเตือน"}
                            </FormLabel>
                            <ResponsiveDialog
                              open={isLanguageOpen}
                              onOpenChange={setIsLanguageOpen}
                              title={isEn ? "Select Language" : "เลือกภาษา"}
                              className="lg:max-w-[300px]!"
                              description={isEn ? "Choose language for automated notification messages" : "เลือกภาษาที่ต้องการใช้ในการส่งข้อความแจ้งเตือน"}
                              trigger={
                                <Button
                                  variant="outline"
                                  type="button"
                                  className="w-full h-11 justify-between hover:text-blue-500 px-4 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 transition-colors font-medium cursor-pointer"
                                >
                                  <span className="flex items-center gap-2">
                                    {field.value === "th" && (isEn ? "🇹🇭 Thai" : "🇹🇭 ไทย")}
                                    {field.value === "en" && (isEn ? "🇬🇧 English" : "🇬🇧 อังกฤษ (English)")}
                                    {field.value === "cn" && (isEn ? "🇨🇳 Chinese" : "🇨🇳 จีน (Chinese)")}
                                    {field.value === "ru" && (isEn ? "🇷🇺 Russian" : "🇷🇺 รัสเซีย (Russian)")}
                                  </span>
                                  <ChevronsUpDown className="w-4 h-4 text-slate-400" />
                                </Button>
                              }
                            >
                              <div className="grid gap-2 p-4 pointer-events-auto ">
                                {[
                                  { value: "th", label: isEn ? "Thai" : "ไทย", flag: "🇹🇭" },
                                  { value: "en", label: isEn ? "English" : "อังกฤษ (English)", flag: "🇬🇧" },
                                  { value: "cn", label: isEn ? "Chinese" : "จีน (Chinese)", flag: "🇨🇳" },
                                  { value: "ru", label: isEn ? "Russian" : "รัสเซีย (Russian)", flag: "🇷🇺" },
                                ].map((lang) => (
                                  <Button
                                    key={lang.value}
                                    variant="ghost"
                                    type="button"
                                    className={cn(
                                      "w-full h-12 justify-start gap-3 px-4 rounded-xl text-left hover:bg-slate-100 transition-all cursor-pointer",
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
                              {isEn ? "Notification Day (1-31)" : "วันที่แจ้งเตือน (1-31)"}
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
                                  {isEn ? "Every Month" : "ทุกเดือน"}
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
                              <Clock className="w-3.5 h-3.5" /> {isEn ? "Notification Hour" : "เวลาส่งแจ้งเตือน"}
                            </FormLabel>
                            <ResponsiveDialog
                              open={isHourOpen}
                              onOpenChange={setIsHourOpen}
                              title={isEn ? "Select Time" : "เลือกเวลาส่ง"}
                              description={isEn ? "Select time for automated rent notification delivery" : "เลือกเวลาที่ต้องการให้ระบบส่งข้อความแจ้งเตือนอัตโนมัติ"}
                              trigger={
                                <Button
                                  variant="outline"
                                  type="button"
                                  className="w-full h-11 justify-between px-4 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 transition-colors font-medium cursor-pointer"
                                >
                                  <span className="flex items-center gap-2 text-slate-900">
                                    {field.value !== undefined ? `${field.value.toString().padStart(2, "0")}:00` : (isEn ? "Select time" : "เลือกเวลา")}
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
