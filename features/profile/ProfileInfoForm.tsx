"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const profileSchema = z.object({
  full_name: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  phone: z.string().optional(),
  line_id: z.string().optional(),
  line_user_id: z.string().optional(),
  facebook_url: z.string().optional(),
  whatsapp_id: z.string().optional(),
  wechat_id: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

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
        router.push("/protected");
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">ข้อมูลพื้นฐาน</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อ-นามสกุล</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input placeholder="กรอกชื่อ-นามสกุล" className="pl-9" {...field} />
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
                  <FormLabel>เบอร์โทรศัพท์</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input placeholder="0xx-xxx-xxxx" className="pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Section 2: Social Media & Communication */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Globe className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">ช่องทางการติดต่อโซเชียล</h3>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="line_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("profile.line_id_label")}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                    <Input
                      placeholder={t("profile.line_id_placeholder")}
                      className="pl-9 border-emerald-100 focus-visible:ring-emerald-500/20"
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
                  <FormLabel>{t("profile.line_user_id_label")}</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs p-3">
                        <p className="text-xs leading-relaxed">{t("profile.line_user_id_help")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <FormControl>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                    <Input
                      placeholder={t("profile.line_user_id_placeholder")}
                      className="pl-9"
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
              <FormLabel>Facebook Profile</FormLabel>
              <FormControl>
                <div className="relative">
                  <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                  <Input
                    placeholder="https://facebook.com/..."
                    className="pl-9 border-blue-100 focus-visible:ring-blue-500/20"
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
              <FormLabel>WhatsApp (International Format)</FormLabel>
              <FormControl>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                  <Input 
                    placeholder="66xxxxxxxxx" 
                    className="pl-9 border-emerald-100 focus-visible:ring-emerald-500/20"
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
              <FormLabel>WeChat ID</FormLabel>
              <FormControl>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                  <Input 
                    placeholder="WeChatID" 
                    className="pl-9 border-emerald-50"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
          <div className="space-y-2 group">
            <Label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
              อีเมลล็อกอิน
            </Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <Input
                id="email"
                value={email || ""}
                disabled
                className="pl-9 bg-slate-50/50 border-slate-100 text-slate-500 cursor-not-allowed font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
              บทบาทปัจจุบัน
            </Label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <Input
                id="role"
                value={role || "AGENT"}
                disabled
                className="pl-9 bg-slate-50/50 border-slate-100 text-slate-500 cursor-not-allowed uppercase font-bold"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            className={cn(
              "w-full h-12 transition-all duration-300 font-bold text-base rounded-xl relative overflow-hidden group",
              form.formState.isDirty 
                ? "bg-slate-900 hover:bg-black text-white shadow-xl shadow-slate-200" 
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
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
                  className="flex items-center gap-2"
                >
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className={cn("h-5 w-5", form.formState.isDirty ? "text-emerald-400" : "text-slate-300")} />
                  <span>บันทึกการเปลี่ยนแปลง</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
          
          {form.formState.isDirty && !isLoading && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] text-center mt-2 text-amber-600 font-bold uppercase tracking-wider animate-pulse"
            >
              คุณมีการแก้ไขที่ยังไม่ได้บันทึก
            </motion.p>
          )}
        </div>
      </form>
    </Form>
  );
}
