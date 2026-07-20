"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { getTemplatesAction } from "../template-actions";
import {
  getBanksAction,
  createBankAction,
  updateBankAction,
  deleteBankAction,
} from "@/features/finance/bank-actions";
import {
  generateDocumentFromTemplateAction,
  generateDocxDocumentFromTemplateAction,
  getDealDetailsAction,
  getLeadDetailsAction,
  uploadDocumentToStorageAction,
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
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { PropertyCombobox } from "@/components/PropertyCombobox";
import { LeadCombobox } from "@/components/LeadCombobox";
import { DealCombobox } from "@/features/deals/components/DealCombobox";
import { ContractFinancialsCard } from "./ContractFinancialsCard";
import { LandlordPaymentCard } from "./LandlordPaymentCard";
import { TaxCalculationsCard } from "./TaxCalculationsCard";
import { TenantOverridesCard } from "./TenantOverridesCard";

const NATIONALITY_MAP_TH_TO_EN: Record<string, string> = {
  "ไทย": "THA, Thailand",
  "จีน": "CHN, China",
  "ญี่ปุ่น": "JPN, Japan",
  "เกาหลี": "KOR, South Korea",
  "อเมริกัน": "USA, United States",
  "อังกฤษ": "GBR, United Kingdom",
  "ฝรั่งเศส": "FRA, France",
  "เยอรมัน": "DEU, Germany",
  "รัสเซีย": "RUS, Russia",
  "อินเดีย": "IND, India",
  "สิงคโปร์": "SGP, Singapore",
  "มาเลเซีย": "MYS, Malaysia",
  "พม่า": "MMR, Myanmar",
  "กัมพูชา": "KHM, Cambodia",
  "ลาว": "LAO, Laos",
  "เวียดนาม": "VNM, Vietnam",
  "ฟิลิปปินส์": "PHL, Philippines",
  "อินโดนีเซีย": "IDN, Indonesia",
  "สเปน": "ESP, Spain",
  "ไต้หวัน": "TWN, Taiwan",
  "ฮ่องกง": "HKG, Hong Kong",
  "ออสเตรเลีย": "AUS, Australia"
};

const NATIONALITY_MAP_EN_TO_TH: Record<string, string> = {
  "thai": "ไทย",
  "thailand": "ไทย",
  "tha": "ไทย",
  "tha, thailand": "ไทย",
  "chinese": "จีน",
  "china": "จีน",
  "chn": "จีน",
  "chn, china": "จีน",
  "japanese": "ญี่ปุ่น",
  "japan": "ญี่ปุ่น",
  "jpn": "ญี่ปุ่น",
  "jpn, japan": "ญี่ปุ่น",
  "korean": "เกาหลี",
  "south korea": "เกาหลี",
  "kor": "เกาหลี",
  "kor, south korea": "เกาหลี",
  "american": "อเมริกัน",
  "united states": "อเมริกัน",
  "usa": "อเมริกัน",
  "usa, united states": "อเมริกัน",
  "british": "อังกฤษ",
  "united kingdom": "อังกฤษ",
  "gbr": "อังกฤษ",
  "gbr, united kingdom": "อังกฤษ",
  "french": "ฝรั่งเศส",
  "france": "ฝรั่งเศส",
  "fra": "ฝรั่งเศส",
  "fra, france": "ฝรั่งเศส",
  "german": "เยอรมัน",
  "germany": "เยอรมัน",
  "deu": "เยอรมัน",
  "deu, germany": "เยอรมัน",
  "russian": "รัสเซีย",
  "russia": "รัสเซีย",
  "rus": "รัสเซีย",
  "rus, russia": "รัสเซีย",
  "indian": "อินเดีย",
  "india": "อินเดีย",
  "ind": "อินเดีย",
  "ind, india": "อินเดีย",
  "singaporean": "สิงคโปร์",
  "singapore": "สิงคโปร์",
  "sgp": "สิงคโปร์",
  "sgp, singapore": "สิงคโปร์",
  "malaysian": "มาเลเซีย",
  "malaysia": "มาเลเซีย",
  "mys": "มาเลเซีย",
  "mys, malaysia": "มาเลเซีย",
  "burmese": "พม่า",
  "myanmar": "พม่า",
  "mmr": "พม่า",
  "mmr, myanmar": "พม่า",
  "cambodian": "กัมพูชา",
  "cambodia": "กัมพูชา",
  "khm": "กัมพูชา",
  "khm, cambodia": "กัมพูชา",
  "laotian": "ลาว",
  "laos": "ลาว",
  "lao": "ลาว",
  "lao, laos": "ลาว",
  "vietnamese": "เวียดนาม",
  "vietnam": "เวียดนาม",
  "vnm": "เวียดนาม",
  "vnm, vietnam": "เวียดนาม",
  "filipino": "ฟิลิปปินส์",
  "philippines": "ฟิลิปปินส์",
  "phl": "ฟิลิปปินส์",
  "phl, philippines": "ฟิลิปปินส์",
  "indonesian": "อินโดนีเซีย",
  "indonesia": "อินโดนีเซีย",
  "idn": "อินโดนีเซีย",
  "idn, indonesia": "อินโดนีเซีย",
  "spanish": "สเปน",
  "spain": "สเปน",
  "esp": "สเปน",
  "esp, spain": "สเปน",
  "taiwanese": "ไต้หวัน",
  "taiwan": "ไต้หวัน",
  "twn": "ไต้หวัน",
  "twn, taiwan": "ไต้หวัน",
  "hong konger": "ฮ่องกง",
  "hong kong": "ฮ่องกง",
  "hkg": "ฮ่องกง",
  "hkg, hong kong": "ฮ่องกง",
  "australian": "ออสเตรเลีย",
  "australia": "ออสเตรเลีย",
  "aus": "ออสเตรเลีย",
  "aus, australia": "ออสเตรเลีย"
};

function translateToThai(text: string): string {
  if (!text) return "";
  let temp = text.toLowerCase();
  
  const keys = Object.keys(NATIONALITY_MAP_EN_TO_TH).sort((a, b) => b.length - a.length);
  const result: string[] = [];
  
  for (const key of keys) {
    if (temp.includes(key)) {
      result.push(NATIONALITY_MAP_EN_TO_TH[key]);
      temp = temp.replace(new RegExp(key, 'g'), '');
    }
  }
  
  const remaining = temp.split(",").map(p => p.trim()).filter(p => p && !/^[,\s]*$/.test(p));
  if (remaining.length > 0) {
    result.push(...remaining);
  }
  
  return result.join(", ");
}

function translateToEnglish(text: string): string {
  if (!text) return "";
  const parts = text.split(",").map(p => p.trim());
  const converted = parts.map(part => NATIONALITY_MAP_TH_TO_EN[part] || part);
  return converted.join(", ");
}

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
  const [selectedDealId, setSelectedDealId] = useState(
    initialOwnerType === "DEAL" || !initialOwnerType
      ? initialOwnerId || ""
      : "",
  );
  const [selectedLeadId, setSelectedLeadId] = useState(
    initialOwnerType === "LEAD" ? initialOwnerId || "" : "",
  );
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    initialOwnerType === "PROPERTY" ? initialOwnerId || "" : "",
  );
  const [isSearching, setIsSearching] = useState(false);

  const activeOwnerId =
    targetOwnerType === "DEAL"
      ? selectedDealId
      : targetOwnerType === "LEAD"
        ? selectedLeadId
        : selectedPropertyId;

  // Slip & Bank State
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");

  // Banks States
  const [banks, setBanks] = useState<
    { id: string | number; code: string; name_th: string; name_en: string }[]
  >([]);
  const [isBankSelectorOpen, setIsBankSelectorOpen] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [isManageBanksOpen, setIsManageBanksOpen] = useState(false);
  const [bankForm, setBankForm] = useState({
    id: "" as string | number,
    code: "",
    name_th: "",
    name_en: "",
  });
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [isSubmittingBank, setIsSubmittingBank] = useState(false);

  async function loadBanks() {
    try {
      const res = await getBanksAction();
      if (res.success && res.data) {
        setBanks(res.data as any);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadBanks();
  }, []);

  // New manual override fields
  const [paymentPeriod, setPaymentPeriod] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Transfer");
  const [accountName, setAccountName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientLine, setClientLine] = useState("");
  const [clientWhatsapp, setClientWhatsapp] = useState("");
  const [clientWechat, setClientWechat] = useState("");
  const [clientPassport, setClientPassport] = useState("");
  const [clientIdCard, setClientIdCard] = useState("");
  const [clientNationality, setClientNationality] = useState("");
  const [reservationFee, setReservationFee] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [bookingAmount, setBookingAmount] = useState("");
  const [showOverridePrice, setShowOverridePrice] = useState(false);
  const [contractDueDate, setContractDueDate] = useState("");
  const [unitNumberOverride, setUnitNumberOverride] = useState("");
  const [floorOverride, setFloorOverride] = useState("");
  const [dealRentalPrice, setDealRentalPrice] = useState<number | null>(null);
  const [vatRate, setVatRate] = useState("0");
  const [withholdingTaxRate, setWithholdingTaxRate] = useState("0");
  const [taxCalculationMethod, setTaxCalculationMethod] = useState("none");
  const [selectedBank, setSelectedBank] = useState<{
    name_th: string;
    name_en: string;
  } | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  const router = useRouter();
  const supabase = createClient();
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const resetForm = () => {
    setOwnerSearch("");
    setOwnerResults([]);
    setSelectedDealId(
      initialOwnerType === "DEAL" || !initialOwnerType
        ? initialOwnerId || ""
        : "",
    );
    setSelectedLeadId(initialOwnerType === "LEAD" ? initialOwnerId || "" : "");
    setSelectedPropertyId(
      initialOwnerType === "PROPERTY" ? initialOwnerId || "" : "",
    );
    setSlipFile(null);
    setSlipPreview(null);
    setBankName("");
    setSelectedBank(null);
    setBankAccountNo("");
    setBankSearchQuery("");
    setIsBankSelectorOpen(false);
    setPaymentPeriod("");
    setPaymentMethod("Transfer");
    setAccountName("");
    setClientName("");
    setClientEmail("");
    setClientLine("");
    setClientWhatsapp("");
    setClientWechat("");
    setClientPassport("");
    setClientIdCard("");
    setClientNationality("");
    setReservationFee("");
    setSecurityDeposit("");
    setBookingAmount("");
    setShowOverridePrice(false);
    setContractDueDate("");
    setUnitNumberOverride("");
    setFloorOverride("");
    setDealRentalPrice(null);
    setVatRate("0");
    setWithholdingTaxRate("0");
    setTaxCalculationMethod("none");
    setTargetOwnerType(initialOwnerType || "DEAL");
    setCustomFile(null);
    setCurrentStep(initialOwnerId ? 2 : 1);
    setTemplateDialogOpen(false);
    setPaymentMethodDialogOpen(false);
  };

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false);

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

  // Automatically translate nationality when document language changes
  useEffect(() => {
    if (!clientNationality) return;
    const targetVal = language === "th" ? translateToThai(clientNationality) : translateToEnglish(clientNationality);
    if (targetVal !== clientNationality) {
      setClientNationality(targetVal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    if (open) {
      resetForm();
      loadTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialOwnerId, initialOwnerType]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(
      async () => {
        setIsSearching(true);
        try {
          const results = await searchOwnerAction(targetOwnerType, ownerSearch);
          setOwnerResults(results);
        } catch (err) {
          console.error("Search error:", err);
        } finally {
          setIsSearching(false);
        }
      },
      ownerSearch.trim() === "" ? 0 : 500,
    ); // Immediate if empty, debounced if typing

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [ownerSearch, targetOwnerType]);

  // Sync lead/owner details when selected
  useEffect(() => {
    const fetchDetails = async () => {
      const finalId = activeOwnerId || initialOwnerId;
      if (!finalId) return;

      try {
        if (targetOwnerType === "LEAD" || initialOwnerType === "LEAD") {
          const res = await getLeadDetailsAction(finalId);
          if (res.success && res.data) {
            const data = res.data;
            setClientName(data.full_name || "");
            setClientEmail(data.email || "");
            setClientLine(data.line_id || "");
            setClientWhatsapp(data.whatsapp || "");
            setClientWechat(data.wechat_id || "");
            setClientNationality(
              data.nationality
                ? Array.isArray(data.nationality)
                  ? data.nationality.join(", ")
                  : data.nationality
                : "",
            );
            setClientIdCard(data.id_card || "");
            setClientPassport(data.passport || "");
          }
        } else if (targetOwnerType === "DEAL" || initialOwnerType === "DEAL") {
          const res = await getDealDetailsAction(finalId);
          if (res.success && res.data && res.data.lead) {
            const lead = res.data.lead;
            setClientName(lead.full_name || "");
            setClientEmail(lead.email || "");
            setClientLine(lead.line_id || "");
            setClientWhatsapp(lead.whatsapp || "");
            setClientWechat(lead.wechat_id || "");
            setClientNationality(
              lead.nationality
                ? Array.isArray(lead.nationality)
                  ? lead.nationality.join(", ")
                  : lead.nationality
                : "",
            );
            setClientIdCard(lead.id_card || "");
            setClientPassport(lead.passport || "");
          }
        }
      } catch (err) {
        console.error("Fetch lead/deal error:", err);
      }
    };
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOwnerId, initialOwnerId, targetOwnerType, initialOwnerType]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
        return;
      }

      setLoading(true);
      try {
        const { compressImage } = await import("@/lib/image-compression");
        const result = await compressImage(file, {
          maxSizeMB: 0.5, // Target size under 500KB
          maxWidthOrHeight: 1200, // Optimize width/height for readable slips
          fileType: "image/jpeg",
        });

        setSlipFile(result.compressedFile);

        const reader = new FileReader();
        reader.onloadend = () => {
          setSlipPreview(reader.result as string);
        };
        reader.readAsDataURL(result.compressedFile);

        toast.success(
          `บีบอัดรูปภาพเรียบร้อย ประหยัดพื้นที่ได้ ${result.compressionRatio.toFixed(0)}%`,
        );
      } catch (err) {
        console.error("Compression error:", err);
        setSlipFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setSlipPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setLoading(false);
      }
    }
  };

  async function handleGenerate() {
    const finalOwnerId = activeOwnerId || initialOwnerId;
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

        const formData = new FormData();
        formData.append("file", slipFile);

        const uploadRes = await uploadDocumentToStorageAction(
          formData,
          filePath,
        );
        if (!uploadRes.success) {
          throw new Error(`อัปโหลดสลิปไม่สำเร็จ: ${uploadRes.error}`);
        }

        // Record the Slip as a separate document so it can be managed (deleted)
        await createDocumentRecordAction({
          owner_id: finalOwnerId as string,
          owner_type: finalOwnerType as any,
          document_type: "SLIP", // Using the formal SLIP type
          file_name: `Slip_${fileName}`,
          storage_path: filePath,
          mime_type: slipFile.type,
          size_bytes: slipFile.size,
          version: 1,
        });

        slipUrl = filePath;
      }

      let res;
      const resolvedBankName =
        language === "th"
          ? selectedBank?.name_th || bankName
          : selectedBank?.name_en || selectedBank?.name_th || bankName;

      if (templateSource === "standard") {
        res = await generateDocumentFromTemplateAction(
          selectedTemplateId,
          finalOwnerId as string,
          finalOwnerType as any,
          {
            language: language as "th" | "en" | "cn" | "ru",
            slip_url: slipUrl,
            bank_name: resolvedBankName,
            bank_account_no: bankAccountNo,
            payment_period: paymentPeriod,
            payment_method: paymentMethod,
            account_name: accountName,
            client_name_override: clientName,
            client_email_override: clientEmail,
            client_line_override: clientLine,
            client_whatsapp_override: clientWhatsapp,
            client_wechat_override: clientWechat,
            reservation_fee: reservationFee,
            security_deposit: securityDeposit,
            booking_amount: bookingAmount,
            contract_due_date: contractDueDate,
            client_passport: clientPassport,
            client_id_card: clientIdCard,
            client_nationality: clientNationality,
            unit_number_override: unitNumberOverride,
            floor_override: floorOverride,
            vat_rate: vatRate,
            withholding_tax_rate: withholdingTaxRate,
            tax_calculation_method: taxCalculationMethod as any,
          },
        );
      } else {
        // Custom Upload DOCX
        const fileExt = customFile!.name.split(".").pop();
        const fileName = `template_${Date.now()}.${fileExt}`;
        const filePath = `temp_templates/${finalOwnerId}/${fileName}`;

        const formData = new FormData();
        formData.append("file", customFile!);

        const uploadRes = await uploadDocumentToStorageAction(
          formData,
          filePath,
        );
        if (!uploadRes.success) {
          throw new Error(`อัปโหลดไฟล์เทมเพลตไม่สำเร็จ: ${uploadRes.error}`);
        }

        res = await generateDocxDocumentFromTemplateAction(
          finalOwnerId as string,
          finalOwnerType as any,
          filePath,
          {
            language: language as "th" | "en" | "cn" | "ru",
            slip_url: slipUrl,
            bank_name: resolvedBankName,
            bank_account_no: bankAccountNo,
            payment_period: paymentPeriod,
            payment_method: paymentMethod,
            account_name: accountName,
            client_name_override: clientName,
            client_email_override: clientEmail,
            client_line_override: clientLine,
            client_whatsapp_override: clientWhatsapp,
            client_wechat_override: clientWechat,
            reservation_fee: reservationFee,
            security_deposit: securityDeposit,
            booking_amount: bookingAmount,
            contract_due_date: contractDueDate,
            client_passport: clientPassport,
            client_id_card: clientIdCard,
            client_nationality: clientNationality,
            unit_number_override: unitNumberOverride,
            floor_override: floorOverride,
            vat_rate: vatRate,
            withholding_tax_rate: withholdingTaxRate,
            tax_calculation_method: taxCalculationMethod as any,
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
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        className="sm:max-w-[800px]"
        trigger={
          trigger || (
            <Button
              variant="outline"
              size="lg"
              className="gap-2 rounded-2xl font-semibold h-12 shadow-sm border-slate-200 hover:text-blue-700 hover:bg-slate-50!"
            >
              <FileText className="h-4.5 w-4.5 text-blue-600" />
              สร้างจาก Template
            </Button>
          )
        }
        title={
          <div className="w-full">
            {/* Stepper Indicator */}
            <div className="pb-4 px-4 pt-2">
              <div className="flex items-center justify-between relative px-2">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
                {[1, 2, 3, 4, 5, 6].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "relative z-10  w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                      currentStep === s
                        ? "bg-blue-600 text-white scale-110 shadow-lg shadow-blue-200"
                        : currentStep > s
                          ? "bg-emerald-500 text-white"
                          : "bg-white border-2 border-slate-100 text-slate-400",
                    )}
                  >
                    {currentStep > s ? "✓" : s}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-center">
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider truncate",
                    currentStep >= 1 ? "text-blue-600" : "text-slate-450",
                  )}
                >
                  แหล่งข้อมูล
                </span>
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider truncate",
                    currentStep >= 2 ? "text-blue-600" : "text-slate-450",
                  )}
                >
                  ต้นแบบ
                </span>
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider  truncate",
                    currentStep >= 3 ? "text-blue-600" : "text-slate-450",
                  )}
                >
                  การชำระเงิน
                </span>
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider truncate",
                    currentStep >= 4 ? "text-blue-600" : "text-slate-450",
                  )}
                >
                  ข้อมูลผู้เช่า
                </span>
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider truncate",
                    currentStep >= 5 ? "text-blue-600" : "text-slate-450",
                  )}
                >
                  คำนวณภาษี
                </span>
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider truncate",
                    currentStep >= 6 ? "text-blue-600" : "text-slate-450",
                  )}
                >
                  ตรวจสอบ
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                  <Wand2 className="h-5 w-5" />
                </div>
                <span className="text-base font-semibold text-slate-900 tracking-tight">
                  สร้างเอกสารอัตโนมัติ
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 rounded-full text-xs font-medium text-slate-500">
                <span>
                  ขั้นตอน {currentStep} จาก {totalSteps}
                </span>
                <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
              </div>
            </div>
            {/* Progress bar in header */}
            <div className="w-full bg-slate-100 h-1 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
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
                  if (currentStep === 1 && !activeOwnerId && !initialOwnerId) {
                    toast.error("กรุณาเลือกผู้รับเอกสารก่อนไปขั้นตอนถัดไป");
                    return;
                  }
                  if (
                    currentStep === 2 &&
                    templateSource === "standard" &&
                    !selectedTemplateId
                  ) {
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
                      targetOwnerType === type
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-400",
                    )}
                    onClick={() => {
                      setTargetOwnerType(type);
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

              {targetOwnerType === "DEAL" && (
                <DealCombobox
                  value={selectedDealId || null}
                  onChange={(val, picked) => {
                    setSelectedDealId(val || "");
                    setOwnerSearch(
                      picked
                        ? `${picked.property_title || "ดีล"} (${picked.lead_name || ""})`
                        : "",
                    );
                    if (picked) {
                      const rent = picked.rental_price || null;
                      const price = picked.price || null;
                      const base = rent || price || null;
                      setDealRentalPrice(base);
                      if (base) {
                        setBookingAmount(String(base));
                        if (rent) {
                          setReservationFee(String(rent));
                          setSecurityDeposit(String(rent * 2));
                        } else {
                          setReservationFee("");
                          setSecurityDeposit("");
                        }
                      }

                      // Fetch full lead/tenant details from deal to pre-fill overrides
                      getDealDetailsAction(picked.id)
                        .then((res) => {
                          if (res.success && res.data) {
                            if (res.data.lead) {
                              setClientName(res.data.lead.full_name || "");
                              setClientEmail(res.data.lead.email || "");
                              setClientLine(res.data.lead.line_id || "");
                              setClientWhatsapp(res.data.lead.whatsapp || "");
                              setClientWechat(res.data.lead.wechat_id || "");
                              setClientNationality(
                                res.data.lead.nationality
                                  ? Array.isArray(res.data.lead.nationality)
                                    ? res.data.lead.nationality.join(", ")
                                    : res.data.lead.nationality
                                  : "",
                              );
                              setClientIdCard(res.data.lead.id_card || "");
                              setClientPassport(res.data.lead.passport || "");
                            }
                            if (res.data.property) {
                              setFloorOverride(
                                String(res.data.property.floor || ""),
                              );
                              // Try to pre-fill unit if it was set
                              if ((res.data.property as any).unit_number) {
                                setUnitNumberOverride(
                                  String(
                                    (res.data.property as any).unit_number,
                                  ),
                                );
                              }
                            }
                          }
                        })
                        .catch((err) =>
                          console.error("Error pre-filling overrides:", err),
                        );
                    } else {
                      setDealRentalPrice(null);
                      setBookingAmount("");
                      setReservationFee("");
                      setSecurityDeposit("");
                      setClientName("");
                      setClientEmail("");
                      setClientLine("");
                      setClientWhatsapp("");
                      setClientWechat("");
                      setClientPassport("");
                      setClientIdCard("");
                      setClientNationality("");
                      setFloorOverride("");
                      setUnitNumberOverride("");
                    }
                  }}
                />
              )}

              {targetOwnerType === "LEAD" && (
                <LeadCombobox
                  value={selectedLeadId || null}
                  onChangeAction={(val, picked) => {
                    setSelectedLeadId(val || "");
                    setOwnerSearch(picked ? picked.full_name : "");

                    if (picked) {
                      getLeadDetailsAction(picked.id)
                        .then((res) => {
                          if (res.success && res.data) {
                            const data = res.data;
                            setClientName(data.full_name || "");
                            setClientEmail(data.email || "");
                            setClientLine(data.line_id || "");
                            setClientWhatsapp(data.whatsapp || "");
                            setClientWechat(data.wechat_id || "");
                            setClientNationality(
                              data.nationality
                                ? Array.isArray(data.nationality)
                                  ? data.nationality.join(", ")
                                  : data.nationality
                                : "",
                            );
                            setClientIdCard(data.id_card || "");
                            setClientPassport(data.passport || "");
                          }
                        })
                        .catch((err) =>
                          console.error("Error pre-filling overrides:", err),
                        );
                    } else {
                      setClientName("");
                      setClientEmail("");
                      setClientLine("");
                      setClientWhatsapp("");
                      setClientWechat("");
                      setClientPassport("");
                      setClientIdCard("");
                      setClientNationality("");
                    }
                  }}
                />
              )}

              {targetOwnerType === "PROPERTY" && (
                <PropertyCombobox
                  value={selectedPropertyId || null}
                  onChangeAction={(val, picked) => {
                    setSelectedPropertyId(val || "");
                    setOwnerSearch(picked ? picked.title : "");
                  }}
                />
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
                  <TabsTrigger
                    value="standard"
                    className="text-xs font-semibold rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                  >
                    Standard HTML
                  </TabsTrigger>
                  <TabsTrigger
                    value="custom"
                    className="text-xs font-semibold rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                  >
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
                        className="sm:max-w-md!"
                        title="เลือกต้นแบบสัญญา"
                        description="ค้นหาและเลือกต้นแบบที่ต้องการใช้สร้างเอกสาร"
                        trigger={
                          <Button
                            variant="outline"
                            className="w-full h-12 rounded-2xl border-slate-200 bg-white font-semibold flex items-center justify-between px-4 hover:bg-slate-50!"
                            onClick={() => setTemplateDialogOpen(true)}
                          >
                            <span
                              className={
                                selectedTemplateId
                                  ? "text-slate-900"
                                  : "text-slate-400"
                              }
                            >
                              {templates.find(
                                (t) => t.id === selectedTemplateId,
                              )?.name || "เลือกต้นแบบ..."}
                            </span>
                            <Loader2
                              className={cn(
                                "h-4 w-4 animate-spin",
                                !loading && "hidden",
                              )}
                            />
                            {!loading && (
                              <FileText className="h-4 w-4 text-slate-400" />
                            )}
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
                                  : "border-slate-100 hover:border-blue-200 hover:bg-slate-50",
                              )}
                              onClick={() => {
                                setSelectedTemplateId(t.id);
                                setTemplateDialogOpen(false);

                                // Automatically adjust variables depending on the type of template selected
                                if (t.type === "RENT_RECEIPT") {
                                  // For rent receipts, set booking price to rental_price, and clear reservation fee variables
                                  if (dealRentalPrice) {
                                    setBookingAmount(String(dealRentalPrice));
                                    setReservationFee("");
                                    setSecurityDeposit("");
                                  }
                                } else if (t.type === "RESERVATION_DOCUMENT") {
                                  // For reservation forms, restore default rental price calculations
                                  if (dealRentalPrice) {
                                    setBookingAmount(String(dealRentalPrice));
                                    setReservationFee(String(dealRentalPrice));
                                    setSecurityDeposit(
                                      String(dealRentalPrice * 2),
                                    );
                                  }
                                }
                              }}
                            >
                              <div
                                className={cn(
                                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                                  selectedTemplateId === t.id
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600",
                                )}
                              >
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={cn(
                                    "font-semibold text-sm truncate",
                                    selectedTemplateId === t.id
                                      ? "text-blue-900"
                                      : "text-slate-700",
                                  )}
                                >
                                  {t.name}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                  Type: {t.type || "General"}
                                </p>
                              </div>
                              {selectedTemplateId === t.id && (
                                <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center"></div>
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
                      <div className="grid grid-cols-4 gap-2 p-1 bg-slate-100/50 rounded-2xl border border-slate-200/50">
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
                                ? "bg-white hover:bg-blue-50 text-blue-600 shadow-sm border border-slate-200"
                                : "text-slate-500 hover:bg-white/50",
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
                      onChange={(e) =>
                        setCustomFile(e.target.files?.[0] || null)
                      }
                      className="h-11 bg-white cursor-pointer rounded-xl border-blue-100 shadow-sm"
                    />

                    <div className="mt-5 p-5 bg-white rounded-2xl border border-blue-100 text-xs text-slate-600 shadow-sm">
                      <p className="font-semibold text-blue-900 mb-3 border-b border-blue-50 pb-2">
                        คู่มือการใส่ตัวแปร (Smart Tags):
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 font-mono text-[10px] p-1">
                        <li className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <span className="text-blue-700 font-semibold">
                            {"{{lead.full_name}}"}
                          </span>
                          <span className="font-sans text-slate-400 text-[9px] font-semibold">
                            ชื่อลูกค้า
                          </span>
                        </li>
                        <li className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <span className="text-blue-700 font-semibold">
                            {"{{property.name}}"}
                          </span>
                          <span className="font-sans text-slate-400 text-[9px] font-semibold">
                            ชื่อทรัพย์
                          </span>
                        </li>
                        <li className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <span className="text-blue-700 font-semibold">
                            {"{{deal.formatted_price}}"}
                          </span>
                          <span className="font-sans text-slate-400 text-[9px] font-semibold">
                            ราคาดีล
                          </span>
                        </li>
                        <li className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <span className="text-blue-700 font-semibold">
                            {"{{date.today}}"}
                          </span>
                          <span className="font-sans text-slate-400 text-[9px] font-semibold">
                            วันนี้
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          {/* Step 3: บัญชีรับเงิน & รายละเอียดสัญญา */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 max-h-[58vh] overflow-y-auto px-6 py-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LandlordPaymentCard
                  accountName={accountName}
                  setAccountName={setAccountName}
                  bankName={bankName}
                  bankAccountNo={bankAccountNo}
                  setBankAccountNo={setBankAccountNo}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  paymentPeriod={paymentPeriod}
                  setPaymentPeriod={setPaymentPeriod}
                  setIsManageBanksOpen={setIsManageBanksOpen}
                  setIsBankSelectorOpen={setIsBankSelectorOpen}
                  paymentMethodDialogOpen={paymentMethodDialogOpen}
                  setPaymentMethodDialogOpen={setPaymentMethodDialogOpen}
                />

                <ContractFinancialsCard
                  reservationFee={reservationFee}
                  setReservationFee={setReservationFee}
                  securityDeposit={securityDeposit}
                  setSecurityDeposit={setSecurityDeposit}
                  bookingAmount={bookingAmount}
                  setBookingAmount={setBookingAmount}
                  contractDueDate={contractDueDate}
                  setContractDueDate={setContractDueDate}
                  unitNumberOverride={unitNumberOverride}
                  setUnitNumberOverride={setUnitNumberOverride}
                  floorOverride={floorOverride}
                  setFloorOverride={setFloorOverride}
                  dealRentalPrice={dealRentalPrice}
                  showOverridePrice={showOverridePrice}
                  setShowOverridePrice={setShowOverridePrice}
                />
              </div>
            </div>
          )}
          {/* Step 4: ข้อมูลผู้เช่า / ผู้รับเอกสาร (Tenant Overrides) */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 max-h-[58vh] overflow-y-auto px-6 py-2">
              <TenantOverridesCard
                clientName={clientName}
                setClientName={setClientName}
                clientEmail={clientEmail}
                setClientEmail={setClientEmail}
                clientLine={clientLine}
                setClientLine={setClientLine}
                clientWhatsapp={clientWhatsapp}
                setClientWhatsapp={setClientWhatsapp}
                clientWechat={clientWechat}
                setClientWechat={setClientWechat}
                clientNationality={clientNationality}
                setClientNationality={setClientNationality}
                clientIdCard={clientIdCard}
                setClientIdCard={setClientIdCard}
                clientPassport={clientPassport}
                setClientPassport={setClientPassport}
              />
            </div>
          )}
          {/* Step 5: การคำนวณภาษี (Tax Calculations) */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 max-h-[58vh] overflow-y-auto px-6 py-2">
              <TaxCalculationsCard
                taxCalculationMethod={taxCalculationMethod}
                setTaxCalculationMethod={setTaxCalculationMethod}
                vatRate={vatRate}
                setVatRate={setVatRate}
                withholdingTaxRate={withholdingTaxRate}
                setWithholdingTaxRate={setWithholdingTaxRate}
                bookingAmount={bookingAmount}
                dealRentalPrice={dealRentalPrice}
                reservationFee={reservationFee}
                securityDeposit={securityDeposit}
                activeTemplate={activeTemplate}
              />
            </div>
          )}
          {/* Step 6: Slip & Final Review */}{" "}
          {currentStep === 6 && (
            <div className="space-y-6 px-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Slip Upload - Only for Receipt/Booking */}
              {showSlipUpload && (
                <div className="space-y-2 p-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:bg-slate-100/50">
                  <Label className="text-xs font-semibold flex items-center gap-2 mb-2 text-slate-700 uppercase tracking-wider">
                    <ImageIcon className="h-4 w-4 text-emerald-600" />
                    อัปโหลดหลักฐานการโอน (Transfer Slip)
                  </Label>
                  <div className="space-y-3">
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
                      <div className="relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50/50 p-2 w-fit">
                        <div className="h-40 w-40 relative rounded-xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                          <Image
                            src={slipPreview}
                            alt="Slip"
                            className="object-cover h-full w-full"
                            fill
                            sizes="160px"
                            unoptimized
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSlipFile(null);
                              setSlipPreview(null);
                            }}
                            className="absolute top-1.5 right-1.5 bg-slate-900/80 hover:bg-red-600 text-white p-1.5 rounded-lg shadow-sm transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className=" relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
                  <Wand2 className="h-32 w-32 text-blue-900" />
                </div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                  <p className="font-semibold text-[10px] text-blue-900 uppercase tracking-widest leading-none">
                    ระบบเตรียมข้อมูลอัตโนมัติ:
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-y-3 gap-x-6 text-[11px] text-blue-900/80 font-semibold tracking-tight">
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

      {/* Bank Selector Dialog */}
      <ResponsiveDialog
        open={isBankSelectorOpen}
        onOpenChange={setIsBankSelectorOpen}
        title="เลือกธนาคารที่รับเงิน"
        description="กรุณาค้นหาและเลือกธนาคารสำหรับรับชำระเงิน"
        className="max-w-md"
      >
        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ค้นหาชื่อหรือรหัสย่อธนาคาร..."
              value={bankSearchQuery}
              onChange={(e) => setBankSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl border-slate-200"
            />
          </div>

          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {banks
              .filter(
                (b) =>
                  b.name_th
                    .toLowerCase()
                    .includes(bankSearchQuery.toLowerCase()) ||
                  b.name_en
                    .toLowerCase()
                    .includes(bankSearchQuery.toLowerCase()) ||
                  b.code.toLowerCase().includes(bankSearchQuery.toLowerCase()),
              )
              .map((bank) => (
                <div
                  key={bank.id}
                  onClick={() => {
                    setBankName(bank.name_th);
                    setSelectedBank(bank);
                    setIsBankSelectorOpen(false);
                    setBankSearchQuery("");
                  }}
                  className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50/50 hover:border-slate-200 cursor-pointer transition-all"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-slate-800">
                      {bank.name_th}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {bank.name_en} ({bank.code})
                    </p>
                  </div>
                  {bankName === bank.name_th && (
                    <Check className="h-4 w-4 text-indigo-600 font-bold" />
                  )}
                </div>
              ))}
          </div>
        </div>
      </ResponsiveDialog>

      {/* Manage Banks Dialog */}
      <ResponsiveDialog
        open={isManageBanksOpen}
        onOpenChange={setIsManageBanksOpen}
        title="จัดการรายการธนาคาร"
        description="เพิ่ม แก้ไข หรือลบธนาคารที่แสดงในระบบเพื่อความสะดวกในการเลือกใช้งาน"
        className="max-w-md"
      >
        <div className="p-6 space-y-4">
          {/* Add / Edit Bank Form */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              {isEditingBank ? "แก้ไขธนาคาร" : "เพิ่มธนาคารใหม่"}
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-slate-500">
                  รหัสย่อ
                </Label>
                <Input
                  placeholder="เช่น KBANK"
                  value={bankForm.code}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, code: e.target.value })
                  }
                  className="h-9 text-xs rounded-lg border-slate-200 bg-white"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-[10px] font-semibold text-slate-500">
                  ชื่อภาษาไทย
                </Label>
                <Input
                  placeholder="เช่น ธนาคารกสิกรไทย"
                  value={bankForm.name_th}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, name_th: e.target.value })
                  }
                  className="h-9 text-xs rounded-lg border-slate-200 bg-white"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-slate-500">
                ชื่อภาษาอังกฤษ
              </Label>
              <Input
                placeholder="เช่น Kasikornbank"
                value={bankForm.name_en}
                onChange={(e) =>
                  setBankForm({ ...bankForm, name_en: e.target.value })
                }
                className="h-9 text-xs rounded-lg border-slate-200 bg-white"
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              {isEditingBank && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditingBank(false);
                    setBankForm({ id: "", code: "", name_th: "", name_en: "" });
                  }}
                  className="h-8 text-xs text-slate-500"
                >
                  ยกเลิก
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={async () => {
                  if (
                    !bankForm.code ||
                    !bankForm.name_th ||
                    !bankForm.name_en
                  ) {
                    toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
                    return;
                  }
                  setIsSubmittingBank(true);
                  try {
                    if (isEditingBank) {
                      const res = await updateBankAction(bankForm.id, {
                        code: bankForm.code,
                        name_th: bankForm.name_th,
                        name_en: bankForm.name_en,
                      });
                      if (res.success) {
                        toast.success("แก้ไขข้อมูลธนาคารสำเร็จ");
                        setIsEditingBank(false);
                        setBankForm({
                          id: "",
                          code: "",
                          name_th: "",
                          name_en: "",
                        });
                        loadBanks();
                      } else {
                        toast.error(res.error || "เกิดข้อผิดพลาด");
                      }
                    } else {
                      const res = await createBankAction({
                        code: bankForm.code,
                        name_th: bankForm.name_th,
                        name_en: bankForm.name_en,
                      });
                      if (res.success) {
                        toast.success("เพิ่มธนาคารสำเร็จ");
                        setBankForm({
                          id: "",
                          code: "",
                          name_th: "",
                          name_en: "",
                        });
                        loadBanks();
                      } else {
                        toast.error(res.error || "เกิดข้อผิดพลาด");
                      }
                    }
                  } catch (err) {
                    toast.error("เกิดข้อผิดพลาด");
                  } finally {
                    setIsSubmittingBank(false);
                  }
                }}
                disabled={isSubmittingBank}
                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3"
              >
                {isSubmittingBank ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isEditingBank ? (
                  "บันทึก"
                ) : (
                  "เพิ่ม"
                )}
              </Button>
            </div>
          </div>

          {/* Banks List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
              รายการทั้งหมด
            </h4>
            {banks.map((bank) => (
              <div
                key={bank.id}
                className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-lg hover:border-slate-200 transition-colors"
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-800">
                    {bank.name_th}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {bank.name_en} ({bank.code})
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsEditingBank(true);
                      setBankForm({
                        id: bank.id,
                        code: bank.code,
                        name_th: bank.name_th,
                        name_en: bank.name_en,
                      });
                    }}
                    className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      if (confirm(`ยืนยันการลบธนาคาร ${bank.name_th}?`)) {
                        try {
                          const res = await deleteBankAction(bank.id);
                          if (res.success) {
                            toast.success("ลบธนาคารสำเร็จ");
                            loadBanks();
                          } else {
                            toast.error(res.error || "เกิดข้อผิดพลาด");
                          }
                        } catch (err) {
                          toast.error("เกิดข้อผิดพลาด");
                        }
                      }
                    }}
                    className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-slate-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ResponsiveDialog>
    </>
  );
}
