"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  profileSchema,
  type ProfileFormValues,
} from "../../lib/profile-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, Signature } from "lucide-react";
import imageCompression from "browser-image-compression";
import {
  updateProfileAction,
  uploadSignatureAction,
  testLineNotificationAction,
} from "./actions";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { toast } from "sonner";
import {
  Loader2,
  User,
  Phone,
  MessageCircle,
  Facebook,
  MessageSquare,
  Globe,
  AtSign,
  ShieldCheck,
  CheckCircle2,
  Send,
  ChevronDown,
  Search,
} from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FaFacebook, FaLine, FaTelegram, FaWhatsapp } from "react-icons/fa6";
import { IoLogoWechat } from "react-icons/io5";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { AlertCircle } from "lucide-react";
import { getBanksAction } from "../finance/bank-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProfileInfoFormProps {
  fullName: string | null;
  nickname?: string | null;
  avatar_url?: string | null;
  signature_url?: string | null;
  phone: string | null;
  line_id: string | null;
  line_user_id: string | null;
  facebook_url: string | null;
  whatsapp_id: string | null;
  wechat_id: string | null;
  email: string | null;
  role: string | null;
  tax_id: string | null;
  tax_address: string | null;
  bank_code?: string | null;
  bank_account_no?: string | null;
  bank_account_name?: string | null;
  other_bank_name?: string | null;
  telegram_id: string | null;
  wechat_user_id?: string | null;
  whatsapp_user_id?: string | null;
  bio_th?: string | null;
  bio_en?: string | null;
  position_th?: string | null;
  position_en?: string | null;
  score: number;
}

