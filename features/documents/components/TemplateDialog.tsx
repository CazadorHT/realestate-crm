"use client";

import { useState, useEffect, useRef } from "react";
import { getTemplatesAction } from "../template-actions";
import {
  generateDocumentFromTemplateAction,
  generateDocxDocumentFromTemplateAction,
} from "../generation-actions";
import { createDocumentRecordAction, searchOwnerAction } from "../actions";
import { DOC_TYPE_LABELS, DocumentOwnerType } from "../schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Loader2,
  Wand2,
  Search,
  Image as ImageIcon,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface TemplateDialogProps {
  ownerId?: string;
  ownerType?: "LEAD" | "PROPERTY" | "DEAL" | "RENTAL_CONTRACT";
  onGenerateComplete?: () => void;
  trigger?: React.ReactNode;
}

export function TemplateDialog({
  ownerId: initialOwnerId,
  ownerType: initialOwnerType,
  trigger,
  onGenerateComplete,
}: TemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [language, setLanguage] = useState<string>("th");
  const [templateSource, setTemplateSource] = useState<"standard" | "custom">(
    "standard",
  );
  const [customFile, setCustomFile] = useState<File | null>(null);

  // Owner Selection State (for global context)
  const [targetOwnerType, setTargetOwnerType] = useState<DocumentOwnerType>(
    initialOwnerType || "DEAL",
  );
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerResults, setOwnerResults] = useState<
    { id: string; label: string }[]
  >([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState(initialOwnerId || "");
  const [isSearching, setIsSearching] = useState(false);

  // Slip & Bank State
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");

  // New manual override fields
  const [paymentPeriod, setPaymentPeriod] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Transfer");
  const [accountName, setAccountName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientLine, setClientLine] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const router = useRouter();
  const supabase = createClient();
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const resetForm = () => {
    setOwnerSearch("");
    setOwnerResults([]);
    setSelectedOwnerId(initialOwnerId || "");
    setSlipFile(null);
    setSlipPreview(null);
    setBankName("");
    setBankAccountNo("");
    setPaymentPeriod("");
    setPaymentMethod("Transfer");
    setAccountName("");
    setClientName("");
    setClientEmail("");
    setClientLine("");
    setTargetOwnerType(initialOwnerType || "DEAL");
    setCustomFile(null);
    setCurrentStep(initialOwnerId ? 2 : 1);
    setTemplateDialogOpen(false);
    setPaymentMethodDialogOpen(false);
  };

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false);

  useEffect(() => {
    if (open) {
      resetForm();
      loadTemplates();
    }
  }, [open, initialOwnerId, initialOwnerType]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchOwnerAction(targetOwnerType, ownerSearch);
        setOwnerResults(results);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, ownerSearch.trim() === "" ? 0 : 500); // Immediate if empty, debounced if typing

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [ownerSearch, targetOwnerType]);

  // Sync lead/owner details when selected
  useEffect(() => {
    const fetchDetails = async () => {
      const finalId = selectedOwnerId || initialOwnerId;
      if (!finalId) return;

      try {
        if (targetOwnerType === "LEAD" || initialOwnerType === "LEAD") {
          const { data } = await supabase
            .from("leads")
            .select("id, full_name, email, line_id")
            .eq("id", finalId)
            .single();
          if (data) {
            setClientName(data.full_name || "");
            setClientEmail(data.email || "");
            setClientLine(data.line_id || "");
          }
        } else if (targetOwnerType === "DEAL" || initialOwnerType === "DEAL") {
          const { data } = await supabase
            .from("deals")
            .select("id, leads(id, full_name, email, line_id)")
            .eq("id", finalId)
            .single();
          if (data && data.leads) {
            setClientName(data.leads.full_name || "");
            setClientEmail(data.leads.email || "");
            setClientLine(data.leads.line_id || "");
          }
        }
      } catch (err) {
        console.error("Fetch lead error:", err);
      }
    };
    fetchDetails();
  }, [selectedOwnerId, initialOwnerId, targetOwnerType, initialOwnerType]);

  async function loadTemplates() {
    try {
      const data = await getTemplatesAction();
      setTemplates(data || []);
      if (data && data.length > 0) {
        setSelectedTemplateId(data[0].id);
      }
    } catch (err) {
      toast.error("โหลดต้นแบบสัญญาไม่สำเร็จ");
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
        return;
      }
      setSlipFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleGenerate() {
    const finalOwnerId = selectedOwnerId || initialOwnerId;
    const finalOwnerType = initialOwnerId ? initialOwnerType : targetOwnerType;

    if (!finalOwnerId) {
      toast.error("กรุณาเลือกผู้รับเอกสาร (ลูกค้า/ดีล/ทรัพย์สิน)");
      return;
    }

    if (templateSource === "standard" && !selectedTemplateId) {
      toast.error("กรุณาเลือกต้นแบบสัญญา");
      return;
    }
    if (templateSource === "custom") {
      if (!customFile) {
        toast.error("กรุณาอัปโหลดไฟล์ด็อก (DOCX) เป็นต้นแบบ");
        return;
      }

      const fileExt = customFile.name.split(".").pop()?.toLowerCase();
      if (fileExt !== "docx") {
        toast.error("รูปแบบไฟล์ไม่ถูกต้อง รองรับเฉพาะไฟล์ .docx เท่านั้น");
        return;
      }

      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (customFile.size > MAX_FILE_SIZE) {
        toast.error("ขนาดไฟล์ต้องไม่เกิน 5 MB");
        return;
      }
    }

    setLoading(true);
    try {
      let slipUrl = "";

      // Upload Slip if selected
      if (slipFile) {
        const fileExt = slipFile.name.split(".").pop();
        const fileName = `slip_${Date.now()}.${fileExt}`;
        const filePath = `slips/${finalOwnerId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, slipFile);

        if (uploadError) throw new Error("อัปโหลดสลิปไม่สำเร็จ");

        // Record the Slip as a separate document so it can be managed (deleted)
        await createDocumentRecordAction({
          owner_id: finalOwnerId as string,
          owner_type: finalOwnerType as any,
          document_type: "SLIP", // Using the formal SLIP type
          file_name: `Slip_${fileName}`,
          storage_path: filePath,
          mime_type: slipFile.type,
          version: 1,
        });

        slipUrl = filePath;
      }

      let res;
      if (templateSource === "standard") {
        res = await generateDocumentFromTemplateAction(
          selectedTemplateId,
          finalOwnerId as string,
          finalOwnerType as any,
          {
            language: language as "th" | "en" | "cn" | "ru",
            slip_url: slipUrl,
            bank_name: bankName,
            bank_account_no: bankAccountNo,
            payment_period: paymentPeriod,
            payment_method: paymentMethod,
            account_name: accountName,
            client_name_override: clientName,
            client_email_override: clientEmail,
            client_line_override: clientLine,
          },
        );
      } else {
        // Custom Upload DOCX
        const fileExt = customFile!.name.split(".").pop();
        const fileName = `template_${Date.now()}.${fileExt}`;
        const filePath = `temp_templates/${finalOwnerId}/${fileName}`;

        const { error: uploadCustomError } = await supabase.storage
          .from("documents")
          .upload(filePath, customFile!);

        if (uploadCustomError) throw new Error("อัปโหลดไฟล์เทมเพลตไม่สำเร็จ");

        res = await generateDocxDocumentFromTemplateAction(
          finalOwnerId as string,
          finalOwnerType as any,
          filePath,
          {
            language: language as "th" | "en" | "cn" | "ru",
            slip_url: slipUrl,
            bank_name: bankName,
            bank_account_no: bankAccountNo,
            payment_period: paymentPeriod,
            payment_method: paymentMethod,
            account_name: accountName,
            client_name_override: clientName,
            client_email_override: clientEmail,
            client_line_override: clientLine,
          },
          { templateName: customFile!.name.replace(".docx", "") },
        );
      }

      if (res.success) {
        toast.success("สร้างเอกสารสำเร็จแล้ว!");
        setOpen(false);
        if (onGenerateComplete) onGenerateComplete();
        router.refresh();
      } else {
        toast.error(res.message || "สร้างเอกสารไม่สำเร็จ");
      }
    } catch (err: any) {
      console.error("Generate Document UI Error:", err);
      toast.error(err.message || "เกิดข้อผิดพลาดในการสร้างเอกสาร");
    } finally {
      setLoading(false);
    }
  }

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId);
  const showSlipUpload =
    activeTemplate?.type === "RENT_RECEIPT" ||
    activeTemplate?.type === "RESERVATION_DOCUMENT";

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      className="sm:max-w-[800px]"
      trigger={
        trigger || (
          <Button variant="outline" size="lg" className="gap-2 rounded-2xl font-semibold h-12 shadow-sm border-slate-200 hover:text-blue-700 hover:bg-slate-50!">
            <FileText className="h-4.5 w-4.5 text-blue-600" />
            สร้างจาก Template
          </Button>
        )
      }
      title={
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
            <Wand2 className="h-6 w-6" />
          </div>
          <span className="text-xl font-semibold text-slate-900 tracking-tight">สร้างเอกสารอัตโนมัติ</span>
        </div>
      }
      description="เลือกต้นแบบและข้อมูลที่ต้องการ ระบบจะสร้างไฟล์เอกสารให้ทันที"
      footer={
        <div className="flex flex-row gap-3 w-full shrink-0 pt-4 px-6 pb-6 border-t border-slate-50 bg-slate-50/30">
          <Button
            variant="ghost"
            type="button"
            onClick={() => {
              if (currentStep === (initialOwnerId ? 2 : 1)) {
                setOpen(false);
              } else {
                setCurrentStep((prev) => Math.max(prev - 1, 1));
              }
            }}
            className="flex-1 h-12 rounded-xl font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 active:scale-[0.98] transition-all"
          >
            {currentStep === (initialOwnerId ? 2 : 1) ? "ยกเลิก" : "ย้อนกลับ"}
          </Button>

          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={() => {
                if (currentStep === 1 && !selectedOwnerId && !initialOwnerId) {
                   toast.error("กรุณาเลือกผู้รับเอกสารก่อนไปขั้นตอนถัดไป");
                   return;
                }
                if (currentStep === 2 && templateSource === "standard" && !selectedTemplateId) {
                   toast.error("กรุณาเลือกต้นแบบสัญญาก่อนไปขั้นตอนถัดไป");
                   return;
                }
                setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
              }}
              className="flex-2 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xl shadow-blue-100 transition-all active:scale-[0.98]"
            >
              ถัดไป
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="flex-2 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xl shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>กำลังสร้างเอกสาร...</span>
                </div>
              ) : (
                "ยืนยันและสร้างเอกสาร"
              )}
            </Button>
          )}
        </div>
      }
    >
      <div className="py-2 space-y-6">
        {/* Stepper Indicator */}
        <div className="px-6 pb-2">
          <div className="flex items-center justify-between relative">
             <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
             {[1, 2, 3, 4].map((s) => (
                <div 
                  key={s} 
                  className={cn(
                    "relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                    currentStep === s 
                      ? "bg-blue-600 text-white scale-110 shadow-lg shadow-blue-200" 
                      : currentStep > s 
                        ? "bg-emerald-500 text-white" 
                        : "bg-white border-2 border-slate-100 text-slate-400"
                  )}
                >
                  {currentStep > s ? "✓" : s}
                </div>
             ))}
          </div>
          <div className="flex justify-between mt-2">
             <span className={cn("text-[10px] font-semibold uppercase tracking-wider", currentStep >= 1 ? "text-blue-600" : "text-slate-400")}>แหล่งข้อมูล</span>
             <span className={cn("text-[10px] font-semibold uppercase tracking-wider", currentStep >= 2 ? "text-blue-600" : "text-slate-400")}>ต้นแบบ</span>
             <span className={cn("text-[10px] font-semibold uppercase tracking-wider", currentStep >= 3 ? "text-blue-600" : "text-slate-400")}>รายละเอียด</span>
             <span className={cn("text-[10px] font-semibold uppercase tracking-wider", currentStep >= 4 ? "text-blue-600" : "text-slate-400")}>ตรวจสอบ</span>
          </div>
        </div>
        {/* Step 1: Owner Selection */}
        {currentStep === 1 && !initialOwnerId && (
          <div className="space-y-4 p-5 mx-6 rounded-3xl border border-slate-100 bg-slate-50/50 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-1.5 bg-white rounded-lg border border-slate-100 text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <Label className="text-sm font-semibold text-slate-700 uppercase tracking-widest">
                ข้อมูลอ้างอิง (Reference)
              </Label>
            </div>

            <div className="grid grid-cols-3 gap-2 p-1.5 bg-white rounded-2xl border border-slate-100">
              {(["DEAL", "LEAD", "PROPERTY"] as const).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={targetOwnerType === type ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-9 text-xs font-semibold rounded-xl transition-all",
                    targetOwnerType === type ? "bg-slate-900 text-white shadow-md" : "text-slate-400"
                  )}
                  onClick={() => {
                    setTargetOwnerType(type);
                    setOwnerSearch("");
                    setOwnerResults([]);
                    setSelectedOwnerId("");
                  }}
                >
                  {type === "DEAL"
                    ? "ดีล"
                    : type === "LEAD"
                      ? "ลูกค้า"
                      : "ทรัพย์สิน"}
                </Button>
              ))}
            </div>

            <div className="relative">
              <Input
                placeholder={`ค้นหาชื่อ ${targetOwnerType === "DEAL" ? "ลูกค้าหรือทรัพย์สินในดีล" : targetOwnerType === "LEAD" ? "ลูกค้า" : "ทรัพย์สิน"}...`}
                value={ownerSearch}
                onChange={(e) => setOwnerSearch(e.target.value)}
                className="pl-11 h-12 rounded-2xl border-slate-100 bg-white focus:border-blue-500 shadow-xs"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 animate-spin text-blue-500" />
              )}
            </div>

            {ownerResults.length > 0 && !selectedOwnerId && (
              <div className="border border-slate-100 rounded-2xl bg-white max-h-[240px] overflow-y-auto shadow-xl animate-in fade-in slide-in-from-top-2">
                <div className="p-2 border-b border-slate-50 bg-white sticky top-0 z-10">
                   <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-2">
                    {ownerSearch.trim() === "" ? "รายการล่าสุด (Recent Items)" : "ผลการค้นหา (Search Results)"}
                   </p>
                </div>
                {ownerResults.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 hover:bg-blue-50 cursor-pointer text-sm border-b border-slate-50 last:border-0 flex items-center justify-between group"
                    onClick={() => {
                      setSelectedOwnerId(r.id);
                      setOwnerSearch(r.label);
                      setOwnerResults([]);
                    }}
                  >
                    <span className="font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">{r.label}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] font-semibold text-blue-600 bg-blue-50 rounded-lg">เลือก</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedOwnerId && (
              <div className="flex items-center justify-between bg-blue-600 p-3 rounded-2xl border border-blue-700 shadow-lg shadow-blue-100 animate-in zoom-in-95">
                <div className="flex items-center gap-2 min-w-0">
                   <div className="h-6 w-6 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="h-3.5 w-3.5 text-white" />
                   </div>
                   <span className="text-sm font-semibold text-white truncate pr-2">
                    {ownerSearch}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 rounded-lg shrink-0"
                  onClick={() => {
                    setSelectedOwnerId("");
                    setOwnerSearch("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Template Selection */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <Tabs
              value={templateSource}
              onValueChange={(v: any) => setTemplateSource(v)}
              className="w-full px-7"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/50">
                <TabsTrigger value="standard" className="text-xs font-semibold rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                  Standard HTML
                </TabsTrigger>
                <TabsTrigger value="custom" className="text-xs font-semibold rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                  Upload .docx
                </TabsTrigger>
              </TabsList>

              <TabsContent value="standard" className="mt-0 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-widest ml-1">
                      เลือกต้นแบบ
                    </Label>
                    <ResponsiveDialog
                      open={templateDialogOpen}
                      onOpenChange={setTemplateDialogOpen}
                      title="เลือกต้นแบบสัญญา"
                      description="ค้นหาและเลือกต้นแบบที่ต้องการใช้สร้างเอกสาร"
                      trigger={
                        <Button
                          variant="outline"
                          className="w-full h-12 rounded-2xl border-slate-200 bg-white font-semibold flex items-center justify-between px-4 hover:bg-slate-50!"
                          onClick={() => setTemplateDialogOpen(true)}
                        >
                          <span className={selectedTemplateId ? "text-slate-900" : "text-slate-400"}>
                            {templates.find((t) => t.id === selectedTemplateId)?.name || "เลือกต้นแบบ..."}
                          </span>
                          <Loader2 className={cn("h-4 w-4 animate-spin", !loading && "hidden")} />
                          {!loading && <FileText className="h-4 w-4 text-slate-400" />}
                        </Button>
                      }
                    >
                      <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                        {templates.map((t) => (
                          <div
                            key={t.id}
                            className={cn(
                              "p-4 rounded-2xl border transition-all cursor-pointer group flex items-center gap-4",
                              selectedTemplateId === t.id
                                ? "border-blue-600 bg-blue-50/50 shadow-sm"
                                : "border-slate-100 hover:border-blue-200 hover:bg-slate-50"
                            )}
                            onClick={() => {
                              setSelectedTemplateId(t.id);
                              setTemplateDialogOpen(false);
                            }}
                          >
                            <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                              selectedTemplateId === t.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600"
                            )}>
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className={cn("font-semibold text-sm truncate", selectedTemplateId === t.id ? "text-blue-900" : "text-slate-700")}>
                                {t.name}
                               </p>
                               <p className="text-[10px] text-slate-400 font-medium">Type: {t.type || 'General'}</p>
                            </div>
                            {selectedTemplateId === t.id && (
                              <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ResponsiveDialog>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-widest ml-1">
                      ภาษาที่แสดง (Localization)
                    </Label>
                    <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100/50 rounded-2xl border border-slate-200/50">
                      {[
                        { id: "th", label: "ไทย", icon: "🇹🇭" },
                        { id: "en", label: "EN", icon: "🇺🇸" },
                        { id: "cn", label: "中文", icon: "🇨🇳" },
                        { id: "ru", label: "Русский", icon: "🇷🇺" },
                      ].map((lang) => (
                        <Button
                          key={lang.id}
                          variant={language === lang.id ? "default" : "ghost"}
                          size="sm"
                          className={cn(
                            "h-10 rounded-xl text-xs font-semibold transition-all",
                            language === lang.id
                              ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                              : "text-slate-500 hover:bg-white/50"
                          )}
                          onClick={() => setLanguage(lang.id)}
                        >
                          <span className="mr-1.5 text-sm">{lang.icon}</span>
                          {lang.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="custom" className="mt-0 space-y-4">
                <div className="p-6 border-2 border-dashed rounded-3xl bg-blue-50/30 border-blue-200 transition-colors group hover:border-blue-400">
                  <Label className="font-semibold flex items-center gap-2 mb-3 text-blue-900 uppercase tracking-widest text-[10px]">
                    <FileText className="h-4 w-4" />
                    อัปโหลดไฟล์ Word ของท่าน
                  </Label>
                  <Input
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => setCustomFile(e.target.files?.[0] || null)}
                    className="h-11 bg-white cursor-pointer rounded-xl border-blue-100 shadow-sm"
                  />

                  <div className="mt-5 p-5 bg-white rounded-2xl border border-blue-100 text-xs text-slate-600 shadow-sm">
                    <p className="font-semibold text-blue-900 mb-3 border-b border-blue-50 pb-2">
                      คู่มือการใส่ตัวแปร (Smart Tags):
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 font-mono text-[10px] p-1">
                      <li className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <span className="text-blue-700 font-semibold">{"{{lead.full_name}}"}</span>
                        <span className="font-sans text-slate-400 text-[9px] font-semibold">ชื่อลูกค้า</span>
                      </li>
                      <li className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <span className="text-blue-700 font-semibold">{"{{property.name}}"}</span>
                        <span className="font-sans text-slate-400 text-[9px] font-semibold">ชื่อทรัพย์</span>
                      </li>
                      <li className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <span className="text-blue-700 font-semibold">{"{{deal.formatted_price}}"}</span>
                        <span className="font-sans text-slate-400 text-[9px] font-semibold">ราคาดีล</span>
                      </li>
                      <li className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <span className="text-blue-700 font-semibold">{"{{date.today}}"}</span>
                        <span className="font-sans text-slate-400 text-[9px] font-semibold">วันนี้</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Step 3: Financial & Overrides */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-4 px-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <Label className="text-xs font-semibold text-slate-700 uppercase tracking-widest">
                  ข้อมูลเจ้าบ้าน / ผู้รับเงิน (Landlord Info)
                </Label>
              </div>
                
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="bankName" className="text-xs font-semibold text-slate-500 ml-1">ธนาคารที่รับเงิน</Label>
                  <p className="text-[10px] text-slate-400 ml-1 font-medium">ระบุชื่อธนาคารสำหรับรับชำระเงิน</p>
                  <Input
                    id="bankName"
                    placeholder="เช่น กสิกรไทย (KBank)"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccountNo" className="text-xs font-semibold text-slate-500 ml-1">เลขที่บัญชี</Label>
                  <p className="text-[10px] text-slate-400 ml-1 font-medium">ระบุเลขที่บัญชีโดยไม่ต้องใส่เครื่องหมายขีด</p>
                  <Input
                    id="bankAccountNo"
                    placeholder="0000000000"
                    value={bankAccountNo}
                    onChange={(e) => setBankAccountNo(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="paymentPeriod" className="text-xs font-semibold text-slate-500 ml-1">รอบการชำระ</Label>
                  <p className="text-[10px] text-slate-400 ml-1 font-medium">เช่น ทุกวันที่ 5 ของเดือน</p>
                  <Input
                    id="paymentPeriod"
                    placeholder="เช่น 7th of April 2026"
                    value={paymentPeriod}
                    onChange={(e) => setPaymentPeriod(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 ml-1">วิธีชำระเงิน</Label>
                  <ResponsiveDialog
                    open={paymentMethodDialogOpen}
                    onOpenChange={setPaymentMethodDialogOpen}
                    title="เลือกวิธีชำระเงิน"
                    description="ระบุวิธีที่ลูกค้าจะใช้ชำระเงินสำหรับเอกสารนี้"
                    trigger={
                      <Button
                        variant="outline"
                        className="w-full h-11 rounded-xl border-slate-200 bg-white font-semibold flex items-center justify-between px-4 hover:bg-slate-50!"
                        onClick={() => setPaymentMethodDialogOpen(true)}
                      >
                        <span className="text-slate-700">
                          {paymentMethod === "Transfer" ? "โอนเงิน (Transfer)" : 
                           paymentMethod === "Cash" ? "เงินสด (Cash)" :
                           paymentMethod === "Cheque" ? "เช็ค (Cheque)" :
                           paymentMethod === "Credit Card" ? "บัตรเครดิต (Credit Card)" : "เลือกวิธีชำระ..."}
                        </span>
                        <div className="flex items-center gap-2">
                           <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                           <FileText className="h-4 w-4 text-slate-400" />
                        </div>
                      </Button>
                    }
                  >
                    <div className="p-4 space-y-3">
                       {[
                         { id: "Transfer", label: "โอนเงิน (Transfer)", icon: "🏦" },
                         { id: "Cash", label: "เงินสด (Cash)", icon: "💵" },
                         { id: "Cheque", label: "เช็ค (Cheque)", icon: "📜" },
                         { id: "Credit Card", label: "บัตรเครดิต (Credit Card)", icon: "💳" },
                       ].map((method) => (
                         <div
                          key={method.id}
                          className={cn(
                            "p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4",
                            paymentMethod === method.id
                              ? "border-blue-600 bg-blue-50/50 shadow-sm"
                              : "border-slate-100 hover:border-blue-200 hover:bg-slate-50"
                          )}
                          onClick={() => {
                            setPaymentMethod(method.id);
                            setPaymentMethodDialogOpen(false);
                          }}
                         >
                           <div className={cn(
                             "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-xl",
                             paymentMethod === method.id ? "bg-blue-600 text-white" : "bg-slate-100"
                           )}>
                             {method.icon}
                           </div>
                           <span className={cn("font-semibold flex-1", paymentMethod === method.id ? "text-blue-900" : "text-slate-700")}>
                             {method.label}
                           </span>
                           {paymentMethod === method.id && (
                              <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                                 <div className="h-1.5 w-1.5 rounded-full bg-white" />
                              </div>
                           )}
                         </div>
                       ))}
                    </div>
                  </ResponsiveDialog>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName" className="text-xs font-semibold text-slate-500 ml-1">ชื่อบัญชีผู้รับเงิน</Label>
                <p className="text-[10px] text-slate-400 ml-1 font-medium">ระบุชื่อเจ้าของบัญชีสำหรับรับเงิน</p>
                <Input
                  id="accountName"
                  placeholder="กรอกชื่อเจ้าของบัญชี"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 bg-white"
                />
              </div>
            </div>

            <div className="px-6">
              <div className="p-6 rounded-3xl border border-blue-100 bg-blue-50/20 space-y-4 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                  <FileText className="h-24 w-24 text-blue-900" />
                </div>
                <Label className="text-[10px] font-semibold text-blue-900 flex items-center gap-2 uppercase tracking-widest">
                  <Wand2 className="h-4 w-4" />
                  ข้อมูลผู้เช่า / ผู้รับเอกสาร (Tenant Overrides)
                </Label>
                <p className="text-[10px] text-blue-700/70 font-medium leading-relaxed">
                  ระบุข้อมูลผู้เช่าที่ต้องการให้ปรากฏในเอกสาร (กรณีต้องการเปลี่ยนจากข้อมูลลูกค้าในระบบ)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">ชื่อ-นามสกุล</Label>
                    <Input
                      className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">Line ID</Label>
                    <Input
                      className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
                      value={clientLine}
                      onChange={(e) => setClientLine(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">Email Address</Label>
                  <Input
                    className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Slip & Final Review */}
        {currentStep === 4 && (
          <div className="space-y-6 px-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Slip Upload - Only for Receipt/Booking */}
            {showSlipUpload && (
              <div className="space-y-2 p-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:bg-slate-100/50">
                <Label className="text-xs font-semibold flex items-center gap-2 mb-2 text-slate-700 uppercase tracking-wider">
                  <ImageIcon className="h-4 w-4 text-emerald-600" />
                  อัปโหลดหลักฐานการโอน (Transfer Slip)
                </Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="bg-white h-11 border-slate-200 rounded-xl"
                    />
                    <p className="text-[10px] text-slate-500 mt-2 font-medium">
                      รองรับ JPG, PNG (ไม่เกิน 5MB) - รูปจะปรากฏกลางใบเสร็จ
                    </p>
                  </div>
                  {slipPreview && (
                    <div className="h-16 w-16 relative rounded-xl overflow-hidden border-2 border-white shadow-md shrink-0">
                      <img
                        src={slipPreview}
                        alt="Slip"
                        className="object-cover h-full w-full"
                      />
                      <button
                        onClick={() => {
                          setSlipFile(null);
                          setSlipPreview(null);
                        }}
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg shadow-sm hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-3xl bg-blue-50/50 p-6 border border-blue-100/50 relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
                 <Wand2 className="h-32 w-32 text-blue-900" />
              </div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                <p className="font-semibold text-[10px] text-blue-900 uppercase tracking-widest leading-none">
                  ระบบเตรียมข้อมูลอัตโนมัติ:
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-[11px] text-blue-900/80 font-semibold tracking-tight">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-lg bg-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  ข้อมูลลูกค้าและที่อยู่
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-lg bg-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  รายละเอียดทรัพย์
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-lg bg-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  ราคา (แปลงเป็นตัวอักษร)
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-lg bg-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  วันที่ปัจจุบัน (Localization)
                </div>
                {slipFile && (
                  <div className="flex items-center gap-3 text-emerald-700">
                    <div className="h-5 w-5 rounded-lg bg-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    รูปภาพสลิปการโอน
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      
    </ResponsiveDialog>
  );
}
