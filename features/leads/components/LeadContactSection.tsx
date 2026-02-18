"use client";

import { UseFormReturn } from "react-hook-form";
import { UserCircle, Phone as PhoneIcon, Mail, Globe } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { NATIONALITY_OPTIONS } from "../labels";
import { LeadFormValues } from "../types";

interface LeadContactSectionProps {
  form: UseFormReturn<LeadFormValues>;
}

export function LeadContactSection({ form }: LeadContactSectionProps) {
  const nationality = form.watch("nationality");

  return (
    <Card className="shadow-lg border-slate-200 dark:border-slate-800 overflow-hidden h-full">
      <CardHeader className="bg-linear-to-br from-emerald-600 to-teal-600 border-b border-emerald-500/20 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-white/20 text-white shadow-inner backdrop-blur-sm">
            <UserCircle className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl text-white font-bold">
              ข้อมูลติดต่อหลัก
            </CardTitle>
            <CardDescription className="text-emerald-50 font-medium">
              โปรไฟล์และช่องทางติดต่อ
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            ชื่อ-นามสกุล <span className="text-red-500">*</span>
          </Label>
          <div className="relative group">
            <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <Input
              placeholder="ระบุชื่อของ Lead..."
              {...form.register("full_name")}
              className="pl-9 h-11 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-slate-50/50 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            ประเภทลูกค้า
          </Label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "INDIVIDUAL", label: "บุคคลธรรมดา" },
              { value: "COMPANY", label: "บริษัท/องค์กร" },
              { value: "JURISTIC_PERSON", label: "นิติบุคคล" },
            ].map((option) => {
              const isSelected = form.watch("lead_type") === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    form.setValue("lead_type", option.value as any)
                  }
                  className={`
                    px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 flex-1 cursor-pointer
                    ${isSelected ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200" : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"}
                  `}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <Separator className="my-2 bg-slate-100 dark:bg-slate-800" />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              เบอร์โทรศัพท์
            </Label>
            <div className="relative group">
              <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <Input
                className="pl-9 h-11 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-slate-50/50 rounded-xl"
                placeholder="0xx-xxxxxxx"
                {...form.register("phone")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              อีเมล
            </Label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <Input
                className="pl-9 h-11 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-slate-50/50 rounded-xl"
                placeholder="example@email.com"
                {...form.register("email")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Line ID
            </Label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 group-focus-within:text-[#06C755] transition-colors">
                <span className="font-bold text-[10px]">L</span>
              </div>
              <Input
                className="pl-9 h-11 border-slate-200 focus:border-[#06C755] focus:ring-[#06C755]/20 bg-slate-50/50 rounded-xl"
                placeholder="Line ID"
                {...form.register("preferences.line_id")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Social
            </Label>
            <div className="relative group">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                className="pl-9 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-slate-50/50 rounded-xl"
                placeholder="FB, WeChat.."
                {...form.register("preferences.online_contact")}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>สัญชาติ</span>
            <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              เลือกได้มากกว่า 1
            </span>
          </Label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {NATIONALITY_OPTIONS.map((nat) => {
              const selected = Array.isArray(nationality)
                ? nationality
                : typeof nationality === "string" &&
                    (nationality as string).length > 0
                  ? (nationality as string).split(",").map((x) => x.trim())
                  : [];
              const isSelected = selected.includes(nat);

              return (
                <button
                  key={nat}
                  type="button"
                  onClick={() => {
                    let newSelected = [...selected];
                    if (isSelected) {
                      newSelected = newSelected.filter((x) => x !== nat);
                    } else {
                      newSelected.push(nat);
                    }
                    form.setValue("nationality", newSelected);
                    const hasThai = newSelected.includes("ไทย");
                    if (newSelected.length > 0 && !hasThai) {
                      form.setValue("is_foreigner", true);
                    } else if (hasThai) {
                      form.setValue("is_foreigner", false);
                    }
                  }}
                  className={`
                    flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200
                    ${isSelected ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm" : "bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}
                  `}
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? "bg-emerald-500" : "bg-slate-300"}`}
                  />
                  {nat}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
