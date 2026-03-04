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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    setTemplateSource("standard");
    setCustomFile(null);
  };

  useEffect(() => {
    if (open) {
      resetForm();
      loadTemplates();
    }
  }, [open, initialOwnerId, initialOwnerType]);

  // Debounced search
  useEffect(() => {
    if (!ownerSearch.trim()) {
      setOwnerResults([]);
      return;
    }

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
    }, 500);

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
            .select("*")
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
            .select("*, leads(*)")
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
            language,
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
            language,
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="lg" className="gap-2">
            <FileText className="h-4 w-4" />
            สร้างจาก Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Wand2 className="h-6 w-6 text-blue-600" />
            สร้างเอกสารอัตโนมัติ (A4 Layout)
          </DialogTitle>
          <DialogDescription>
            เลือกต้นแบบและข้อมูลที่ต้องการ ระบบจะสร้างไฟล์ PDF/HTML ขนาด A4
            ให้ทันที
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Owner Selection - Only show if not fixed via props */}
          {!initialOwnerId && (
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-1">
                <Search className="h-4 w-4 text-slate-500" />
                <Label className="font-bold">
                  ข้อมูลอ้างอิง (Reference Owner)
                </Label>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(["DEAL", "LEAD", "PROPERTY"] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={targetOwnerType === type ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs font-bold"
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
                  placeholder={`พิมพ์ค้นหาชื่อ ${targetOwnerType === "DEAL" ? "ลูกค้าหรือทรัพย์สินในดีล" : targetOwnerType === "LEAD" ? "ลูกค้า" : "ทรัพย์สิน"}...`}
                  value={ownerSearch}
                  onChange={(e) => setOwnerSearch(e.target.value)}
                  className="pl-9"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400" />
                )}
              </div>

              {ownerResults.length > 0 && !selectedOwnerId && (
                <div className="border rounded-md bg-white max-h-[150px] overflow-y-auto shadow-sm">
                  {ownerResults.map((r) => (
                    <div
                      key={r.id}
                      className="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0 flex items-center justify-between"
                      onClick={() => {
                        setSelectedOwnerId(r.id);
                        setOwnerSearch(r.label);
                        setOwnerResults([]);
                      }}
                    >
                      <span className="font-medium">{r.label}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] text-blue-600"
                      >
                        เลือก
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {selectedOwnerId && (
                <div className="flex items-center justify-between bg-blue-50 p-2 rounded-md border border-blue-200">
                  <span className="text-sm font-bold text-blue-700 truncate mr-2">
                    {ownerSearch}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-blue-400 hover:text-blue-600"
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

          <Tabs
            value={templateSource}
            onValueChange={(v: any) => setTemplateSource(v)}
          >
            <TabsList className="grid w-full grid-cols-2 mb-4 h-10">
              <TabsTrigger value="standard" className="text-xs font-bold">
                เลือกจากที่มีในระบบ (HTML)
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs font-bold">
                อัปโหลดไฟล์ Word (.docx)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="standard" className="mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="template"
                    className="font-bold text-slate-700"
                  >
                    ต้นแบบเอกสาร
                  </Label>
                  <Select
                    value={selectedTemplateId}
                    onValueChange={setSelectedTemplateId}
                    disabled={loading}
                  >
                    <SelectTrigger id="template" className="bg-white">
                      <SelectValue placeholder="เลือกต้นแบบ..." />
                    </SelectTrigger>
                    <SelectContent className="z-200">
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="language"
                    className="font-bold text-slate-700"
                  >
                    ภาษา (Language)
                  </Label>
                  <Select
                    value={language}
                    onValueChange={setLanguage}
                    disabled={loading}
                  >
                    <SelectTrigger id="language" className="bg-white">
                      <SelectValue placeholder="เลือกภาษา..." />
                    </SelectTrigger>
                    <SelectContent className="z-200">
                      <SelectItem value="th">ภาษาไทย</SelectItem>
                      <SelectItem value="en">English (US)</SelectItem>
                      <SelectItem value="cn">中文 (简体)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="mt-0 space-y-4">
              <div className="p-4 border-2 border-dashed rounded-xl bg-slate-50 border-blue-200">
                <Label className="font-bold flex items-center gap-2 mb-2 text-blue-800">
                  <FileText className="h-4 w-4" />
                  อัปโหลดเทมเพลต .docx ของท่าน
                </Label>
                <Input
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setCustomFile(e.target.files?.[0] || null)}
                  className="bg-white cursor-pointer"
                />

                <div className="mt-4 p-3 bg-white rounded-md border text-xs text-slate-600 shadow-sm">
                  <p className="font-bold text-slate-800 mb-2">
                    คู่มือการใส่ตัวแปร (ผูกข้อมูลอัตโนมัติ):
                  </p>
                  <p className="mb-2 text-slate-500">
                    พิมพ์ตัวแปรเหล่านี้ลงใน Word ของท่าน
                    ระบบจะแทนที่ให้เมื่อกดออกเอกสาร
                  </p>
                  <ul className="list-disc pl-4 space-y-1.5 font-mono text-[11px] bg-slate-50 p-2 rounded">
                    <li>
                      <span className="text-blue-700">
                        {"{{lead.full_name}}"}
                      </span>{" "}
                      <span className="font-sans text-slate-500">
                        - ชื่อลูกค้า
                      </span>
                    </li>
                    <li>
                      <span className="text-blue-700">
                        {"{{property.name}}"}
                      </span>{" "}
                      <span className="font-sans text-slate-500">
                        - ชื่อทรัพย์
                      </span>
                    </li>
                    <li>
                      <span className="text-blue-700">
                        {"{{deal.formatted_price}}"}
                      </span>{" "}
                      <span className="font-sans text-slate-500">
                        - ราคา ฟอร์แมตตัดลูกน้ำ
                      </span>
                    </li>
                    <li>
                      <span className="text-blue-700">
                        {"{{deal.amount_in_words}}"}
                      </span>{" "}
                      <span className="font-sans text-slate-500">
                        - ราคาเป็นข้อความ (เช่น หนึ่งแสนถ้วน)
                      </span>
                    </li>
                    <li>
                      <span className="text-blue-700">{"{{date.today}}"}</span>{" "}
                      <span className="font-sans text-slate-500">
                        - วันที่วันนี้
                      </span>
                    </li>
                    <li>
                      <span className="text-blue-700">
                        {"{{deal.payment_period}}"}
                      </span>{" "}
                      <span className="font-sans text-slate-500">
                        - กำหนดชำระงวดแรก
                      </span>
                    </li>
                    <li>
                      <span className="text-blue-700">{"{{bank_name}}"}</span>{" "}
                      <span className="font-sans text-slate-500">
                        - ธนาคารที่โอน
                      </span>
                    </li>
                    <li>
                      <span className="text-blue-700">
                        {"{{bank_account_no}}"}
                      </span>{" "}
                      <span className="font-sans text-slate-500">
                        - เลขที่ธนาคารที่โอน
                      </span>
                    </li>
                  </ul>
                  <p className="mt-3 text-[10.5px] text-blue-600 font-sans italic flex items-center gap-1">
                    💡 ทริค: จัดหน้า Word ให้สวยตามต้องการได้เลย Layout
                    จะไม่พังเหมือนแปลง PDF ทั่วไป
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="customLanguage"
                  className="font-bold text-slate-700"
                >
                  ภาษาข้อมูลอัตโนมัติ (Language Localization)
                </Label>
                <Select
                  value={language}
                  onValueChange={setLanguage}
                  disabled={loading}
                >
                  <SelectTrigger id="customLanguage" className="bg-white">
                    <SelectValue placeholder="เลือกภาษา..." />
                  </SelectTrigger>
                  <SelectContent className="z-200">
                    <SelectItem value="th">
                      ภาษาไทย (แปลตัวเลขเป็นภาษาไทย)
                    </SelectItem>
                    <SelectItem value="en">
                      English (Translate numbers to English)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName" className="font-bold text-slate-700">
                ชื่อธนาคาร
              </Label>
              <Input
                id="bankName"
                placeholder="เช่น กสิกรไทย"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="bankAccountNo"
                className="font-bold text-slate-700"
              >
                เลขที่บัญชี
              </Label>
              <Input
                id="bankAccountNo"
                placeholder="000-0-00000-0"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="paymentPeriod"
                className="font-bold text-slate-700"
              >
                รอบการชำระ (Payment Period)
              </Label>
              <Input
                id="paymentPeriod"
                placeholder="เช่น 7th, February 2026"
                value={paymentPeriod}
                onChange={(e) => setPaymentPeriod(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="paymentMethod"
                className="font-bold text-slate-700"
              >
                วิธีชำระ (Payment Method)
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="เลือกวิธีชำระ..." />
                </SelectTrigger>
                <SelectContent className="z-200">
                  <SelectItem value="Transfer">Transfer (โอนเงิน)</SelectItem>
                  <SelectItem value="Cash">Cash (เงินสด)</SelectItem>
                  <SelectItem value="Cheque">Cheque (เช็ค)</SelectItem>
                  <SelectItem value="Credit Card">
                    Credit Card (บัตรเครดิต)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountName" className="font-bold text-slate-700">
              ชื่อบัญชี (Account Name / Owner Name)
            </Label>
            <Input
              id="accountName"
              placeholder="กรอกชื่อเจ้าของบัญชี หรือชื่อผู้รับเงิน"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>

          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 space-y-3">
            <Label className="font-bold text-blue-800 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              ข้อมูลผู้รับเอกสาร (Client Overrides)
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-500">
                  ชื่อ-นามสกุล
                </Label>
                <Input
                  size={1}
                  className="h-8 text-sm"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-500">Line ID</Label>
                <Input
                  size={1}
                  className="h-8 text-sm"
                  value={clientLine}
                  onChange={(e) => setClientLine(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-slate-500">Email</Label>
              <Input
                size={1}
                className="h-8 text-sm"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Slip Upload - Only for Receipt/Booking */}
          {showSlipUpload && (
            <div className="space-y-2 p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
              <Label className="font-bold flex items-center gap-2 mb-2">
                <ImageIcon className="h-4 w-4 text-emerald-600" />
                อัปโหลดหลักฐานการโอน (Transfer Slip)
              </Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="bg-white"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    รองรับ JPG, PNG (ไม่เกิน 5MB) - รูปจะปรากฏกลางใบเสร็จ
                  </p>
                </div>
                {slipPreview && (
                  <div className="h-16 w-16 relative rounded-md overflow-hidden border bg-white shrink-0">
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
                      className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-blue-600"></div>
              <p className="font-bold text-sm text-blue-800">
                ข้อมูลที่ระบบกำลังเตรียม:
              </p>
            </div>
            <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-[11px] text-blue-700 font-medium">
              <div className="flex items-center gap-1.5 opacity-80">
                ✅ ข้อมูลลูกค้าและที่อยู่
              </div>
              <div className="flex items-center gap-1.5 opacity-80">
                ✅ รายละเอียดทรัพย์
              </div>
              <div className="flex items-center gap-1.5 opacity-80">
                ✅ ราคา (แปลงเป็นตัวอักษร)
              </div>
              <div className="flex items-center gap-1.5 opacity-80">
                ✅ วันที่ปัจจุบัน (Localization)
              </div>
              {slipFile && (
                <div className="flex items-center gap-1.5 text-emerald-700">
                  ✅ รูปภาพสลิปการโอน
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="font-bold"
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={
              loading ||
              !selectedTemplateId ||
              (!initialOwnerId && !selectedOwnerId)
            }
            className="px-8 font-bold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังสร้างเอกสาร...
              </>
            ) : (
              "ยืนยันและสร้างไฟล์"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