export function ProfileInfoForm({
  fullName,
  nickname,
  avatar_url: initialAvatarUrl,
  signature_url: initialSignatureUrl,
  phone,
  line_id,
  line_user_id,
  facebook_url,
  whatsapp_id,
  wechat_id,
  email,
  role,
  tax_id,
  tax_address,
  bank_code,
  bank_account_no,
  bank_account_name,
  other_bank_name,
  telegram_id,
  wechat_user_id,
  whatsapp_user_id,
  bio_th,
  bio_en,
  position_th,
  position_en,
  score,
}: ProfileInfoFormProps) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isEn = language === "en";
  const [isLoading, setIsLoading] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      full_name: fullName || "",
      nickname: nickname || "",
      avatar_url: initialAvatarUrl || "",
      phone: phone || "",
      line_id: line_id || "",
      line_user_id: line_user_id || "",
      facebook_url: facebook_url || "",
      whatsapp_id: whatsapp_id || "",
      wechat_id: wechat_id || "",
      tax_id: tax_id || "",
      tax_address: tax_address || "",
      bank_code: bank_code || "",
      bank_account_no: bank_account_no || "",
      bank_account_name: bank_account_name || "",
      other_bank_name: other_bank_name || "",
      telegram_id: telegram_id || "",
      wechat_user_id: wechat_user_id || "",
      whatsapp_user_id: whatsapp_user_id || "",
      bio_th: bio_th || "",
      bio_en: bio_en || "",
      position_th: position_th || "",
      position_en: position_en || "",
    },
  });

  const [banks, setBanks] = useState<any[]>([]);
  const [isBankPickerOpen, setIsBankPickerOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [signatureUrl, setSignatureUrl] = useState<string | null>(
    initialSignatureUrl || null,
  );
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [isTestingLine, setIsTestingLine] = useState(false);

  const handleTestLineNotification = async (lineUserId: string) => {
    if (!lineUserId || !lineUserId.trim()) {
      toast.error(isEn ? "Please enter LINE User ID before testing." : "กรุณาระบุรหัสไอดีผู้ใช้ไลน์ (LINE User ID) ก่อนทำการทดสอบ");
      return;
    }
    setIsTestingLine(true);
    try {
      const result = await testLineNotificationAction(lineUserId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message || (isEn ? "Failed to send test message" : "เกิดข้อผิดพลาดในการส่งข้อความทดสอบ"));
      }
    } catch (error: any) {
      console.error(error);
      toast.error(isEn ? "Failed to send test message" : "เกิดข้อผิดพลาดในการส่งข้อความทดสอบ");
    } finally {
      setIsTestingLine(false);
    }
  };

  const handleSignatureUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingSignature(true);
    try {
      // Image Compression Logic
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      const formData = new FormData();
      formData.append("file", compressedFile);
      const result = await uploadSignatureAction(formData);
      setSignatureUrl(result.publicUrl);
      toast.success(isEn ? "Signature uploaded and compressed successfully" : "อัปโหลดลายเซ็นสำเร็จ (บีบอัดเรียบร้อย)");
    } catch (error) {
      console.error(error);
      toast.error(isEn ? "Failed to upload signature" : "อัปโหลดลายเซ็นไม่สำเร็จ");
    } finally {
      setIsUploadingSignature(false);
    }
  };

  useEffect(() => {
    async function fetchBanks() {
      const res = await getBanksAction();
      if (res.success) setBanks(res.data || []);
    }
    fetchBanks();
  }, []);

  const isDirty = form.formState.isDirty;

  // 1. Browser Level Protection (Tab Close/Refresh)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // 2. Internal Link Protection (Next.js Navigation)
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      if (!isDirty) return;

      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      // Skip if external, hash, or no href
      if (
        !href ||
        href.startsWith("http") ||
        href.startsWith("#") ||
        target.target === "_blank"
      )
        return;

      e.preventDefault();
      e.stopPropagation();
      setPendingUrl(href);
      setShowLeaveDialog(true);
    };

    document.addEventListener("click", handleAnchorClick, true);
    return () => document.removeEventListener("click", handleAnchorClick, true);
  }, [isDirty]);

  const confirmLeave = () => {
    setShowLeaveDialog(false);
    if (pendingUrl) {
      router.push(pendingUrl);
    }
  };

  const onSubmit: SubmitHandler<ProfileFormValues> = async (values) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("full_name", values.full_name);
      if (values.nickname) formData.append("nickname", values.nickname);
      if (values.phone) formData.append("phone", values.phone);
      if (values.line_id) formData.append("line_id", values.line_id);
      if (values.line_user_id)
        formData.append("line_user_id", values.line_user_id);
      if (values.facebook_url)
        formData.append("facebook_url", values.facebook_url);
      if (values.whatsapp_id)
        formData.append("whatsapp_id", values.whatsapp_id);
      if (values.wechat_id) formData.append("wechat_id", values.wechat_id);
      if (values.tax_id) formData.append("tax_id", values.tax_id);
      if (values.tax_address)
        formData.append("tax_address", values.tax_address);
      if (values.bank_code) formData.append("bank_code", values.bank_code);
      if (values.bank_account_no)
        formData.append("bank_account_no", values.bank_account_no);
      if (values.bank_account_name)
        formData.append("bank_account_name", values.bank_account_name);
      if (values.telegram_id)
        formData.append("telegram_id", values.telegram_id);

      // Sync WeChat: Map single UI field to both Legacy and V3 for consistency
      if (values.wechat_user_id) {
        formData.append("wechat_id", values.wechat_user_id);
        formData.append("wechat_user_id", values.wechat_user_id);
      }

      // Sync WhatsApp: Map single UI field to both Legacy and V3
      if (values.whatsapp_user_id) {
        formData.append("whatsapp_id", values.whatsapp_user_id);
        formData.append("whatsapp_user_id", values.whatsapp_user_id);
      }

      // New V3 Branding Fields
      if (values.avatar_url) formData.append("avatar_url", values.avatar_url);
      if (values.bio_th) formData.append("bio_th", values.bio_th);
      if (values.bio_en) formData.append("bio_en", values.bio_en);
      if (values.position_th)
        formData.append("position_th", values.position_th);
      if (values.position_en)
        formData.append("position_en", values.position_en);

      const result = await updateProfileAction(formData);

      if (result.success) {
        toast.success("บันทึกข้อมูลโปรไฟล์สำเร็จ");
        form.reset(values); // Reset dirty state with new values
        router.refresh(); // Update server component data
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl shadow-slate-200/40 overflow-hidden">
      {/* Dynamic Card Header */}
      <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            ข้อมูลส่วนตัวเชิงธุรกิจ
          </h3>
          <p className="text-sm text-slate-500 font-medium whitespace-nowrap">
            Business Identity & Contact Details
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {isDirty ? (
              <m.div
                key="editing"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full border border-amber-100 shadow-sm"
              >
                <m.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                </m.div>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  กำลังแก้ไข... โปรดบันทึก
                </span>
              </m.div>
            ) : score >= 100 ? (
              <m.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Complete
                </span>
              </m.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-8">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              onSubmit(data as ProfileFormValues),
            )}
            className="space-y-10"
          >
            {/* Section 1: Basic Information */}
            <section className="space-y-5">
              <div className="flex flex-col gap-1 pl-4 border-l-2 border-blue-500/50">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  ข้อมูลพื้นฐาน
                </h3>
                <p className="text-xs text-slate-400">
                  ชื่อและข้อมูลติดต่อเบื้องต้นของคุณ
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex flex-col gap-0">
                        <FormLabel className="text-[13px] font-medium text-slate-600">
                          ชื่อ-นามสกุล
                        </FormLabel>
                        <FormDescription className="text-[11px] text-slate-400">
                          ชื่อ-นามสกุลจริงสำหรับใช้ในเอกสารสำคัญ
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="ระบุชื่อจริงและนามสกุล..."
                            className="pl-10.5 pr-10 h-11 rounded-xl border-slate-200 focus-visible:ring-blue-500/20 shadow-none text-base font-normal transition-all"
                            {...field}
                          />
                          <AnimatePresence>
                            {field.value && (
                              <m.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                              >
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              </m.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex flex-col gap-0">
                        <FormLabel className="text-[13px] font-medium text-slate-600">
                          ชื่อเล่น (Nickname)
                        </FormLabel>
                        <FormDescription className="text-[11px] text-slate-400">
                          ชื่อเรียกสั้นๆ ในทีม (เช่น คุณเอ, พี่บี)
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="ระบุชื่อเล่น..."
                            className="h-11 rounded-xl border-slate-200 focus-visible:ring-blue-500/20 shadow-none text-base font-normal transition-all"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex flex-col gap-0">
                        <FormLabel className="text-[13px] font-medium text-slate-600">
                          เบอร์โทรศัพท์
                        </FormLabel>
                        <FormDescription className="text-[11px] text-slate-400">
                          เบอร์โทรศัพท์มือถือที่ติดต่อได้สะดวกที่สุด
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                          <Input
                            placeholder="0xx-xxx-xxxx"
                            className="pl-10.5 pr-10 h-11 rounded-xl border-slate-200 focus-visible:ring-blue-500/20 shadow-none font-normal text-base transition-all"
                            {...field}
                          />
                          <AnimatePresence>
                            {field.value && (
                              <m.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                              >
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              </m.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Section 2: Social Media & Communication */}
            <section className="space-y-5">
              <div className="flex flex-col gap-1 pl-4 border-l-2 border-emerald-500/50">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  ช่องทางการติดต่อโซเชียล
                </h3>
                <p className="text-xs text-slate-400">
                  ระบุไอดีโซเชียลเพื่อความสะดวกในการประสานงาน
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                <FormField
                  control={form.control}
                  name="line_id"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex flex-col gap-1">
                        <FormLabel className="text-[13px] font-medium text-slate-600">
                          ไลน์ ไอดี
                        </FormLabel>
                        <FormDescription className="text-[11px] text-slate-400">
                          ไอดีไลน์สำหรับให้ลูกค้าหรือทีมงานค้นหาเจอ
                        </FormDescription>
                      </div>
                      <FormControl>
                        {/* 1. ใส่ flex และ items-center ที่กล่องครอบหลัก */}
                        <div className="relative flex items-center w-full">
                          {/* 2. ไอคอนฝั่งซ้าย (ใส่ pointer-events-none เพื่อให้คลิกทะลุไปโดน Input ได้) */}
                          <div className="absolute left-4 flex items-center justify-center pointer-events-none">
                            <FaLine className="h-4 w-4 text-[#00B900]" />
                          </div>

                          <Input
                            placeholder="ใส่ ID Line..."
                            className="pl-14 pr-12 h-11 w-full rounded-xl border-emerald-200/60 bg-[#F5F8F9] focus-visible:ring-emerald-500/30 text-[17px] font-medium text-slate-700 shadow-none transition-all"
                            {...field}
                          />

                          {/* 3. ไอคอนเครื่องหมายถูกฝั่งขวา */}
                          <AnimatePresence>
                            {field.value && (
                              <m.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="absolute right-4 flex items-center justify-center pointer-events-none"
                              >
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                              </m.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="line_user_id"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <FormLabel className="text-[13px] font-medium text-slate-600">
                            รหัสไอดีผู้ใช้ไลน์ (สำหรับบอท)
                          </FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-3.5 h-3.5 text-slate-300 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs p-3 rounded-xl bg-slate-900 text-white border-none shadow-xl">
                                <p className="text-xs leading-relaxed font-medium">
                                  ไอดีเฉพาะของแต่ละบัญชีไลน์ (ขึ้นต้นด้วย U...)
                                  ใช้สำหรับรับการแจ้งเตือนจากระบบ VCC
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormDescription className="text-[11px] text-slate-400">
                          ไอดีสำหรับรับการแจ้งเตือนส่วนตัวจากระบบ (Webhook ID)
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                          <Input
                            placeholder="Uxxxxxxxxxxxxxxx..."
                            className="pl-10.5 pr-10 h-11 rounded-xl border-slate-200 focus-visible:ring-blue-500/20 font-normal  shadow-none transition-all"
                            {...field}
                          />
                          <AnimatePresence>
                            {field.value && (
                              <m.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                              >
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              </m.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </FormControl>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400">
                          *โปรดบันทึกโปรไฟล์ก่อนทดสอบ หรือใส่ ID
                          แล้วกดทดสอบยิงได้ทันที
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!field.value || isTestingLine}
                          onClick={() =>
                            handleTestLineNotification(field.value || "")
                          }
                          className="h-8 px-3 rounded-lg border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                        >
                          {isTestingLine ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          ทดลองยิง LINE
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="facebook_url"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex flex-col gap-0">
                        <FormLabel className="text-[13px] font-medium text-slate-600">
                          เฟซบุ๊กโปรไฟล์
                        </FormLabel>
                        <FormDescription className="text-[11px] text-slate-400">
                          ลิงก์ไปยังหน้าโปรไฟล์เฟซบุ๊กสำหรับอ้างอิง
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <FaFacebook className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                          <Input
                            placeholder="https://facebook.com/..."
                            className="pl-10.5 pr-10 h-11 rounded-xl border-blue-50 focus-visible:ring-blue-500/20 font-normal shadow-none transition-all"
                            {...field}
                          />
                          <AnimatePresence>
                            {field.value && (
                              <m.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                              >
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              </m.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whatsapp_user_id"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex flex-col gap-0">
                        <FormLabel className="text-[13px] font-medium text-slate-600">
                          วอทส์แอป (WhatsApp ID)
                        </FormLabel>
                        <FormDescription className="text-[11px] text-slate-400">
                          ระบุเบอร์โทรหรือ ID สำหรับปุ่มติดต่อ WhatsApp (เช่น
                          66xxxxxxxx)
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <FaWhatsapp className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                          <Input
                            placeholder="ระบุ WhatsApp ID..."
                            className="pl-10.5 pr-10 h-11 rounded-xl border-emerald-100/50 focus-visible:ring-emerald-500/20 font-normal shadow-none transition-all"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wechat_user_id"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex flex-col gap-0">
                        <FormLabel className="text-[13px] font-medium text-slate-600">
                          {isEn ? "WeChat ID" : "วีแชต (WeChat ID)"}
                        </FormLabel>
                        <FormDescription className="text-[11px] text-slate-400">
                          {isEn ? "WeChat ID for display and client lookup" : "ไอดี WeChat สำหรับแสดงผลและให้ลูกค้าค้นหา"}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <IoLogoWechat className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                          <Input
                            placeholder={isEn ? "Enter WeChat ID..." : "ระบุ WeChat ID..."}
                            className="pl-10.5 pr-10 h-11 rounded-xl border-emerald-100/50 focus-visible:ring-emerald-500/20 font-normal shadow-none transition-all"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telegram_id"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <FormLabel className="text-[13px] font-medium text-slate-600">
                            {isEn ? "Telegram ID" : "เทเลแกรม ไอดี (telegram id)"}
                          </FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-3.5 h-3.5 text-slate-300 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm p-3 rounded-xl bg-slate-900 text-white border-none">
                                <p className="text-xs leading-relaxed font-medium">
                                  {isEn
                                    ? "Used for connecting back-office notifications and property checks."
                                    : "ใช้สำหรับเชื่อมต่อระบบ Back-office เพื่อรับแจ้งเตือนและเช็คข้อมูลทรัพย์สิน"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center justify-between gap-2 overflow-hidden">
                          <FormDescription className="text-[11px] text-slate-400 truncate">
                            {isEn ? "Telegram User ID for alert notifications" : "เลขไอดี Telegram เพื่อรับการแจ้งเตือน"}
                          </FormDescription>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-slate-300 font-medium">
                              {isEn ? "Find ID:" : "หา ID:"}
                            </span>
                            <a
                              href="https://t.me/userinfobot"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-600 font-bold hover:underline text-[10px]"
                            >
                              @userinfobot
                            </a>
                          </div>
                        </div>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <FaTelegram className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-500" />
                          <Input
                            placeholder={isEn ? "e.g. 123456789..." : "เช่น 123456789..."}
                            className="pl-10.5 pr-10 h-11 rounded-xl border-sky-100/50 focus-visible:ring-sky-500/20 font-normal shadow-none transition-all"
                            {...field}
                          />
                          <AnimatePresence>
                            {field.value && (
                              <m.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                              >
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              </m.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Section 3: Accounting & Tax */}
            <section className="space-y-5">
              <div className="flex flex-col gap-1 pl-4 border-l-2 border-indigo-500/50">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {isEn ? "Accounting & Tax Information" : "ข้อมูลบัญชีและภาษี"}
                </h3>
                <p className="text-xs text-slate-400">
                  {isEn ? "Essential details for disbursements and tax documents" : "ข้อมูลสำคัญสำหรับการเบิกจ่ายและเอกสารทางภาษี"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="tax_id"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex flex-col gap-0">
                        <FormLabel className="text-[13px] font-medium text-slate-600">
                          {isEn ? "National ID / Tax ID" : "เลขบัตรประชาชน/เลขผู้เสียภาษี"}
                        </FormLabel>
                        <FormDescription className="text-[10px] text-slate-400 italic">
                          {isEn
                            ? "⚠️ 13-digit Tax ID for transactions and legal documents"
                            : "⚠️ เลขประจำตัวผู้เสียภาษี 13 หลัก สำหรับทำธุรกรรมและออกเอกสาร"}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                          <Input
                            placeholder={isEn ? "13-digit ID..." : "เลข 13 หลัก..."}
                            className="pl-10.5 pr-10 h-11 rounded-xl border-emerald-50 focus-visible:ring-emerald-500/20 font-normal text-base shadow-none transition-all"
                            {...field}
                          />
                          <AnimatePresence>
                            {field.value && (
                              <m.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                              >
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              </m.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bank_code"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex flex-col gap-0">
                        <FormLabel className="text-[13px] font-medium text-slate-600">
                          {isEn ? "Receiving Bank" : "ธนาคารที่รับเงิน"}
                        </FormLabel>
                        <FormDescription className="text-[11px] text-slate-400">
                          {isEn ? "Select standard bank or choose 'Other' if not listed" : "เลือกธนาคารมาตรฐาน หรือเลือก \"อื่นๆ\" หากไม่มีในรายการ"}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="space-y-3">
                          <ResponsiveDialog
                            open={isBankPickerOpen}
                            className="sm:max-w-md!"
                            onOpenChange={setIsBankPickerOpen}
                            title={isEn ? "Select Bank" : "เลือกธนาคาร"}
                            trigger={
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-between h-11 rounded-xl border-indigo-50 focus:ring-indigo-500/20 font-normal shadow-none transition-all px-3.5 cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4 text-indigo-500" />
                                  <span className="truncate">
                                    {field.value
                                      ? (isEn
                                          ? banks.find((b) => b.code === field.value)?.name_en || banks.find((b) => b.code === field.value)?.name_th || field.value
                                          : banks.find((b) => b.code === field.value)?.name_th || field.value)
                                      : (isEn ? "Select Bank..." : "เลือกธนาคาร...")}
                                  </span>
                                </div>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                              </Button>
                            }
                          >
                            <div className="flex flex-col h-full max-h-[60vh]">
                              <div className="p-4 border-b border-slate-50">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                  <Input
                                    placeholder={isEn ? "Search bank name..." : "ค้นหาชื่อธนาคาร..."}
                                    value={bankSearch}
                                    onChange={(e) =>
                                      setBankSearch(e.target.value)
                                    }
                                    className="pl-9 h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-500/20"
                                  />
                                </div>
                              </div>
                              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                <div className="grid grid-cols-1 gap-1">
                                  {banks
                                    .filter(
                                      (b) =>
                                        (b.name_th && b.name_th.toLowerCase().includes(bankSearch.toLowerCase())) ||
                                        (b.name_en && b.name_en.toLowerCase().includes(bankSearch.toLowerCase())) ||
                                        b.code.toLowerCase().includes(bankSearch.toLowerCase()),
                                    )
                                    .map((bank) => (
                                      <button
                                        key={bank.code}
                                        type="button"
                                        onClick={() => {
                                          field.onChange(bank.code);
                                          setIsBankPickerOpen(false);
                                          if (bank.code !== "OTHER") {
                                            form.setValue(
                                              "other_bank_name",
                                              "",
                                            );
                                          }
                                        }}
                                        className={cn(
                                          "flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 transition-colors text-left group cursor-pointer",
                                          field.value === bank.code &&
                                            "bg-indigo-50/50 ring-1 ring-indigo-100",
                                        )}
                                      >
                                        <div className="flex flex-col">
                                          <span
                                            className={cn(
                                              "text-sm font-bold text-slate-700",
                                              field.value === bank.code &&
                                                "text-indigo-600",
                                            )}
                                          >
                                            {isEn && bank.name_en ? bank.name_en : bank.name_th}
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-mono uppercase">
                                            {bank.code}
                                          </span>
                                        </div>
                                        {field.value === bank.code && (
                                          <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                                        )}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            </div>
                          </ResponsiveDialog>

                          {/* Conditional "Other Bank Name" Field */}
                          <AnimatePresence>
                            {field.value === "OTHER" && (
                              <m.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <FormField
                                  control={form.control}
                                  name="other_bank_name"
                                  render={({ field: otherField }) => (
                                    <FormItem className="pt-1">
                                      <FormControl>
                                        <Input
                                          {...otherField}
                                          placeholder={isEn ? "Enter your bank name..." : "ระบุชื่อธนาคารของคุณ..."}
                                          className="h-11 rounded-xl border-orange-100 bg-orange-50/30 focus-visible:ring-orange-500/20 font-medium"
                                        />
                                      </FormControl>
                                      <FormDescription className="text-[10px] text-orange-600 font-medium px-1">
                                        {isEn ? "Please enter a clear bank name to avoid disbursement errors" : "โปรดระบุชื่อธนาคารให้ชัดเจนเพื่อป้องกันความผิดพลาด"}
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </m.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bank_account_no"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex flex-col gap-0">
                        <FormLabel className="text-[13px] font-medium text-slate-600">
                          {isEn ? "Account Number (Digits only)" : "เลขที่บัญชี (เฉพาะตัวเลข)"}
                        </FormLabel>
                        <FormDescription className="text-[11px] text-slate-400">
                          {isEn ? "Enter 10-12 digits without hyphens" : "ระบุเฉพาะตัวเลข 10-12 หลัก โดยไม่ต้องใส่ขีด"}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder={isEn ? "e.g. 1234567890" : "เช่น 1234567890"}
                            className="pl-10.5 pr-10 h-11 rounded-xl border-slate-200 focus-visible:ring-blue-500/20 font-mono font-bold tracking-wider shadow-none transition-all"
                            {...field}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, "");
                              field.onChange(val);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bank_account_name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex flex-col gap-0">
                        <FormLabel className="text-[13px] font-medium text-slate-600">
                          {isEn ? "Bank Account Name" : "ชื่อบัญชีธนาคาร"}
                        </FormLabel>
                        <FormDescription className="text-[11px] text-slate-400">
                          {isEn ? "Full name as shown on bank book/account" : "ชื่อ-นามสกุลที่ปรากฏในบัญชีธนาคาร"}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder={isEn ? "Enter account name..." : "ระบุชื่อบัญชี..."}
                            className="pl-10.5 pr-10 h-11 rounded-xl border-slate-200 focus-visible:ring-blue-500/20 font-normal shadow-none transition-all"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tax_address"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <div className="flex flex-col gap-0">
                      <FormLabel className="text-[13px] font-medium text-slate-600">
                        {isEn ? "Tax Invoice Address" : "ที่อยู่ออกเอกสารภาษี"}
                      </FormLabel>
                      <FormDescription className="text-[11px] text-slate-400">
                        {isEn ? "Registered address for tax invoices and transactions" : "ที่อยู่จดทะเบียนสำหรับทำธุรกรรมและออกเอกสารภาษี"}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-4 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder={isEn ? "Enter registered address according to official ID/registration..." : "ระบุที่อยู่ตามทะเบียนบ้าน หรือที่อยู่จดทะเบียน..."}
                          className="pl-10.5 pr-10 h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500/20 font-normal shadow-none transition-all"
                          {...field}
                        />
                        <AnimatePresence>
                          {field.value && (
                            <m.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2"
                            >
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            </m.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* Section 4: Digital Signature */}
            <section className="space-y-5">
              <div className="flex flex-col gap-1 pl-4 border-l-2 border-amber-500/50">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {isEn ? "Digital Signature" : "ลายเซ็นดิจิทัล (Digital Signature)"}
                </h3>
                <p className="text-xs text-slate-400">
                  {isEn ? "Used for automated stamp on contracts and booking documents" : "สำหรับใช้ประทับตราในเอกสารสัญญาและใบจองอัตโนมัติ"}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100 flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-full md:w-64 h-32 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group">
                  {signatureUrl ? (
                    <>
                      <Image
                        src={signatureUrl}
                        alt="Signature"
                        className="max-w-full max-h-full object-contain p-2"
                        fill
                        sizes="(max-width: 768px) 100vw, 256px"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-xl">
                          {isEn ? "Change Signature" : "เปลี่ยนลายเซ็น"}
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleSignatureUpload}
                          />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-400 hover:text-blue-500 transition-colors">
                      <Signature className="h-8 w-8" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {isEn ? "Upload Signature" : "อัปโหลดลายเซ็น"}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                      />
                    </label>
                  )}

                  {isUploadingSignature && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    {isEn ? "Usage Recommendations" : "ข้อแนะนำการใช้งาน"}
                  </h4>
                  <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4 font-medium">
                    <li>
                      {isEn
                        ? "Use signature image with transparent background (Transparent PNG)"
                        : "ควรใช้รูปภาพลายเซ็นที่มีพื้นหลังโปร่งใส (Transparent PNG)"}
                    </li>
                    <li>
                      {isEn
                        ? "Sign with black or dark blue pen on clean white paper"
                        : "เซ็นด้วยปากกาสีดำหรือน้ำเงินเข้มบนกระดาษขาวสะอาด"}
                    </li>
                    <li>
                      {isEn
                        ? "Clear high-contrast images enhance professionalism on generated contracts"
                        : "ภาพที่ชัดเจนจะช่วยให้เอกสารสัญญาดูเป็นมืออาชีพมากขึ้น"}
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Read-only Auth Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6 border-t border-slate-100">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                  {isEn ? "Login Email" : "อีเมลล็อกอิน"}
                </Label>
                <div className="relative">
                  <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input
                    value={email || ""}
                    disabled
                    className="pl-10.5 h-11 bg-slate-50/50 border-slate-100 text-slate-500 cursor-not-allowed font-normal rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                  {isEn ? "Current Role" : "บทบาทปัจจุบัน"}
                </Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input
                    value={role || "AGENT"}
                    disabled
                    className="pl-10.5 h-11 bg-slate-50/50 border-slate-100 text-slate-500 cursor-not-allowed uppercase font-normal rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className={cn(
                  "w-full h-12 transition-all duration-300 font-bold text-sm rounded-xl relative overflow-hidden group shadow-none cursor-pointer",
                  form.formState.isDirty
                    ? "bg-linear-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white duration-300 transition-all hover:scale-[1.005] active:scale-[0.98] shadow-lg shadow-blue-500/20"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed",
                )}
                disabled={
                  isLoading ||
                  !form.formState.isValid ||
                  !form.formState.isDirty
                }
              >
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <m.div
                      key="loading"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isEn ? "Updating..." : "กำลังอัปเดต..."}</span>
                    </m.div>
                  ) : (
                    <m.div
                      key="idle"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2
                        className={cn(
                          "h-4 w-4",
                          form.formState.isDirty
                            ? "text-emerald-300"
                            : "text-slate-400",
                        )}
                      />
                      <span>{isEn ? "Save Changes" : "บันทึกการเปลี่ยนแปลง"}</span>
                    </m.div>
                  )}
                </AnimatePresence>
              </Button>

              {form.formState.isDirty && !isLoading && (
                <m.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] text-center mt-3 text-amber-600 font-bold uppercase tracking-tight"
                >
                  {isEn ? "⚠️ You have unsaved changes" : "⚠️ มีการแก้ไขที่ยังไม่ได้บันทึก"}
                </m.p>
              )}
            </div>
          </form>
        </Form>
      </div>

      {/* Leave Confirmation Dialog */}
      <ResponsiveDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        title={isEn ? "Unsaved Changes" : "ยังไม่ได้บันทึกข้อมูล"}
        description={
          isEn
            ? "You have unsaved changes. If you leave this page, your edits will be lost. Are you sure you want to leave?"
            : "คุณมีการแก้ไขข้อมูลที่ยังไม่ได้บันทึก หากออกจากหน้านี้ข้อมูลที่แก้ไขจะสูญหาย คุณต้องการยืนยันที่จะออกจากหน้านี้ใช่หรือไม่?"
        }
        className="max-w-sm!"
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1 rounded-xl cursor-pointer"
              onClick={() => setShowLeaveDialog(false)}
            >
              {isEn ? "Keep Editing" : "แก้ไขต่อ"}
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 cursor-pointer"
              onClick={confirmLeave}
            >
              {isEn ? "Leave Page" : "ออกจากหน้านี้"}
            </Button>
          </div>
        }
      />
    </div>
  );
}
