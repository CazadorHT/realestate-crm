"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  ListOrdered,
  Save,
  Loader2,
  Sparkles,
  ShoppingBag,
  Home,
  Key,
  CreditCard,
  Scale,
  Globe,
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FAQFormValues } from "../FAQForm";
import { ResponsiveSelectField } from "./ResponsiveSelectField";

interface FAQSidebarProps {
  form: UseFormReturn<FAQFormValues>;
  saving: boolean;
  isNew: boolean;
  onCancel: () => void;
  isWizard?: boolean;
}

export function FAQSettingsSection({
  form,
  saving,
  isNew,
  onCancel,
  isWizard = false,
}: FAQSidebarProps) {
  const categories = [
    { label: "ทั่วไป (General)", value: "ทั่วไป", icon: <Globe className="w-4 h-4" />, description: "ข้อมูลพื้นฐานและเรื่องทั่วไป" },
    { label: "การซื้อ (Buying)", value: "การซื้อ", icon: <ShoppingBag className="w-4 h-4" />, description: "เรื่องขั้นตอนการซื้ออสังหาฯ" },
    { label: "การขาย (Selling)", value: "การขาย", icon: <Key className="w-4 h-4" />, description: "เรื่องการลงประกาศและการขาย" },
    { label: "การเช่า (Renting)", value: "การเช่า", icon: <Home className="w-4 h-4" />, description: "สัญญาและกฎระเบียบการเช่า" },
    { label: "สินเชื่อ (Loans)", value: "สินเชื่อ", icon: <CreditCard className="w-4 h-4" />, description: "ธนาคารและดอกเบี้ยกู้ยืม" },
    { label: "กฎหมาย (Legal)", value: "กฎหมาย", icon: <Scale className="w-4 h-4" />, description: "สัญญาและภาษีอากรต่างๆ" },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-slate-50/80 rounded-3xl border border-slate-200 p-8 space-y-8 shadow-sm group hover:border-blue-200 transition-colors">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <ResponsiveSelectField
                label="หมวดหมู่ข้อมูล"
                options={categories}
                value={field.value ?? "ทั่วไป"}
                onValueChange={field.onChange}
                icon={<LayoutGrid className="h-4 w-4 text-blue-600" />}
              />
              <FormMessage className="font-semibold text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sort_order"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <ListOrdered className="h-4 w-4 text-blue-600" />
                <FormLabel className="text-base font-semibold text-slate-900">
                  ลำดับความสำคัญ
                </FormLabel>
              </div>
              <FormControl>
                <Input
                  type="number"
                  className="h-14 border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-2xl font-semibold text-lg px-6 shadow-sm"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs font-semibold text-slate-400 italic px-2">
                * ลำดับที่เริ่มด้วย 0 จะขึ้นแสดงเป็นอันแรกๆ
              </FormDescription>
              <FormMessage className="font-semibold text-xs" />
            </FormItem>
          )}
        />

        <div className="pt-8 border-t border-slate-200/60">
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between space-y-0 p-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="space-y-1 ml-2">
                  <FormLabel className="text-base font-semibold text-slate-900 cursor-pointer">
                    สถานะการเผยแพร่
                  </FormLabel>
                  <FormDescription className="text-[10px] font-semibold text-slate-400 leading-tight uppercase tracking-tight">
                    Visibility Status
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-blue-600 scale-125 transition-transform active:scale-90 mr-2"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="p-7 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-start gap-4 shadow-xs">
        <Sparkles className="h-5 w-5 text-blue-500 shrink-0 mt-0.5 animate-pulse" />
        <p className="text-[11px] leading-relaxed text-blue-700/80 font-semibold italic">
          <b>Elite Intelligence:</b> การกรอกข้อมูลหลายภาษาช่วยดึงดูดกลุ่มลูกค้า Luxury และชาวต่างชาติได้ดีเยี่ยม แนะนำให้ใช้ปุ่มแปลอัตโนมัติเพื่อความรวดเร็วครับ
        </p>
      </div>

      {!isWizard && (
        <div className="flex flex-col gap-3 pt-4">
          <Button
            type="submit"
            disabled={saving || !form.formState.isValid || (!form.formState.isDirty && !isNew)}
            className="w-full h-16 bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-200 hover:shadow-blue-300 transition-all gap-3 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed rounded-2xl font-semibold text-white active:scale-[0.97] text-base uppercase tracking-tight"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5 shadow-sm" />
            )}
            {saving ? "กำลังส่งข้อมูล..." : isNew ? "สร้างคำถามใหม่" : "บันทึกการแก้ไข"}
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={onCancel}
            className="w-full h-14 border-slate-200 hover:bg-slate-100 transition-all font-semibold text-slate-500 rounded-2xl uppercase tracking-widest text-xs"
          >
            ยกเลิก
          </Button>
        </div>
      )}
    </div>
  );
}
