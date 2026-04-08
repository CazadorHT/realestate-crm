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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutGrid,
  ListOrdered,
  Save,
  Loader2,
  Sparkles,
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FAQFormValues } from "../FAQForm";

interface FAQSidebarProps {
  form: UseFormReturn<FAQFormValues>;
  saving: boolean;
  isNew: boolean;
  onCancel: () => void;
}

export function FAQSidebar({
  form,
  saving,
  isNew,
  onCancel,
}: FAQSidebarProps) {
  const categories = [
    { label: "ทั่วไป (General)", value: "ทั่วไป" },
    { label: "การซื้อ (Buying)", value: "การซื้อ" },
    { label: "การขาย (Selling)", value: "การขาย" },
    { label: "การเช่า (Renting)", value: "การเช่า" },
    { label: "สินเชื่อ (Loans)", value: "สินเชื่อ" },
    { label: "กฎหมาย (Legal)", value: "กฎหมาย" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 delay-300">
      <div className="bg-slate-50/80 rounded-3xl border border-slate-200 p-8 space-y-8 shadow-sm group hover:border-blue-200 transition-colors">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <LayoutGrid className="h-4 w-4 text-blue-600" />
                <FormLabel className="text-base font-black text-slate-900">
                  หมวดหมู่ข้อมูล
                </FormLabel>
              </div>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value ?? "ทั่วไป"}
              >
                <FormControl>
                  <SelectTrigger className="h-14 border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-2xl font-bold text-slate-700 shadow-sm px-6">
                    <SelectValue placeholder="เลือกหมวดหมู่..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-2xl border-slate-200 shadow-2xl p-2">
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat.value}
                      value={cat.value}
                      className="font-bold text-slate-700 py-3 px-4 rounded-xl focus:bg-blue-50 focus:text-blue-700 cursor-pointer mb-1 transition-colors"
                    >
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="font-bold text-xs" />
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
                <FormLabel className="text-base font-black text-slate-900">
                  ลำดับความสำคัญ
                </FormLabel>
              </div>
              <FormControl>
                <Input
                  type="number"
                  className="h-14 border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-2xl font-black text-lg px-6 shadow-sm"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs font-bold text-slate-400 italic px-2">
                * ลำดับที่เริ่มด้วย 0 จะขึ้นแสดงเป็นอันแรกๆ
              </FormDescription>
              <FormMessage className="font-bold text-xs" />
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
                  <FormLabel className="text-base font-black text-slate-900 cursor-pointer">
                    สถานะการเผยแพร่
                  </FormLabel>
                  <FormDescription className="text-[10px] font-bold text-slate-400 leading-tight uppercase tracking-tight">
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
        <p className="text-[11px] leading-relaxed text-blue-700/80 font-bold italic">
          <b>Elite Intelligence:</b> การกรอกข้อมูลหลายภาษาช่วยดึงดูดกลุ่มลูกค้า Luxury และชาวต่างชาติได้ดีเยี่ยม แนะนำให้ใช้ปุ่มแปลอัตโนมัติเพื่อความรวดเร็วครับ
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <Button
          type="submit"
          disabled={saving || !form.formState.isValid || (!form.formState.isDirty && !isNew)}
          className="w-full h-16 bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-200 hover:shadow-blue-300 transition-all gap-3 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed rounded-2xl font-black text-white active:scale-[0.97] text-base uppercase tracking-tight"
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
          className="w-full h-14 border-slate-200 hover:bg-slate-100 transition-all font-black text-slate-500 rounded-2xl uppercase tracking-widest text-xs"
        >
          ยกเลิก
        </Button>
      </div>
    </div>
  );
}
