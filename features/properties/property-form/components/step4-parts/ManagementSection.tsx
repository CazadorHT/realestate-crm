"use client";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ShieldCheck, Activity, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import { PropertyFormValues } from "../../../schema";
import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_ORDER,
} from "@/features/properties/labels";
import { AgentMultiSelect } from "../../sections/AgentMultiSelect";

interface ManagementSectionProps {
  form: UseFormReturn<PropertyFormValues>;
  owners: any[];
  agents: any[];
}

export const ManagementSection = ({
  form,
  owners,
  agents,
}: ManagementSectionProps) => {
  return (
    <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100/60 space-y-6">
      <div className="flex  items-center gap-2 pb-3 border-b border-slate-50">
        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <h3 className="font-medium text-slate-800">การจัดการ (Management)</h3>
          <p className="text-xs text-slate-500">จัดการข้อมูลทรัพย์สิน</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-900 font-medium text-xs uppercase tracking-wide flex items-center gap-2">
                  <Activity className="w-3 h-3 text-emerald-600" />
                  สถานะประกาศ
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger
                      className={cn(
                        "h-11 rounded-lg border px-4 text-sm font-medium transition-colors",
                        field.value === "ACTIVE" &&
                          "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600",
                        field.value === "DRAFT" &&
                          "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
                        field.value === "ARCHIVED" &&
                          "bg-slate-800 text-slate-100 border-slate-900 hover:bg-slate-900",
                        (field.value === "SOLD" || field.value === "RENTED") &&
                          "bg-red-500 text-white border-red-600 hover:bg-red-600",
                        (field.value === "UNDER_OFFER" ||
                          field.value === "RESERVED") &&
                          "bg-amber-500 text-white border-amber-600 hover:bg-amber-600",
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white rounded-xl border-none shadow-lg">
                    {PROPERTY_STATUS_ORDER.map((s) => (
                      <SelectItem
                        key={s}
                        value={s}
                        className="py-3 text-sm focus:bg-slate-50 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-2.5 h-2.5 rounded-full shrink-0",
                              s === "ACTIVE" && "bg-emerald-500",
                              s === "DRAFT" && "bg-slate-400",
                              s === "ARCHIVED" && "bg-slate-800",
                              (s === "SOLD" || s === "RENTED") && "bg-red-500",
                              (s === "UNDER_OFFER" || s === "RESERVED") &&
                                "bg-amber-500",
                            )}
                          />
                          {PROPERTY_STATUS_LABELS[s]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* Owner */}
          <FormField
            control={form.control}
            name="owner_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-900 font-medium text-xs uppercase tracking-wide flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="w-3 h-3 text-emerald-600" />
                    เจ้าของทรัพย์
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    ส่วนตัว 🔒
                  </span>
                </FormLabel>
                <Select
                  value={field.value ?? "NONE"}
                  onValueChange={(v) => field.onChange(v === "NONE" ? null : v)}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-lg bg-white border border-slate-200 font-normal px-4 text-sm">
                      <SelectValue placeholder="เลือกเจ้าของ" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white rounded-xl shadow-lg border-none max-h-[300px] overflow-y-auto">
                    <SelectItem
                      value="NONE"
                      className="font-normal text-slate-400 text-sm"
                    >
                      -- ไม่ระบุ --
                    </SelectItem>
                    {owners.map((o) => (
                      <SelectItem
                        key={o.id}
                        value={o.id}
                        className="py-3 font-normal text-sm"
                      >
                        {"K."}
                        {o.full_name} {o.phone ? `(${o.phone})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 my-2" />

        {/* Agent Multi Select */}
        <AgentMultiSelect form={form} agents={agents} />
      </div>
    </section>
  );
};
