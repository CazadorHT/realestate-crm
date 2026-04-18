"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalAgentFormValues, ExternalAgentSchema } from "../schema";
import { createExternalAgent } from "../actions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MessageSquare, 
  Info,
  Save,
  Loader2
} from "lucide-react";
import { FaLine, FaWhatsapp } from "react-icons/fa";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ExternalAgentFormProps {
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
  defaultValues?: Partial<ExternalAgentFormValues>;
}

export const ExternalAgentForm = ({
  onSuccess,
  onCancel,
  defaultValues,
}: ExternalAgentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ExternalAgentFormValues>({
    resolver: zodResolver(ExternalAgentSchema),
    defaultValues: {
      name: "",
      company: "",
      phone: "",
      email: "",
      line_id: "",
      whatsapp: "",
      notes: "",
      ...defaultValues,
    },
  });

  const onSubmit = async (values: ExternalAgentFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createExternalAgent(values);
      if (result.success) {
        toast.success("บันทึกข้อมูลเอเยนต์พาร์ทเนอร์เรียบร้อยแล้ว");
        onSuccess?.(result.data);
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดที่ไม่คาดคิด");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  ชื่อ-นามสกุลเอเยนต์ *
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="ระบุชื่อเอเยนต์พาร์ทเนอร์" className="h-11 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Company */}
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  บริษัท / สังกัด
                </FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="ระบุชื่อบริษัท (ถ้ามี)" className="h-11 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase">
                  <Phone className="w-3.5 h-3.5 text-indigo-600" />
                  เบอร์โทรศัพท์ *
                </FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    inputMode="numeric"
                    placeholder="08x-xxx-xxxx" 
                    className="h-11 rounded-xl" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase">
                  <Mail className="w-3.5 h-3.5 text-slate-600" />
                  อีเมล
                </FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="example@email.com" className="h-11 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Line ID */}
          <FormField
            control={form.control}
            name="line_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase">
                  <FaLine className="w-3.5 h-3.5 text-[#06C755]" />
                  LINE ID
                </FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="Line ID" className="h-11 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* WhatsApp */}
          <FormField
            control={form.control}
            name="whatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase">
                  <FaWhatsapp className="w-3.5 h-3.5 text-[#25D366]" />
                  WhatsApp
                </FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="Number / ID" className="h-11 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase">
                <Info className="w-3.5 h-3.5 text-amber-600" />
                หมายเหตุพาร์ทเนอร์
              </FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  value={field.value || ""} 
                  placeholder="ข้อมูลเพิ่มเติม เช่น เจ้านี้ดูแลทรัพย์โซนไหน หรือมีเงื่อนไขพิเศษอะไร" 
                  className="rounded-xl min-h-[100px] resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl">
              ยกเลิก
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="rounded-xl px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            บันทึกข้อมูลพาร์ทเนอร์
          </Button>
        </div>
      </form>
    </Form>
  );
};
