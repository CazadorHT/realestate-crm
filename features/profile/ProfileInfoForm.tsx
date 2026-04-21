"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileFormValues } from "@/lib/profile-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import { updateProfileAction } from "./actions";
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

interface ProfileInfoFormProps {
  fullName: string | null;
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
  telegram_id: string | null;
  score: number;
}

export function ProfileInfoForm({
  fullName,
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
  telegram_id,
  score,
}: ProfileInfoFormProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      full_name: fullName || "",
      phone: phone || "",
      line_id: line_id || "",
      line_user_id: line_user_id || "",
      facebook_url: facebook_url || "",
      whatsapp_id: whatsapp_id || "",
      wechat_id: wechat_id || "",
      tax_id: tax_id || "",
      tax_address: tax_address || "",
      telegram_id: telegram_id || "",
    },
  });

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
      if (!href || href.startsWith("http") || href.startsWith("#") || target.target === "_blank") return;

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

  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("full_name", values.full_name);
      if (values.phone) {
        formData.append("phone", values.phone);
      }
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
      if (values.telegram_id)
        formData.append("telegram_id", values.telegram_id);

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
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">ข้อมูลส่วนตัวเชิงธุรกิจ</h3>
          <p className="text-sm text-slate-500 font-medium whitespace-nowrap">Business Identity & Contact Details</p>
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
                <span className="text-[10px] font-bold uppercase tracking-wider">กำลังแก้ไข... โปรดบันทึก</span>
              </m.div>
            ) : score >= 100 ? (
              <m.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Complete</span>
              </m.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        {/* Section 1: Basic Information */}
        <section className="space-y-5">
          <div className="flex flex-col gap-1 pl-4 border-l-2 border-blue-500/50">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              ข้อมูลพื้นฐาน
            </h3>
            <p className="text-xs text-slate-400">ชื่อและข้อมูลติดต่อเบื้องต้นของคุณ</p>
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
                    <FormDescription className="text-[11px] text-slate-400">ชื่อ-นามสกุลจริงสำหรับใช้ในเอกสารสำคัญ</FormDescription>
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
              name="phone"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex flex-col gap-0">
                    <FormLabel className="text-[13px] font-medium text-slate-600">
                      เบอร์โทรศัพท์
                    </FormLabel>
                    <FormDescription className="text-[11px] text-slate-400">เบอร์โทรศัพท์มือถือที่ติดต่อได้สะดวกที่สุด</FormDescription>
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
            <p className="text-xs text-slate-400">ระบุไอดีโซเชียลเพื่อความสะดวกในการประสานงาน</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="line_id"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex flex-col gap-0">
                    <FormLabel className="text-[13px] font-medium text-slate-600">ไลน์ ไอดี</FormLabel>
                    <FormDescription className="text-[11px] text-slate-400">ไอดีไลน์สำหรับให้ลูกค้าหรือทีมงานค้นหาเจอ</FormDescription>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <FaLine className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                      <Input
                        placeholder="ใส่ ID Line..."
                        className="pl-10.5 pr-10 h-11 rounded-xl border-emerald-100/80 focus-visible:ring-emerald-500/20 font-normal shadow-none transition-all"
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
              name="line_user_id"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex flex-col gap-0">
                    <div className="flex items-center gap-1.5">
                      <FormLabel className="text-[13px] font-medium text-slate-600">รหัสไอดีผู้ใช้ไลน์ (สำหรับบอท)</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3.5 h-3.5 text-slate-300 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs p-3 rounded-xl bg-slate-900 text-white border-none shadow-xl">
                            <p className="text-xs leading-relaxed font-medium">
                              ไอดีเฉพาะของแต่ละบัญชีไลน์ (ขึ้นต้นด้วย U...) ใช้สำหรับรับการแจ้งเตือนจากระบบ VCC
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormDescription className="text-[11px] text-slate-400">ไอดีสำหรับรับการแจ้งเตือนส่วนตัวจากระบบ (Webhook ID)</FormDescription>
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
                    <FormLabel className="text-[13px] font-medium text-slate-600">เฟซบุ๊กโปรไฟล์</FormLabel>
                    <FormDescription className="text-[11px] text-slate-400">ลิงก์ไปยังหน้าโปรไฟล์เฟซบุ๊กสำหรับอ้างอิง</FormDescription>
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
              name="whatsapp_id"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex flex-col gap-0">
                    <FormLabel className="text-[13px] font-medium text-slate-600">วอทส์แอป</FormLabel>
                    <FormDescription className="text-[11px] text-slate-400">ระบุเบอร์โทรที่ผูกกับบัญชี WhatsApp ของคุณ</FormDescription>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <FaWhatsapp className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                      <Input
                        placeholder="66xxxxxxxxx"
                        className="pl-10.5 pr-10 h-11 rounded-xl border-emerald-50 focus-visible:ring-emerald-500/20 font-normal shadow-none transition-all"
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
              name="wechat_id"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex flex-col gap-0">
                    <FormLabel className="text-[13px] font-medium text-slate-600">วีแชต ไอดี WeChat (สำหรับลูกค้าจีน)</FormLabel>
                    <FormDescription className="text-[11px] text-slate-400">ไอดี WeChat สำหรับใช้ติดต่อลูกค้าชาวต่างชาติ</FormDescription>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <IoLogoWechat className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                      <Input
                        placeholder="ใส่ ID WeChat..."
                        className="pl-10.5 pr-10 h-11 rounded-xl border-slate-200 focus-visible:ring-emerald-500/20 font-normal shadow-none transition-all"
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
              name="telegram_id"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <FormLabel className="text-[13px] font-medium text-slate-600">เทเลแกรม ไอดี (telegram id)</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3.5 h-3.5 text-slate-300 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm p-3 rounded-xl bg-slate-900 text-white border-none">
                            <p className="text-xs leading-relaxed font-medium">
                              ใช้สำหรับเชื่อมต่อระบบ Back-office เพื่อรับแจ้งเตือนและเช็คข้อมูลทรัพย์สิน
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                      <FormDescription className="text-[11px] text-slate-400 truncate">
                        เลขไอดี Telegram เพื่อรับการแจ้งเตือน
                      </FormDescription>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-slate-300 font-medium">หา ID:</span>
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
                        placeholder="เช่น 123456789..."
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
              ข้อมูลบัญชีและภาษี
            </h3>
            <p className="text-xs text-slate-400">ข้อมูลสำคัญสำหรับการเบิกจ่ายและเอกสารทางภาษี</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="tax_id"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex flex-col gap-0">
                    <FormLabel className="text-[13px] font-medium text-slate-600">
                      เลขบัตรประชาชน/เลขผู้เสียภาษี
                    </FormLabel>
                    <FormDescription className="text-[10px] text-slate-400 italic">
                      ⚠️ เลขประจำตัวผู้เสียภาษี 13 หลัก สำหรับทำธุรกรรมและออกเอกสาร
                    </FormDescription>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                      <Input
                        placeholder="เลข 13 หลัก..."
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
          </div>

          <FormField
            control={form.control}
            name="tax_address"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <div className="flex flex-col gap-0">
                  <FormLabel className="text-[13px] font-medium text-slate-600">
                    ที่อยู่ออกเอกสารภาษี
                  </FormLabel>
                  <FormDescription className="text-[11px] text-slate-400">ที่อยู่จดทะเบียนสำหรับทำธุรกรรมและออกเอกสารภาษี</FormDescription>
                </div>
                <FormControl>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-4 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="ระบุที่อยู่ตามทะเบียนบ้าน หรือที่อยู่จดทะเบียน..."
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

        {/* Read-only Auth Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6 border-t border-slate-100">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">อีเมลล็อกอิน</Label>
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
            <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">บทบาทปัจจุบัน</Label>
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
              "w-full h-12 transition-all duration-300 font-bold text-sm rounded-xl relative overflow-hidden group shadow-none",
              form.formState.isDirty
                ? "bg-linear-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white duration-300 transition-all hover:scale-[1.005] active:scale-[0.98] shadow-lg shadow-blue-500/20"
                : "bg-slate-100 text-slate-400 cursor-not-allowed",
            )}
            disabled={
              isLoading || !form.formState.isValid || !form.formState.isDirty
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
                  <span>กำลังอัปเดต...</span>
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
                      form.formState.isDirty ? "text-emerald-300" : "text-slate-400",
                    )}
                  />
                  <span>บันทึกการเปลี่ยนแปลง</span>
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
              ⚠️ มีการแก้ไขที่ยังไม่ได้บันทึก
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
      title="ยังไม่ได้บันทึกข้อมูล"
      description="คุณมีการแก้ไขข้อมูลที่ยังไม่ได้บันทึก หากออกจากหน้านี้ข้อมูลที่แก้ไขจะสูญหาย คุณต้องการยืนยันที่จะออกจากหน้านี้ใช่หรือไม่?"
      className="max-w-sm!"
      footer={
        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => setShowLeaveDialog(false)}
          >
            แก้ไขต่อ
          </Button>
          <Button
            variant="destructive"
            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700"
            onClick={confirmLeave}
          >
            ออกจากหน้านี้
          </Button>
        </div>
      }
    />
  </div>
  );
}
