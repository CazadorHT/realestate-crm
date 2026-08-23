"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CoBrokerFormValues, CoBrokerSchema } from "../schema";
import { 
  ResponsiveDialog
} from "@/components/ui/responsive-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createCoBrokerAction } from "../actions";
import { toast } from "sonner";
import { useState } from "react";
import { 
  Loader2, 
  Info, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Star,
  User,
  MapPin,
  CreditCard,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CoBroker } from "../schema";
import { 
  PROPERTY_TYPE_CONFIG, 
  PROPERTY_TYPE_ORDER, 
  PROPERTY_TYPE_ICONS 
} from "../../properties/labels";
import { useEffect } from "react";
import { getBanksAction } from "../../finance/bank-actions";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface CreateCoBrokerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newItem: CoBroker) => void;
  initialData?: CoBroker | null;
  mode?: "create" | "edit";
}

export function CreateCoBrokerDialog({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialData,
  mode = "create"
}: CreateCoBrokerDialogProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const totalSteps = 3;

  const form = useForm<CoBrokerFormValues>({
    resolver: zodResolver(CoBrokerSchema) as any,
    defaultValues: {
      name: "",
      company_name: "",
      phone: "",
      email: "",
      line_id: "",
      whatsapp: "",
      rating: 3,
      specialized_areas: [],
      property_types: [],
      tax_id: "",
      tax_address: "",
      bank_code: "",
      bank_account_no: "",
      bank_account_name: "",
      internal_notes: "",
      is_active: true,
    },
  });

  const [banks, setBanks] = useState<any[]>([]);

  useEffect(() => {
    async function fetchBanks() {
      const res = await getBanksAction();
      if (res.success) setBanks(res.data || []);
    }
    fetchBanks();
  }, []);

  // Update form when initialData changes (for Edit mode)
  useEffect(() => {
    if (initialData && mode === "edit") {
      form.reset({
        id: initialData.id,
        name: initialData.name || "",
        company_name: initialData.company_name || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        line_id: initialData.line_id || "",
        whatsapp: initialData.whatsapp || "",
        rating: initialData.rating || 3,
        specialized_areas: initialData.specialized_areas || [],
        property_types: initialData.property_types || [],
        tax_id: initialData.tax_id || "",
        tax_address: initialData.tax_address || "",
        bank_code: initialData.bank_code || "",
        bank_account_no: initialData.bank_account_no || "",
        bank_account_name: initialData.bank_account_name || "",
        internal_notes: initialData.internal_notes || "",
        is_active: initialData.is_active ?? true,
        broker_group: initialData.broker_group || "GENERAL",
        tenant_id: initialData.tenant_id,
      });
    } else if (mode === "create") {
      form.reset({
        name: "",
        company_name: "",
        phone: "",
        email: "",
        line_id: "",
        whatsapp: "",
        rating: 3,
        specialized_areas: [],
        property_types: [],
        tax_id: "",
        tax_address: "",
        bank_code: "",
        bank_account_no: "",
        bank_account_name: "",
        internal_notes: "",
        is_active: true,
        broker_group: "GENERAL",
      });
    }
  }, [initialData, mode, form]);

  async function handleNext() {
    // Validate current step fields
    const fieldsToValidate = currentStep === 1 
      ? (["name", "phone", "rating"] as any)
      : currentStep === 2
      ? (["specialized_areas", "property_types"] as any)
      : [];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(s => Math.min(s + 1, totalSteps));
    }
  }

  const handlePrev = () => setCurrentStep(s => Math.max(s - 1, 1));

  async function onSubmit(values: CoBrokerFormValues) {
    setIsSubmitting(true);
    try {
      const { updateCoBrokerAction } = await import("../actions");
      
      const result = mode === "create"
        ? await createCoBrokerAction(values)
        : await updateCoBrokerAction(initialData!.id, values);

      if (result.success && result.data) {
        toast.success(
          mode === "create" 
            ? (isEn ? "Partner added successfully" : "เพิ่มรายชื่อคู่ค้าเรียบร้อยแล้ว")
            : (isEn ? "Partner updated successfully" : "อัปเดตข้อมูลคู่ค้าเรียบร้อยแล้ว")
        );
        onSuccess(result.data as CoBroker);
        if (mode === "create") {
          form.reset();
          setCurrentStep(1);
        }
      } else {
        toast.error((result as any).error || (isEn ? "Failed to save partner" : "เกิดข้อผิดพลาดในการบันทึก"));
      }
    } catch (error) {
      toast.error(isEn ? "Connection error occurred" : "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Helper for Rating Selection
  const RatingSelector = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
    const ratings = [
      { v: 5, label: isEn ? "5 Stars (Excellent / Frequent Closer)" : "5 ดาว (ดีเยี่ยม/ปิดดีลบ่อย)", color: "text-amber-500", bg: "bg-amber-50" },
      { v: 4, label: isEn ? "4 Stars (Great / Responsive)" : "4 ดาว (ดีมาก/คุยง่าย)", color: "text-amber-400", bg: "bg-amber-50/50" },
      { v: 3, label: isEn ? "3 Stars (Standard)" : "3 ดาว (มาตรฐาน)", color: "text-slate-400", bg: "bg-slate-50" },
      { v: 2, label: isEn ? "2 Stars (Caution / Slow Delivery)" : "2 ดาว (ต้องระวัง/ส่งงานช้า)", color: "text-blue-400", bg: "bg-blue-50/30" },
      { v: 1, label: isEn ? "1 Star (Blacklist / Not Recommended)" : "1 ดาว (Blacklist/ไม่แนะนำ)", color: "text-red-400", bg: "bg-red-50/50" },
    ];

    return (
      <div className="space-y-3 ">
        {ratings.map((r) => (
          <button
            key={r.v}
            type="button"
            onClick={() => onChange(r.v)}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2 cursor-pointer",
              value === r.v 
                ? "border-amber-500 bg-amber-50/50 ring-4 ring-amber-500/10" 
                : "border-slate-50 hover:border-slate-100 bg-white"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", r.bg)}>
                <Star className={cn("h-5 w-5 fill-current", r.color)} />
              </div>
              <span className={cn("text-sm font-bold", value === r.v ? "text-amber-900" : "text-slate-600")}>
                {r.label}
              </span>
            </div>
            {value === r.v && (
              <div className="h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    );
  };

  const getStepTitle = () => {
    if (mode === "create") {
      if (currentStep === 1) return isEn ? "New Partner: Identity Info" : "เพิ่มคู่ค้าใหม่: ข้อมูลตัวตน";
      if (currentStep === 2) return isEn ? "New Partner: Expertise" : "เพิ่มคู่ค้าใหม่: ความถนัด";
      return isEn ? "New Partner: Financial Info" : "เพิ่มคู่ค้าใหม่: การเงิน";
    } else {
      if (currentStep === 1) return isEn ? "Edit Partner: Identity Info" : "แก้ไขคู่ค้า: ข้อมูลตัวตน";
      if (currentStep === 2) return isEn ? "Edit Partner: Expertise" : "แก้ไขคู่ค้า: ความถนัด";
      return isEn ? "Edit Partner: Financial Info" : "แก้ไขคู่ค้า: การเงิน";
    }
  };

  return (
    <ResponsiveDialog 
      open={isOpen} 
      onOpenChange={(v) => {
        if (!v) {
          setCurrentStep(1);
          onClose();
        }
      }}
      title={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
            {currentStep === 1 ? <User className="h-5 w-5" /> : currentStep === 2 ? <MapPin className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
          </div>
          <div className="text-left">
             <div className="text-lg font-bold text-slate-900">
                {getStepTitle()}
             </div>
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{isEn ? `Step ${currentStep} of ${totalSteps}` : `ขั้นตอนที่ ${currentStep} จาก ${totalSteps}`}</p>
          </div>
        </div>
      }
      isLoading={isSubmitting}
      className="max-w-2xl"
      footer={
        <div className="flex w-full items-center justify-between gap-4 px-6 pb-6 pt-2">
          {/* Progress Indicator */}
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  currentStep === s ? "w-8 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]" : s < currentStep ? "w-4 bg-emerald-500" : "w-1.5 bg-slate-200"
                )}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button 
                key={`back-btn-${currentStep}`}
                type="button" 
                variant="ghost" 
                onClick={handlePrev} 
                disabled={isSubmitting}
                className="h-12 px-6 rounded-xl font-bold text-slate-500 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> {isEn ? "Back" : "ย้อนกลับ"}
              </Button>
            )}
            
            {currentStep < totalSteps ? (
              <Button 
                key={`next-btn-${currentStep}`}
                type="button" 
                onClick={handleNext}
                className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
              >
                {isEn ? "Continue" : "ดำเนินการต่อ"} <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button 
                key="submit-btn-final"
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="h-12 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-100 cursor-pointer" 
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEn ? "Saving..." : "กำลังบันทึก..."}
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {mode === "create" ? (isEn ? "Confirm Add Partner" : "ยืนยันการเพิ่มคู่ค้า") : (isEn ? "Save Changes" : "บันทึกการแก้ไข")}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <Form {...form}>
        <form 
          id="create-co-broker-form"
          onSubmit={form.handleSubmit(onSubmit)} 
          onKeyDown={(e) => {
            // Prevent Enter from submitting the form accidentally, 
            // but allow it in Textarea for newline
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
              e.preventDefault();
            }
          }}
          className="space-y-6 px-1 pb-4 min-h-[400px]"
        >
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? "Full Name / Nickname" : "ชื่อ-นามสกุล / ชื่อเล่น"} <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder={isEn ? "e.g. John Doe (Johnny)" : "เช่น นายสมชาย (เก่ง)"} {...field} className="h-12 rounded-xl bg-slate-50/50 border-slate-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? "Company / Agency" : "ชื่อบริษัท / สังกัด"}</FormLabel>
                        <FormControl>
                          <Input placeholder={isEn ? "e.g. ABC Realty" : "เช่น ABC Realty"} {...field} value={field.value || ""} className="h-12 rounded-xl bg-slate-50/50 border-slate-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? "Phone Number" : "เบอร์โทรศัพท์"} <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="08x-xxxxxxx" type="number" {...field} className="h-12 rounded-xl bg-slate-50/50 border-slate-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? "Email" : "อีเมล"}</FormLabel>
                        <FormControl>
                          <Input placeholder="email@example.com" {...field} value={field.value || ""} className="h-12 rounded-xl bg-slate-50/50 border-slate-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="line_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? "Line ID / WhatsApp" : "Line ID / WhatsApp"}</FormLabel>
                        <FormControl>
                          <Input placeholder="line_id" {...field} value={field.value || ""} className="h-12 rounded-xl bg-slate-50/50 border-slate-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? "Partner Rating" : "เรตติ้งพาร์ทเนอร์"}</FormLabel>
                        <ResponsiveDialog 
                          open={isRatingOpen}
                          onOpenChange={setIsRatingOpen}
                          className="max-w-md!"
                          title={isEn ? "Select Partner Rating" : "เลือกเรตติ้งของคู่ค้า"}
                          description={isEn ? "Assess initial collaboration capability" : "ประเมินศักยภาพการร่วมงานเบื้องต้น"}
                          trigger={
                            <Button type="button" variant="outline" className="w-full h-12 rounded-xl justify-between px-3 border-slate-200 bg-slate-50/30 cursor-pointer" onClick={() => setIsRatingOpen(true)}>
                              <div className="flex items-center gap-2">
                                <Star className={cn("h-4 w-4 fill-amber-500 text-amber-500")} />
                                <span className="font-bold">{field.value} {isEn ? "Stars" : "ดาว"}</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            </Button>
                          }
                        >
                          <div className="p-6">
                             <RatingSelector value={field.value} onChange={(v) => {
                               field.onChange(v);
                               setIsRatingOpen(false);
                             }} />
                          </div>
                        </ResponsiveDialog>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="bg-blue-50/50 p-6 rounded-4xl border border-blue-100 flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Info className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-900">{isEn ? "Specify Area & Property Expertise" : "ระบุพื้นที่และความเชี่ยวชาญ"}</h4>
                    <p className="text-xs text-blue-700/70 font-medium leading-relaxed mt-1">
                       {isEn 
                         ? "This info is used for 'Smart Match' to automatically recommend partners matching your active listings." 
                         : "ข้อมูลส่วนนี้จะใช้ในการ \"Smart Match\" เพื่อแนะนำพาร์ทเนอร์ที่ตรงกับทรัพย์ที่เรามีโดยอัตโนมัติ"}
                    </p>
                  </div>
               </div>

               <FormField
                  control={form.control}
                  name="specialized_areas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? "Specialized Areas (comma-separated)" : "โซนพื้นที่ที่ถนัด (คั่นด้วยจุลภาค ,)"}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={isEn ? "e.g. Sukhumvit, Thonglor, Ari" : "เช่น สุขุมวิท, ทองหล่อ, อารีย์"} 
                          className="h-14 rounded-2xl bg-slate-50/50 border-slate-200 font-medium"
                          onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="property_types"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? "Specialized Property Types (Select multiple)" : "ประเภททรัพย์ที่คู่ค้าถนัด (เลือกได้มากกว่า 1)"}</FormLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3">
                         {PROPERTY_TYPE_ORDER.map((type) => {
                           const Icon = PROPERTY_TYPE_ICONS[type];
                           const isSelected = field.value.includes(type);
                           
                           return (
                             <button
                               key={type}
                               type="button"
                               onClick={() => {
                                 const current = [...field.value];
                                 if (current.includes(type)) {
                                   field.onChange(current.filter(v => v !== type));
                                 } else {
                                   field.onChange([...current, type]);
                                 }
                               }}
                               className={cn(
                                 "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 gap-2 group relative overflow-hidden cursor-pointer",
                                 isSelected 
                                   ? "bg-indigo-50 border-indigo-500 ring-4 ring-indigo-500/10" 
                                   : "bg-white border-slate-100 hover:border-slate-200 text-slate-400"
                               )}
                             >
                                <div className={cn(
                                  "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                  isSelected ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200" : "bg-slate-50 group-hover:bg-slate-100"
                                )}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                <span className={cn("text-[11px] font-bold text-center leading-tight", isSelected ? "text-indigo-700" : "text-slate-500")}>
                                  {PROPERTY_TYPE_CONFIG[type].label[isEn ? "en" : "th"]}
                                </span>
                                
                                {isSelected && (
                                  <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-indigo-500 flex items-center justify-center">
                                    <Check className="h-2 w-2 text-white" />
                                  </div>
                                )}
                             </button>
                           );
                         })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-6">
                  <FormField
                    control={form.control}
                    name="tax_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? "Tax ID" : "เลขผู้เสียภาษี"}</FormLabel>
                        <FormControl>
                          <Input placeholder="1234567890123" {...field} value={field.value || ""} className="h-12 rounded-xl bg-slate-50/50 border-slate-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tax_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? "Tax Registration Address" : "ที่อยู่ตามทะเบียนภาษี"}</FormLabel>
                        <FormControl>
                          <Input placeholder={isEn ? "Address for tax certificates" : "ที่อยู่สำหรับออกใบ 50 ทวิ"} {...field} value={field.value || ""} className="h-12 rounded-xl bg-slate-50/50 border-slate-200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bank_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? "Bank" : "ธนาคาร"} <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl bg-slate-50/50 border-slate-200 font-medium cursor-pointer">
                              <SelectValue placeholder={isEn ? "Select bank..." : "เลือกธนาคาร..."} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                            {banks.map((bank) => (
                              <SelectItem key={bank.code} value={bank.code} className="py-3 rounded-xl font-medium cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">{isEn ? (bank.name_en || bank.name_th) : bank.name_th}</span>
                                  <span className="text-[10px] text-slate-400 uppercase">{bank.code}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bank_account_no"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? "Account Number (Digits only)" : "เลขที่บัญชี (เฉพาะตัวเลข)"}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="1234567890" 
                            {...field} 
                            value={field.value || ""} 
                            className="h-12 rounded-xl bg-slate-50/50 border-slate-200 font-mono font-bold tracking-wider" 
                            onChange={(e) => {
                               // Force numeric only at UI level too
                               const val = e.target.value.replace(/[^0-9]/g, '');
                               field.onChange(val);
                            }}
                          />
                        </FormControl>
                        <FormDescription className="text-[10px] ml-1">{isEn ? "Enter 10-12 numeric digits without dashes or spaces" : "ระบุเฉพาะตัวเลข 10-12 หลัก โดยไม่ต้องใส่ขีดหรือช่องว่าง"}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bank_account_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? "Account Name" : "ชื่อบัญชี"}</FormLabel>
                      <FormControl>
                        <Input placeholder={isEn ? "Enter account name..." : "ระบุชื่อบัญชี..."} {...field} value={field.value || ""} className="h-12 rounded-xl bg-slate-50/50 border-slate-200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="internal_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? "Internal Notes for Team (Private)" : "บันทึกภายในสำหรับทีมงาน (Private)"}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={isEn ? "Specify special agreements or collaboration guidelines..." : "ระบุข้อตกลงพิเศษ หรือข้อควรระวังในการร่วมงาน..."} 
                          className="min-h-[120px] rounded-3xl bg-slate-50/30 border-slate-100 font-medium p-4 py-3"
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
          )}
        </form>
      </Form>
    </ResponsiveDialog>
  );
}

