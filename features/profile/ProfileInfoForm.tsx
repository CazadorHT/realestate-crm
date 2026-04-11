"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileFormValues } from "@/lib/profile-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import { updateProfileAction } from "./actions";
import {cn} from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { toast } from "sonner";
import { Loader2, User, Phone, MessageCircle, Facebook, MessageSquare, Globe, AtSign, ShieldCheck, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
}: ProfileInfoFormProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

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
    },
  });

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

      const result = await updateProfileAction(formData);

      if (result.success) {
        toast.success("บันทึกข้อมูลโปรไฟล์สำเร็จ");
        router.refresh(); // Update server component data without leaving page
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 italic">
        {/* Section 1: Basic Information */}
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100/60">
            <User className="h-4 w-4 text-blue-500" />
            <h3 className="text-[13px] font-semibold text-slate-400 uppercase tracking-widest">ข้อมูลพื้นฐาน <span className="text-slate-300 font-normal">(Basic Information)</span></h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-slate-700">ชื่อ-นามสกุล <span className="text-slate-400 font-normal">(Full Name)</span></FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input placeholder="ระบุชื่อจริงและนามสกุล..." className="pl-10 h-11 rounded-2xl border-slate-200 focus-visible:ring-blue-500/20 shadow-xs font-semibold" {...field} />
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
                <FormItem>
                  <FormLabel className="font-semibold text-slate-700">เบอร์โทรศัพท์ <span className="text-slate-400 font-normal">(Phone Number)</span></FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <Input placeholder="0xx-xxx-xxxx" className="pl-10 h-11 rounded-2xl border-slate-200 focus-visible:ring-blue-500/20 shadow-xs font-semibold" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Section 2: Social Media & Communication */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100/60">
            <Globe className="h-4 w-4 text-indigo-500" />
            <h3 className="text-[13px] font-semibold text-slate-400 uppercase tracking-widest">ช่องทางการติดต่อโซเชียล <span className="text-slate-300 font-normal">(Social Accounts)</span></h3>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="line_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-slate-700">ไลน์ ไอดี <span className="text-slate-400 font-normal">(Line ID)</span></FormLabel>
                <FormControl>
                  <div className="relative group">
                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 group-focus-within:scale-110 transition-transform" />
                    <Input
                      placeholder="ใส่ ID Line สำหรับติดต่อ..."
                      className="pl-10 h-11 rounded-2xl border-emerald-100/80 focus-visible:ring-emerald-500/20 font-semibold shadow-xs"
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
            name="line_user_id"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-1.5">
                  <FormLabel className="font-semibold text-slate-700">รหัสผู้ใช้ไลน์ <span className="text-slate-400 font-normal">(Line User ID)</span></FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs p-3 rounded-2xl border-slate-100 bg-slate-900 text-white">
                        <p className="text-xs leading-relaxed font-semibold">{t("profile.line_user_id_help")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <FormControl>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                    <Input
                      placeholder="Uxxxxxxxxxxxxxxx..."
                      className="pl-10 h-11 rounded-2xl border-slate-200 focus-visible:ring-blue-500/20 font-semibold shadow-xs"
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
            name="facebook_url"
            render={({ field }) => (
              <FormItem>
              <FormLabel className="font-semibold text-slate-700">เฟซบุ๊กโปรไฟล์ <span className="text-slate-400 font-normal">(Facebook Profile URL)</span></FormLabel>
              <FormControl>
                <div className="relative group">
                  <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 group-focus-within:scale-110 transition-transform" />
                  <Input
                    placeholder="https://facebook.com/..."
                    className="pl-10 h-11 rounded-2xl border-blue-100/80 focus-visible:ring-blue-500/20 font-semibold shadow-xs"
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
          name="whatsapp_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-slate-700">วอทส์แอป <span className="text-slate-400 font-normal">(WhatsApp ID)</span></FormLabel>
              <FormControl>
                <div className="relative group">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 group-focus-within:scale-110 transition-transform" />
                  <Input 
                    placeholder="66xxxxxxxxx" 
                    className="pl-10 h-11 rounded-2xl border-emerald-100/80 focus-visible:ring-emerald-500/20 font-semibold shadow-xs"
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
          name="wechat_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-slate-700">วีแชต ไอดี <span className="text-slate-400 font-normal">(WeChat ID)</span></FormLabel>
              <FormControl>
                <div className="relative group">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400 group-focus-within:scale-110 transition-transform" />
                  <Input 
                    placeholder="ใส่ ID WeChat ของคุณ..." 
                    className="pl-10 h-11 rounded-2xl border-emerald-50/80 focus-visible:ring-emerald-500/20 font-semibold shadow-xs"
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100/60">
          <div className="space-y-3 group">
            <Label htmlFor="email" className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">
              อีเมลล็อกอิน <span className="text-slate-300 font-normal">(Auth Email)</span>
            </Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <Input
                id="email"
                value={email || ""}
                disabled
                className="pl-10 h-11 bg-slate-50/50 border-slate-100 text-slate-500 cursor-not-allowed font-semibold rounded-2xl"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="role" className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">
              บทบาทปัจจุบัน <span className="text-slate-300 font-normal">(User Role)</span>
            </Label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <Input
                id="role"
                value={role || "AGENT"}
                disabled
                className="pl-10 h-11 bg-slate-50/50 border-slate-100 text-slate-500 cursor-not-allowed uppercase font-semibold rounded-2xl"
              />
            </div>
          </div>
        </div>

        <div className="pt-6">
          <Button
            type="submit"
            className={cn(
              "w-full h-14 transition-all duration-500 font-semibold text-base rounded-2xl relative overflow-hidden group shadow-lg",
              form.formState.isDirty 
                ? "bg-slate-900 hover:bg-black text-white shadow-slate-200 hover:scale-[1.01] active:scale-95" 
                : "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed"
            )}
            disabled={isLoading || !form.formState.isValid || !form.formState.isDirty}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2.5"
                >
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>กำลังอัปเดตข้อมูล... (Updating Profile)</span>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2.5"
                >
                  <CheckCircle2 className={cn("h-5 w-5", form.formState.isDirty ? "text-emerald-400" : "text-slate-300")} />
                  <span>บันทึกการเปลี่ยนแปลง (Save Changes)</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
          
          {form.formState.isDirty && !isLoading && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] text-center mt-3 text-amber-600 font-semibold uppercase tracking-wider animate-pulse italic"
            >
              ⚠️ คุณมีการแก้ไขที่ยังไม่ได้บันทึก (Unsaved Changes)
            </motion.p>
          )}
        </div>
      </form>
    </Form>
  );
}
