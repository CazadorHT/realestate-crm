"use client";

import React, { useState, useEffect, useTransition, useRef } from "react";
import { QuickDocumentPayload } from "../quick-document-schema";
import {
  createQuickDocumentAction,
  findExistingLeadAction,
  searchProjectsForQuickDocAction,
} from "../quick-document-actions";
import { getBanksAction } from "@/features/finance/bank-actions";
import { sanitizeAndCompressImage } from "@/lib/utils/image-sanitizer";
import { uploadDocumentToStorageAction } from "../generation-actions";
import { createDocumentRecordAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  User,
  Building2,
  Calculator,
  CreditCard,
  Plus,
  Trash2,
  Search,
  Sparkles,
  Loader2,
  CheckCircle2,
  X,
  Upload,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface QuickDocumentFormProps {
  templates: any[];
  initialTemplateId?: string;
  onSuccess: (result: {
    dealId: string;
    leadId: string;
    propertyId: string;
    documentId: string;
    storagePath: string;
  }) => void;
  onCancel?: () => void;
  isEn?: boolean;
}

const FINANCIAL_PRESETS = [
  {
    th: "เงินมัดจำ / ค่าจอง (Reservation Fee)",
    en: "Reservation Fee (1 Month)",
    cn: "定金 / 预定费 (Reservation Fee)",
    ru: "Залог / Бронирование (Reservation Fee)",
    badge: "มัดจำ/จอง",
    defaultQty: 1,
  },
  {
    th: "เงินประกัน (Security Deposit 2 เดือน)",
    en: "Security Deposit (2 Months)",
    cn: "押金 (2个月) Security Deposit",
    ru: "Страховой депозит (2 месяца)",
    badge: "ประกัน 2 เดือน",
    defaultQty: 1,
  },
  {
    th: "เงินประกัน (Security Deposit 1 เดือน)",
    en: "Security Deposit (1 Month)",
    cn: "押金 (1个月) Security Deposit",
    ru: "Страховой депозит (1 месяц)",
    badge: "ประกัน 1 เดือน",
    defaultQty: 1,
  },
  {
    th: "ค่าเช่าล่วงหน้า (Advance Rent 1 เดือน)",
    en: "Advance Rent (1 Month)",
    cn: "预付租金 (1个月) Advance Rent",
    ru: "Аванс за аренду (1 месяц)",
    badge: "ค่าเช่าล่วงหน้า",
    defaultQty: 1,
  },
  {
    th: "ค่าประกันสัตว์เลี้ยง (Pet Deposit)",
    en: "Pet Deposit",
    cn: "宠物押金 (Pet Deposit)",
    ru: "Депозит за домашних животных",
    badge: "ประกันสัตว์เลี้ยง",
    defaultQty: 1,
  },
  {
    th: "ค่ามัดจำคีย์การ์ด / รีโมท (Keycard Deposit)",
    en: "Keycard / Remote Deposit",
    cn: "门禁卡/遥控器押金",
    ru: "Залог за ключ-карту / пульт",
    badge: "คีย์การ์ด/รีโมท",
    defaultQty: 1,
  },
  {
    th: "ค่าทำความสะอาด (Cleaning Fee)",
    en: "Cleaning Fee",
    cn: "清洁费 (Cleaning Fee)",
    ru: "Плата за уборку",
    badge: "ค่าทำความสะอาด",
    defaultQty: 1,
  },
  {
    th: "ค่าส่วนกลาง (Common Fee)",
    en: "Common Area Maintenance Fee",
    cn: "物业管理费 (Common Fee)",
    ru: "Коммунальные платежи",
    badge: "ค่าส่วนกลาง",
    defaultQty: 1,
  },
  {
    th: "อื่นๆ (ระบุเอง)",
    en: "Other (Custom)",
    cn: "其他 (自定义)",
    ru: "Другое",
    badge: "อื่นๆ",
    defaultQty: 1,
  },
];

const LANGUAGE_OPTIONS = [
  { code: "th" as const, label: "ไทย", tag: "TH" },
  { code: "en" as const, label: "English", tag: "EN" },
  { code: "cn" as const, label: "中文", tag: "CN" },
  { code: "ru" as const, label: "Русский", tag: "RU" },
];

const HEADER_TITLE_OPTIONS = [
  { th: "เอกสารการจองทรัพย์สิน", en: "Reservation Form", label: "ใบจองทรัพย์" },
  { th: "ใบเสร็จรับเงิน", en: "Receipt", label: "ใบเสร็จรับเงิน" },
  { th: "ใบเสร็จค่าเช่า", en: "Rent Receipt", label: "ใบเสร็จค่าเช่า" },
  { th: "ใบแจ้งหนี้", en: "Invoice", label: "ใบแจ้งหนี้ (Invoice)" },
];

const PAYEE_ROLE_OPTIONS = [
  {
    key: "OWNER",
    icon: "🏠",
    th: "เจ้าของทรัพย์ (Owner)",
    en: "Owner / Landlord",
    cn: "房东 (Owner)",
    ru: "Владелец (Owner)",
    badge: "เจ้าของทรัพย์",
  },
  {
    key: "AGENCY",
    icon: "🏢",
    th: "บริษัทเอเจ้นท์ (Agency)",
    en: "Agency",
    cn: "中介公司 (Agency)",
    ru: "Агентство (Agency)",
    badge: "บริษัทเอเจ้นท์",
  },
  {
    key: "DEVELOPER",
    icon: "🏗️",
    th: "โครงการ / นิติบุคคล (Developer)",
    en: "Developer / Juristic",
    cn: "开发商 / 物业 (Developer)",
    ru: "Застройщик (Developer)",
    badge: "โครงการ/นิติฯ",
  },
  {
    key: "OTHER",
    icon: "✏️",
    th: "อื่นๆ",
    en: "Other",
    cn: "其他",
    ru: "Другое",
    badge: "อื่นๆ",
  },
];

export function QuickDocumentForm({
  templates,
  initialTemplateId,
  onSuccess,
  onCancel,
  isEn: initialIsEn = false,
}: QuickDocumentFormProps) {
  const [isPending, startTransition] = useTransition();

  // 1. Template & Language
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialTemplateId || (templates[0]?.id ?? ""),
  );
  const [language, setLanguage] = useState<"th" | "en" | "cn" | "ru">(
    initialIsEn ? "en" : "th",
  );
  const isEn = language !== "th";
  const [documentTitle, setDocumentTitle] = useState("");

  const getProjectDisplayName = (proj: any, lang: "th" | "en" | "cn" | "ru") => {
    if (!proj) return "";
    const th = proj.name?.th || proj.name_th || proj.address_line1 || "";
    const en = proj.name?.en || proj.name_en || proj.address_line1_en || "";
    if (lang === "th") {
      return th || en;
    }
    return en || th;
  };

  const handleLanguageChange = (newLang: "th" | "en" | "cn" | "ru") => {
    setLanguage(newLang);
    const matchedOption = HEADER_TITLE_OPTIONS.find(
      (opt) => documentTitle === opt.th || documentTitle === opt.en,
    );
    if (matchedOption) {
      setDocumentTitle(newLang === "th" ? matchedOption.th : matchedOption.en);
    }
    const matchedRole = PAYEE_ROLE_OPTIONS.find((r) => r.key === payeeRoleKey);
    if (matchedRole && payeeRoleKey !== "OTHER") {
      setPayeeRole(
        newLang === "th"
          ? matchedRole.th
          : newLang === "cn"
            ? matchedRole.cn
            : newLang === "ru"
              ? matchedRole.ru
              : matchedRole.en,
      );
    }
    if (selectedProject && !isCustomProject) {
      const pName = getProjectDisplayName(selectedProject, newLang);
      setSelectedProjectName(pName);
      setProjectSearch(pName);
    }
    if (selectedBankId && banks.length > 0) {
      const found = banks.find((b) => String(b.id) === selectedBankId);
      if (found) {
        setBankName(newLang === "th" ? found.name_th || found.name_en : found.name_en || found.name_th);
      }
    }
    if (accountName === "บจก. วีซี คอนเนค แอสเสท" && newLang !== "th") {
      setAccountName("VC Connect Asset Co., Ltd.");
    } else if (accountName === "VC Connect Asset Co., Ltd." && newLang === "th") {
      setAccountName("บจก. วีซี คอนเนค แอสเสท");
    }
    // Auto-translate financial items matching presets
    setFinancialItems((prev) =>
      prev.map((item) => {
        const descTrim = (item.description || "").trim();
        const matchedPreset = FINANCIAL_PRESETS.find(
          (p) =>
            p.th.trim() === descTrim ||
            p.en.trim() === descTrim ||
            (p.cn && p.cn.trim() === descTrim) ||
            (p.ru && p.ru.trim() === descTrim) ||
            (descTrim.includes("Reservation Fee") && p.badge === "มัดจำ/จอง") ||
            (descTrim.includes("Security Deposit") && p.badge.includes("ประกัน")) ||
            (descTrim.includes("Advance Rent") && p.badge === "ค่าเช่าล่วงหน้า"),
        );
        if (matchedPreset) {
          const newDesc =
            newLang === "th"
              ? matchedPreset.th
              : newLang === "cn"
                ? matchedPreset.cn || matchedPreset.en
                : newLang === "ru"
                  ? matchedPreset.ru || matchedPreset.en
                  : matchedPreset.en;
          return {
            ...item,
            description: newDesc,
          };
        }
        return item;
      }),
    );
  };

  const handleTemplateChange = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const chosen = templates.find((t) => t.id === tplId);
    if (chosen) {
      if (chosen.type === "INVOICE" || (chosen.name && chosen.name.includes("Invoice"))) {
        setDocumentTitle(language === "th" ? "ใบแจ้งหนี้" : "Invoice");
      } else if (chosen.type === "RENT_RECEIPT") {
        setDocumentTitle(language === "th" ? "ใบเสร็จค่าเช่า" : "Rent Receipt");
        setFinancialItems((prev) => {
          if (
            prev.length === 1 &&
            (prev[0].description.includes("Reservation Fee") ||
              prev[0].description.includes("เงินมัดจำ / ค่าจอง"))
          ) {
            return [
              {
                description:
                  language === "th"
                    ? "ค่าเช่าล่วงหน้า (Advance Rent 1 เดือน)"
                    : "Advance Rent (1 Month)",
                quantity: 1,
                unit_price: prev[0].unit_price,
              },
            ];
          }
          return prev;
        });
      } else if (chosen.type === "RESERVATION_DOCUMENT") {
        setDocumentTitle(language === "th" ? "เอกสารการจองทรัพย์สิน" : "Reservation Form");
      }
    }
  };

  const handleSelectPayeeRole = (roleKey: string) => {
    setPayeeRoleKey(roleKey);
    const opt = PAYEE_ROLE_OPTIONS.find((r) => r.key === roleKey);
    if (opt) {
      if (roleKey === "OTHER") {
        setPayeeRole("");
      } else {
        const roleLabel =
          language === "th"
            ? opt.th
            : language === "cn"
              ? opt.cn
              : language === "ru"
                ? opt.ru
                : opt.en;
        setPayeeRole(roleLabel);
      }
    }
  };

  // 2. Client Info
  const [clientPhone, setClientPhone] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientLineId, setClientLineId] = useState("");
  const [clientPassport, setClientPassport] = useState("");
  const [clientNationality, setClientNationality] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Smart Search Candidate
  const [matchedLead, setMatchedLead] = useState<any | null>(null);
  const [isSearchingLead, setIsSearchingLead] = useState(false);

  // 3. Property Info
  const [isCustomProject, setIsCustomProject] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState("");
  const [projectSuggestions, setProjectSuggestions] = useState<any[]>([]);
  const [isSearchingProject, setIsSearchingProject] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  const [unitNumber, setUnitNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [bedrooms, setBedrooms] = useState<number>(1);
  const [bathrooms, setBathrooms] = useState<number>(1);
  const [sizeSqm, setSizeSqm] = useState<string>("");

  // 4. Financial Table
  const [financialItems, setFinancialItems] = useState<
    Array<{ description: string; quantity: number; unit_price: number }>
  >([
    {
      description: isEn
        ? "Reservation Fee (1 Month)"
        : "เงินมัดจำ / ค่าจอง (Reservation Fee)",
      quantity: 1,
      unit_price: 10000,
    },
  ]);
  const [contractDueDate, setContractDueDate] = useState("");

  // 5. Payment & Banks
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [accountName, setAccountName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Transfer");
  const [payeeRoleKey, setPayeeRoleKey] = useState<string>("OWNER");
  const [payeeRole, setPayeeRole] = useState<string>("เจ้าของทรัพย์ (Owner)");

  // Slip
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [slipStats, setSlipStats] = useState<string | null>(null);
  const [isProcessingSlip, setIsProcessingSlip] = useState(false);

  // Load Banks
  useEffect(() => {
    async function loadBanks() {
      const res = await getBanksAction();
      if (res.success && res.data) {
        setBanks(res.data);
        if (res.data.length > 0) {
          const firstBank = res.data[0];
          setSelectedBankId(String(firstBank.id));
          setBankName(
            language === "th"
              ? firstBank.name_th || firstBank.name_en || ""
              : firstBank.name_en || firstBank.name_th || "",
          );
        }
      }
    }
    loadBanks();
  }, []);

  // Update Bank Name when bank selected
  const handleBankSelect = (bankId: string) => {
    setSelectedBankId(bankId);
    const found = banks.find((b) => String(b.id) === bankId);
    if (found) {
      setBankName(language === "th" ? found.name_th || found.name_en : found.name_en || found.name_th);
    }
  };

  // Smart Search Lead by Phone (Debounced 350ms)
  useEffect(() => {
    if (!clientPhone || clientPhone.trim().length < 3) {
      setMatchedLead(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLead(true);
      try {
        const res = await findExistingLeadAction(clientPhone);
        if (res.success && res.leads && res.leads.length > 0) {
          setMatchedLead(res.leads[0]);
        } else {
          setMatchedLead(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingLead(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [clientPhone]);

  const applyMatchedLead = () => {
    if (!matchedLead) return;
    setSelectedLeadId(matchedLead.id);
    setClientName(matchedLead.full_name || "");
    if (matchedLead.phone) setClientPhone(matchedLead.phone);
    if (matchedLead.email) setClientEmail(matchedLead.email);
    if (matchedLead.line_id) setClientLineId(matchedLead.line_id);
    if (matchedLead.nationality) setClientNationality(matchedLead.nationality);
    if (matchedLead.passport) setClientPassport(matchedLead.passport);
    toast.success(isEn ? "Customer data autofilled!" : "ดึงข้อมูลลูกค้าเดิมเรียบร้อยแล้ว");
  };

  // Search Project Suggestions
  useEffect(() => {
    if (
      isCustomProject ||
      !projectSearch ||
      projectSearch.trim().length < 2 ||
      (selectedProject && projectSearch.trim() === selectedProjectName.trim())
    ) {
      setProjectSuggestions([]);
      setShowProjectDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingProject(true);
      try {
        const res = await searchProjectsForQuickDocAction(projectSearch);
        if (res.success && res.data) {
          setProjectSuggestions(res.data);
          setShowProjectDropdown(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingProject(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [projectSearch, isCustomProject, selectedProject, selectedProjectName]);

  const projectDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        projectDropdownRef.current &&
        !projectDropdownRef.current.contains(e.target as Node)
      ) {
        setShowProjectDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectProject = (proj: any) => {
    setSelectedProjectId(proj.id);
    setSelectedProject(proj);
    const pName = getProjectDisplayName(proj, language);
    setSelectedProjectName(pName);
    setProjectSearch(pName);
    setShowProjectDropdown(false);
  };

  // Financial calculations
  const calculateTotal = () => {
    return financialItems.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
      0,
    );
  };

  const addFinancialRow = () => {
    setFinancialItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unit_price: 0 },
    ]);
  };

  const removeFinancialRow = (index: number) => {
    if (financialItems.length <= 1) {
      toast.error(isEn ? "At least one row required" : "ต้องมีรายการอย่างน้อย 1 รายการ");
      return;
    }
    setFinancialItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateFinancialRow = (
    index: number,
    field: "description" | "quantity" | "unit_price",
    value: any,
  ) => {
    setFinancialItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Slip Upload & Sanitizer
  const handleSlipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingSlip(true);
    try {
      const sanitized = await sanitizeAndCompressImage(file, 1200, 0.85);
      setSlipFile(sanitized.file);
      setSlipPreview(sanitized.dataUrl);

      const origKb = Math.round(sanitized.originalSize / 1024);
      const compKb = Math.round(sanitized.compressedSize / 1024);
      setSlipStats(`${origKb} KB ➔ ${compKb} KB (พร้อมพิมพ์ A4)`);
    } catch (err: any) {
      toast.error(err.message || "ไม่สามารถประมวลผลรูปภาพได้");
    } finally {
      setIsProcessingSlip(false);
    }
  };

  const removeSlip = () => {
    setSlipFile(null);
    setSlipPreview(null);
    setSlipStats(null);
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!selectedTemplateId) {
      toast.error(isEn ? "Please select a template" : "กรุณาเลือกเทมเพลต");
      return;
    }
    if (!clientName.trim()) {
      toast.error(isEn ? "Customer name is required" : "กรุณาระบุชื่อลูกค้า");
      return;
    }
    const finalProjName = isCustomProject ? projectSearch.trim() : selectedProjectName.trim();
    if (!finalProjName) {
      toast.error(isEn ? "Project name is required" : "กรุณาระบุชื่อโครงการ/ทรัพย์สิน");
      return;
    }
    if (!bankName || !bankAccountNo.trim() || !accountName.trim()) {
      toast.error(isEn ? "Bank account details are required" : "กรุณากรอกข้อมูลบัญชีธนาคารให้ครบถ้วน");
      return;
    }

    startTransition(async () => {
      try {
        let uploadedSlipUrl = "";

        // If slip selected, upload to storage
        if (slipFile) {
          const fileExt = slipFile.name.split(".").pop() || "jpg";
          const fileName = `slip_${Date.now()}.${fileExt}`;
          const filePath = `slips/quick_${Date.now()}/${fileName}`;

          const formData = new FormData();
          formData.append("file", slipFile);

          const uploadRes = await uploadDocumentToStorageAction(formData, filePath);
          if (uploadRes.success) {
            uploadedSlipUrl = filePath;
          } else {
            console.warn("Storage upload failed, fallback to base64 preview:", uploadRes.error);
            uploadedSlipUrl = slipPreview || "";
          }
        }

        const payload: QuickDocumentPayload = {
          template_id: selectedTemplateId,
          language,
          document_title: documentTitle.trim() || undefined,
          client: {
            lead_id: selectedLeadId,
            full_name: clientName.trim(),
            phone: clientPhone.trim() || null,
            email: clientEmail.trim() || null,
            line_id: clientLineId.trim() || null,
            passport: clientPassport.trim() || null,
            nationality: clientNationality.trim() || null,
          },
          property: {
            project_id: isCustomProject ? null : selectedProjectId,
            project_name: finalProjName,
            unit_number: unitNumber.trim() || null,
            floor: floor.trim() || null,
            size_sqm: sizeSqm ? Number(sizeSqm) : null,
            bedrooms,
            bathrooms,
            rental_price: calculateTotal(),
            listing_type: "RENT",
          },
          financials: {
            items: financialItems.map((it) => ({
              description: it.description.trim() || "รายการค่าใช้จ่าย",
              quantity: Number(it.quantity) || 1,
              unit_price: Number(it.unit_price) || 0,
              total: (Number(it.quantity) || 1) * (Number(it.unit_price) || 0),
            })),
            contract_due_date: contractDueDate || null,
          },
          payment: {
            bank_name: bankName,
            bank_account_no: bankAccountNo.trim(),
            account_name: accountName.trim(),
            payee_role: payeeRole.trim() || undefined,
            payment_method: paymentMethod || "Transfer",
            slip_url: uploadedSlipUrl,
          },
        };

        const res = await createQuickDocumentAction(payload);
        if (!res.success) {
          throw new Error(res.error || "Failed to create quick document");
        }

        toast.success(
          isEn
            ? "Quick Document generated successfully!"
            : "ออกเอกสารด่วนและบันทึกข้อมูลเรียบร้อยแล้ว!",
        );

        onSuccess({
          dealId: res.dealId!,
          leadId: res.leadId!,
          propertyId: res.propertyId!,
          documentId: res.documentId!,
          storagePath: res.storagePath!,
        });
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "เกิดข้อผิดพลาดในการสร้างเอกสาร");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-2">
      {/* 1. Header: Template & Language Selection */}
      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
          <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-blue-600" />
            {isEn ? "Select Document Template" : "เลือกต้นแบบเอกสาร"}
          </Label>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">
              {isEn ? "Language:" : "ภาษาเอกสาร:"}
            </span>
            <div className="flex gap-1 items-center">
              {LANGUAGE_OPTIONS.map((langOpt) => {
                const active = language === langOpt.code;
                return (
                  <button
                    key={langOpt.code}
                    type="button"
                    onClick={() => handleLanguageChange(langOpt.code)}
                    className={cn(
                      "h-8 px-2.5 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-1 cursor-pointer select-none",
                      active
                        ? "bg-blue-600 border-blue-600 text-white font-semibold shadow-xs shadow-blue-500/20"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300",
                    )}
                  >
                    <span>{langOpt.label}</span>
                    <span
                      className={cn(
                        "text-[10px]",
                        active ? "text-blue-100 font-normal" : "text-slate-400 font-normal",
                      )}
                    >
                      ({langOpt.tag})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 1-Click Template Button Pills */}
        <div className="flex flex-wrap gap-2">
          {templates.map((tpl) => {
            const active = selectedTemplateId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleTemplateChange(tpl.id)}
                className={cn(
                  "h-9 px-3.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none",
                  active
                    ? "bg-blue-600 border-blue-600 text-white font-semibold shadow-xs shadow-blue-500/20"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300",
                )}
              >
                <FileText className={cn("h-3.5 w-3.5", active ? "text-white" : "text-blue-600")} />
                <span>{tpl.name || tpl.type}</span>
              </button>
            );
          })}
        </div>

        {/* Document Header Title on Paper */}
        <div className="space-y-1.5 sm:col-span-2 pt-2.5 border-t border-slate-200/60">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <span>{isEn ? "Header Title on Paper:" : "Text หัวข้อบนกระดาษ:"}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {isEn ? "(Select or type custom)" : "(เลือกหรือพิมพ์เองได้)"}
              </span>
            </Label>
            <div className="flex gap-1 flex-wrap">
              {HEADER_TITLE_OPTIONS.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => setDocumentTitle(language === "th" ? opt.th : opt.en)}
                  className={cn(
                    "text-[10px] font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
                    documentTitle === (language === "th" ? opt.th : opt.en)
                      ? "bg-blue-600 text-white shadow-xs font-bold"
                      : "bg-slate-200/70 text-slate-600 hover:bg-slate-300/80",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <Input
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            placeholder={
              language === "th"
                ? "ค่าเริ่มต้นตามประเภทเทมเพลต (เช่น ใบเสร็จรับเงิน, ใบเสร็จค่าเช่า, หรือ เอกสารการจองทรัพย์สิน)"
                : "Default according to template (e.g. Receipt, Rent Receipt, or Reservation Form)"
            }
            className="h-9 bg-white rounded-xl border-slate-200 text-xs font-semibold text-slate-800"
          />
        </div>
      </div>

      {/* 2. Client Information Section */}
      <div className="p-5 border border-slate-200 rounded-2xl bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <User className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {isEn ? "1. Customer Information" : "1. ข้อมูลผู้จอง / ลูกค้า"}
            </h4>
          </div>
          {isSearchingLead && (
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> {isEn ? "Checking CRM..." : "กำลังค้นหาในระบบ..."}
            </span>
          )}
        </div>

        {/* Smart Duplicate Banner */}
        {matchedLead && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                {isEn ? "Existing customer found:" : "พบข้อมูลลูกค้าเดิม:"}{" "}
                <strong>{matchedLead.full_name}</strong> ({matchedLead.phone})
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={applyMatchedLead}
              className="h-7 text-xs bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-100"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {isEn ? "Autofill" : "ดึงข้อมูลมาใช้"}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">
              {isEn ? "Phone Number" : "เบอร์โทรศัพท์ (มีระบบค้นหาอัตโนมัติ)"}
            </Label>
            <Input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="08X-XXX-XXXX"
              className="h-9.5 rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-500">
              {isEn ? "Customer Name *" : "ชื่อ-นามสกุล ผู้จอง *"}
            </Label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="เช่น Marianne Ignacio"
              required
              className="h-9.5 rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-500">
              {isEn ? "Nationality" : "สัญชาติ"}
            </Label>
            <Input
              value={clientNationality}
              onChange={(e) => setClientNationality(e.target.value)}
              placeholder="เช่น ไทย, Philippines, China"
              className="h-9.5 rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-500">
              {isEn ? "Passport / ID Card No." : "เลขพาสปอร์ต / บัตร ปชช."}
            </Label>
            <Input
              value={clientPassport}
              onChange={(e) => setClientPassport(e.target.value)}
              placeholder="PXXXXXXXX หรือ 1XXXXXXXXXXXX"
              className="h-9.5 rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Line ID</Label>
            <Input
              value={clientLineId}
              onChange={(e) => setClientLineId(e.target.value)}
              placeholder="Line ID (ถ้ามี)"
              className="h-9.5 rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Email</Label>
            <Input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="email@example.com (ถ้ามี)"
              className="h-9.5 rounded-xl border-slate-200"
            />
          </div>
        </div>
      </div>

      {/* 3. Property Information Section (Search-First Combobox) */}
      <div className="p-5 border border-slate-200 rounded-2xl bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Building2 className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {isEn ? "2. Property & Room Details" : "2. ข้อมูลทรัพย์สินและห้องพัก"}
            </h4>
          </div>

          {/* Toggle between Search Master vs Custom Project */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsCustomProject(!isCustomProject);
              setProjectSearch("");
              setSelectedProjectId(null);
              setSelectedProjectName("");
            }}
            className="h-7 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
          >
            {isCustomProject
              ? isEn
                ? "🔍 Switch to Search Mode"
                : "🔍 กลับไปค้นหาโครงการในระบบ"
              : isEn
                ? "+ Project Not Found? Type Name"
                : "+ ไม่พบโครงการ? พิมพ์ชื่อเอง"}
          </Button>
        </div>

        <div className="space-y-3.5">
          {/* Project Name Selector */}
          <div className="space-y-1 relative">
            <Label className="text-xs text-slate-500">
              {isCustomProject
                ? isEn
                  ? "Project Name (Custom Free-text) *"
                  : "ชื่อโครงการ / ทรัพย์สิน (พิมพ์เองอิสระ) *"
                : isEn
                  ? "Search Master Project *"
                  : "ค้นหาชื่อโครงการในระบบ (Search Master Project) *"}
            </Label>

            <div className="relative" ref={projectDropdownRef}>
              <Input
                value={projectSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  setProjectSearch(val);
                  if (isCustomProject) {
                    setSelectedProjectName(val);
                  } else {
                    if (selectedProject && val.trim() !== selectedProjectName.trim()) {
                      setSelectedProjectId(null);
                      setSelectedProject(null);
                    }
                  }
                }}
                onFocus={() => {
                  if (!isCustomProject && projectSuggestions.length > 0 && !selectedProject) {
                    setShowProjectDropdown(true);
                  }
                }}
                placeholder={
                  isCustomProject
                    ? "เช่น บ้านเดี่ยว สุขุมวิท 71 หรือ ศุภาลัย เวอแรนด้า"
                    : "พิมพ์ชื่อโครงการ เช่น Supalai, Ideo, Life One Wireless..."
                }
                required
                className="h-9.5 rounded-xl border-slate-200 pr-8"
              />
              {!isCustomProject && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {isSearchingProject ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </div>
              )}

              {/* Suggestions Dropdown */}
              {!isCustomProject && showProjectDropdown && projectSuggestions.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {projectSuggestions.map((proj) => {
                    const th = proj.name?.th || proj.name_th || proj.address_line1 || "";
                    const en = proj.name?.en || proj.name_en || proj.address_line1_en || "";
                    const primary = en || th;
                    const secondary = th && en && th !== en ? th : "";
                    return (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => handleSelectProject(proj)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition-colors flex flex-col cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-800">{primary}</span>
                          {secondary && (
                            <span className="text-[11px] text-slate-500 font-normal">
                              ({secondary})
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {proj.district ? `${proj.district}, ` : ""}
                          {proj.province || ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Unit, Floor, Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">
                {isEn ? "Unit No." : "เลขที่ห้อง / ยูนิต"}
              </Label>
              <Input
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                placeholder="เช่น 22/22"
                className="h-9 rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-500">
                {isEn ? "Floor" : "ชั้น"}
              </Label>
              <Input
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="เช่น 11"
                className="h-9 rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-500">
                {isEn ? "Bedrooms" : "ห้องนอน"}
              </Label>
              <Select
                value={String(bedrooms)}
                onValueChange={(val) => setBedrooms(Number(val))}
              >
                <SelectTrigger className="h-9 rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 นอน (1 Bed)</SelectItem>
                  <SelectItem value="2">2 นอน (2 Bed)</SelectItem>
                  <SelectItem value="3">3 นอน (3 Bed)</SelectItem>
                  <SelectItem value="4">4+ นอน</SelectItem>
                  <SelectItem value="0">สตูดิโอ (Studio)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-500">
                {isEn ? "Size (Sqm)" : "ขนาด (ตร.ม.)"}
              </Label>
              <Input
                type="number"
                value={sizeSqm}
                onChange={(e) => setSizeSqm(e.target.value)}
                placeholder="เช่น 28"
                className="h-9 rounded-xl border-slate-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Financial Table Section */}
      <div className="p-5 border border-slate-200 rounded-2xl bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Calculator className="h-4 w-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {isEn ? "3. Financial Breakdown" : "3. รายละเอียดการเงินและราคา"}
            </h4>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addFinancialRow}
            className="h-7 text-xs gap-1 rounded-lg border-slate-200"
          >
            <Plus className="h-3 w-3" />
            {isEn ? "Add Row" : "เพิ่มแถว"}
          </Button>
        </div>

        {/* Quick Presets Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pb-1">
          <span className="text-[11px] font-semibold text-slate-500 mr-1">
            {isEn ? "Quick Presets:" : "ตัวเลือกด่วน:"}
          </span>
          {FINANCIAL_PRESETS.filter((p) => p.badge !== "อื่นๆ").map((preset, pIdx) => (
            <button
              key={pIdx}
              type="button"
              onClick={() => {
                const desc =
                  language === "th"
                    ? preset.th
                    : language === "cn"
                      ? preset.cn || preset.en
                      : language === "ru"
                        ? preset.ru || preset.en
                        : preset.en;

                setFinancialItems((prev) => {
                  // If single row and it's untouched default or blank, replace it
                  if (
                    prev.length === 1 &&
                    (!prev[0].description.trim() ||
                      prev[0].description.includes("Reservation Fee") ||
                      prev[0].description.includes("เงินมัดจำ / ค่าจอง"))
                  ) {
                    return [{ description: desc, quantity: preset.defaultQty, unit_price: prev[0].unit_price || 0 }];
                  }
                  return [
                    ...prev,
                    { description: desc, quantity: preset.defaultQty, unit_price: 0 },
                  ];
                });

                // Auto-adjust header text on paper if appropriate
                const isReceiptItem = [
                  "ประกันสัตว์เลี้ยง",
                  "คีย์การ์ด/รีโมท",
                  "ค่าทำความสะอาด",
                  "ค่าส่วนกลาง",
                ].includes(preset.badge);

                if (
                  isReceiptItem &&
                  (!documentTitle ||
                    documentTitle === "เอกสารการจองทรัพย์สิน" ||
                    documentTitle === "Reservation Form")
                ) {
                  const receiptText = language === "th" ? "ใบเสร็จรับเงิน" : "Receipt";
                  setDocumentTitle(receiptText);
                  toast.info(
                    language === "th"
                      ? `ปรับ Text หัวข้อบนกระดาษเป็น "${receiptText}" อัตโนมัติ`
                      : `Updated paper header to "${receiptText}"`,
                  );
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[11px] font-medium rounded-lg transition-colors cursor-pointer border border-slate-200/80 hover:border-emerald-200 active:scale-95"
            >
              <Plus className="h-3 w-3 text-emerald-600" />
              {preset.badge}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {financialItems.map((item, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-slate-50 border border-slate-100"
            >
              <div className="col-span-6 sm:col-span-7 flex items-center">
                {/* Free-text Description Input */}
                <Input
                  value={item.description}
                  onChange={(e) =>
                    updateFinancialRow(idx, "description", e.target.value)
                  }
                  placeholder={
                    language === "th"
                      ? "รายละเอียดรายการ เช่น เงินมัดจำจอง"
                      : "Description (e.g. Reservation Fee)"
                  }
                  className="h-8.5 bg-white text-xs rounded-lg border-slate-200 w-full"
                />
              </div>
              <div className="col-span-2 sm:col-span-2">
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateFinancialRow(idx, "quantity", Number(e.target.value))
                  }
                  placeholder="จน."
                  className="h-8.5 bg-white text-xs text-center rounded-lg border-slate-200"
                />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <Input
                  type="number"
                  min="0"
                  value={item.unit_price}
                  onChange={(e) =>
                    updateFinancialRow(idx, "unit_price", Number(e.target.value))
                  }
                  placeholder="ราคา"
                  className="h-8.5 bg-white text-xs text-right rounded-lg border-slate-200"
                />
              </div>
              <div className="col-span-1 text-center">
                <button
                  type="button"
                  onClick={() => removeFinancialRow(idx)}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Net Payable Summary Bar */}
          <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
            <span className="text-xs font-bold text-slate-700">
              {isEn ? "Net Payable (Total):" : "ยอดรวมสุทธิ (Net Payable):"}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-blue-700">
                {calculateTotal().toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs font-semibold text-slate-500">THB</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bank Account & Transfer Slip */}
      <div className="p-5 border border-slate-200 rounded-2xl bg-white space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
            <CreditCard className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            {isEn ? "4. Bank & Payment Record" : "4. บัญชีรับโอนเงินและหลักฐานสลิป"}
          </h4>
        </div>

        {/* Payee Role Pill Selection */}
        <div className="space-y-1.5 pb-2 border-b border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <span>{isEn ? "Payee Status (Appears on blue box):" : "สถานะผู้รับเงิน (แสดงบนกล่องสีฟ้า):"}</span>
            </Label>
            {payeeRoleKey === "AGENCY" && (
              <button
                type="button"
                onClick={() =>
                  setAccountName(
                    isEn
                      ? "VC Connect Asset Co., Ltd."
                      : "บจก. วีซี คอนเนค แอสเสท",
                  )
                }
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer"
              >
                {isEn
                  ? "+ Use Company Account (VC Connect Asset Co., Ltd.)"
                  : "+ ใช้ชื่อบัญชีบริษัท (บจก. วีซี คอนเนค แอสเสท)"}
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {PAYEE_ROLE_OPTIONS.map((opt) => {
              const active = payeeRoleKey === opt.key;
              const label =
                language === "th"
                  ? opt.th
                  : language === "cn"
                    ? opt.cn
                    : language === "ru"
                      ? opt.ru
                      : opt.en;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleSelectPayeeRole(opt.key)}
                  className={cn(
                    "h-8 px-2.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer select-none",
                    active
                      ? "bg-blue-600 border-blue-600 text-white font-semibold shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <span>{opt.icon}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {payeeRoleKey === "OTHER" && (
            <div className="pt-1">
              <Input
                value={payeeRole}
                onChange={(e) => setPayeeRole(e.target.value)}
                placeholder={
                  isEn
                    ? "Specify custom payee status (e.g. Co-Owner, Juristic)"
                    : "ระบุสถานะผู้รับเงิน เช่น ญาติเจ้าของ, ผู้จัดการมรดก"
                }
                className="h-8.5 text-xs rounded-xl border-slate-200 max-w-sm"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">
              {isEn ? "Bank (Company Account) *" : "ธนาคาร *"}
            </Label>
            <Select value={selectedBankId} onValueChange={handleBankSelect}>
              <SelectTrigger className="h-9.5 rounded-xl border-slate-200">
                <SelectValue placeholder="เลือกธนาคาร" />
              </SelectTrigger>
              <SelectContent>
                {banks.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {language === "th" ? b.name_th || b.name_en : b.name_en || b.name_th}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-500">
              {isEn ? "Account No *" : "เลขที่บัญชี *"}
            </Label>
            <Input
              value={bankAccountNo}
              onChange={(e) => setBankAccountNo(e.target.value)}
              placeholder="เช่น 208-2-76313-1"
              required
              className="h-9.5 rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-500">
              {isEn ? "Account Name *" : "ชื่อบัญชี *"}
            </Label>
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="เช่น บจก. วีซี คอนเนค แอสเสท"
              required
              className="h-9.5 rounded-xl border-slate-200"
            />
          </div>
        </div>

        {/* Transfer Slip Upload */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <Label className="text-xs text-slate-500 flex items-center justify-between">
            <span>{isEn ? "Payment Transfer Slip (Optional)" : "แนบรูปภาพสลิปโอนเงิน (ถ้ามี)"}</span>
            {slipStats && (
              <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700">
                {slipStats}
              </Badge>
            )}
          </Label>

          {!slipPreview ? (
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-all">
              <Upload className="h-6 w-6 text-slate-400 mb-1" />
              <span className="text-xs font-semibold text-slate-600">
                {isProcessingSlip
                  ? "กำลังย่อขนาดภาพ..."
                  : "คลิกเพื่ออัปโหลดสลิป (รองรับรูปจากมือถือและ iPhone HEIC)"}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                ระบบจะย่อขนาดให้อัตโนมัติ เพื่อให้พิมพ์ลง 1 หน้า A4 พอดี
              </span>
              <input
                type="file"
                accept="image/*,.heic,.heif"
                onChange={handleSlipChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <img
                src={slipPreview}
                alt="Slip Preview"
                className="h-16 w-16 object-contain rounded-lg border border-slate-200 bg-white"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate">
                  {slipFile?.name || "Payment Slip"}
                </p>
                <p className="text-[10px] text-emerald-600 mt-0.5">
                  ✓ ย่อขนาดและบีบอัดพร้อมพิมพ์เรียบร้อย
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeSlip}
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 6. Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-xl h-10 px-5"
          >
            {isEn ? "Cancel" : "ยกเลิก"}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isPending || isProcessingSlip}
          className="rounded-xl h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-200 gap-2 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEn ? "Generating Document..." : "กำลังสร้างเอกสารและบันทึกดีล..."}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {isEn ? "Generate Document (A4)" : "สร้างเอกสารทันที (A4 1 หน้า)"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

