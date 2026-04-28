"use client";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { OwnerForm } from "@/features/owners/OwnerForm";
import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { ShieldCheck, Activity, User, Minus, Plus, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFormContext, useWatch, type UseFormReturn } from "react-hook-form";
import { PropertyFormValues } from "../../../schema";
import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_ORDER,
} from "@/features/properties/labels";
import { AgentMultiSelect } from "../../sections/AgentMultiSelect";
import { Button } from "@/components/ui/button";
import { FaUserPlus } from "react-icons/fa";
import { CoBrokerSelect } from "@/features/co-brokers/components/CoBrokerSelect";

interface ManagementSectionProps {
  form?: UseFormReturn<PropertyFormValues>; // Optional: falls back to useFormContext
  owners: Array<{ id: string; full_name: string; phone: string | null }>;
  agents: Array<{
    id: string;
    full_name: string | null;
    phone: string | null;
    avatar_url?: string | null;
  }>;
  refreshOwners?: () => Promise<any>;
  allBranches?: boolean;
  setAllBranches?: (val: boolean) => void;
  isMultiTenant?: boolean;
  userRole?: string;
}

export const ManagementSection = ({
  form: formProp,
  owners,
  agents,
  refreshOwners,
  allBranches,
  setAllBranches,
  isMultiTenant,
  userRole,
}: ManagementSectionProps) => {
  const formContext = useFormContext<PropertyFormValues>();
  const form = formProp || formContext;
  const [isAddingOwner, setIsAddingOwner] = useState(false);
  const totalUnits = useWatch({ control: form.control, name: "total_units" });
  const soldUnits = useWatch({ control: form.control, name: "sold_units" });
  const isCoAgent = useWatch({ control: form.control, name: "is_co_agent" });

  return (
    <section className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100/60 space-y-5 sm:space-y-6">
      <div className="flex  items-center gap-2 pb-3 border-b border-slate-50">
        <div className="p-1.5 sm:p-2 bg-emerald-50 rounded-lg text-emerald-600">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-sm sm:text-base font-medium text-slate-800">
            การจัดการ (Management)
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-500">
            จัดการข้อมูลทรัพย์สิน
          </p>
        </div>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {/* 1. Primary Controls (Status & Owner) - Stacked Full Width */}
        <div className="grid grid-cols-1 gap-6 w-full">
          {/* Status Field */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-slate-900 font-bold text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  สถานะประกาศ (Status)
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger
                      className={cn(
                        "h-11! rounded-xl border-2 px-4 text-sm font-bold transition-all shadow-sm",
                        field.value === "ACTIVE" &&
                          "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100",
                        field.value === "DRAFT" &&
                          "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
                        field.value === "ARCHIVED" &&
                          "bg-slate-800 text-white border-slate-900 hover:bg-slate-900 shadow-md",
                        (field.value === "SOLD" || field.value === "RENTED") &&
                          "bg-red-50 text-red-600 border-red-200 hover:bg-red-100",
                        (field.value === "UNDER_OFFER" ||
                          field.value === "RESERVED") &&
                          "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white rounded-2xl border-none shadow-xl ring-1 ring-black/5 p-1">
                    {PROPERTY_STATUS_ORDER.map((s) => (
                      <SelectItem
                        key={s}
                        value={s}
                        className="py-3 rounded-lg text-sm font-medium focus:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={cn(
                              "w-3 h-3 rounded-full shrink-0 shadow-inner",
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

          {/* Owner Field */}
          <FormField
            control={form.control}
            name="owner_id"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <div className="flex items-center justify-between pb-1">
                  <FormLabel className="text-slate-900 font-bold text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    เจ้าของทรัพย์ (Owner)
                  </FormLabel>
                  <div className="flex items-center gap-4">
                    {setAllBranches &&
                      isMultiTenant &&
                      userRole === "ADMIN" && (
                        <div className="flex items-center gap-2 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                          <Label
                            htmlFor="owner-all-branches"
                            className="text-[10px] text-blue-700 font-bold cursor-pointer"
                          >
                            ทุกสาขา
                          </Label>
                          <Switch
                            id="owner-all-branches"
                            checked={allBranches}
                            onCheckedChange={setAllBranches}
                            className="scale-75 origin-right"
                          />
                        </div>
                      )}
                    {isCoAgent && (
                      <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        ℹ️ บันทึกคู่กับ Co-Agent ได้
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                      ส่วนตัว 🔒
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                  <Select
                    value={field.value ?? "NONE"}
                    onValueChange={(v) =>
                      field.onChange(v === "NONE" ? null : v)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="h-11! flex-1 min-w-0 rounded-xl bg-white border-slate-200 hover:border-slate-300 transition-colors font-medium px-4 text-sm shadow-sm">
                        <SelectValue placeholder="ค้นหาหรือเลือกเจ้าของ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white rounded-2xl shadow-xl border-none max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                      <SelectItem
                        value="NONE"
                        className="font-medium text-slate-400 text-sm italic py-3 rounded-lg"
                      >
                        -- ไม่ระบุเจ้าของ --
                      </SelectItem>
                      {owners.map((o) => (
                        <SelectItem
                          key={o.id}
                          value={o.id}
                          className="py-3 font-medium text-sm rounded-lg"
                        >
                          <span className="text-slate-500 mr-1.5">K.</span>
                          {o.full_name}{" "}
                          {o.phone ? (
                            <span className="text-[11px] text-slate-400 font-normal ml-2 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                              {o.phone}
                            </span>
                          ) : (
                            ""
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <ResponsiveDialog
                    open={isAddingOwner}
                    onOpenChange={setIsAddingOwner}
                    title="เพิ่มเจ้าของทรัพย์ใหม่"
                    description="กรอกข้อมูลเจ้าของทรัพย์เพื่อบันทึกลงในระบบเพื่อใช้ในการจับคู่ทรัพย์สิน"
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 px-4 shrink-0 rounded-xl border-emerald-200 bg-emerald-50/30 text-emerald-700 hover:text-white hover:bg-emerald-600 hover:border-emerald-700 transition-all shadow-sm group font-bold text-xs"
                      >
                        <FaUserPlus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                        เพิ่มเจ้าของใหม่
                      </Button>
                    }
                  >
                    <div className="py-4">
                      <OwnerForm
                        mode="create"
                        onCancel={() => setIsAddingOwner(false)}
                        onSuccess={async () => {
                          setIsAddingOwner(false);
                          if (refreshOwners) {
                            const newOwners = await refreshOwners();
                            if (newOwners && newOwners.length > 0) {
                              const latest = [...newOwners].sort(
                                (a, b) =>
                                  new Date(b.created_at).getTime() -
                                  new Date(a.created_at).getTime(),
                              )[0];
                              if (latest) {
                                form.setValue("owner_id", latest.id);
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </ResponsiveDialog>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* 🏢 Stock Management - Responsive Grid Layout */}
        <div className="flex flex-col col-span-2 gap-6 bg-slate-50 p-5 rounded-xl border border-dashed border-slate-200 shadow-inner">
          {/* Total Units */}
          <FormField
            control={form.control}
            name="total_units"
            render={({ field }) => (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-1">
                <span className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                  จำนวนยูนิตทั้งหมด:
                </span>
                <div className="flex items-center gap-0.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const val = (field.value || 0) - 1;
                      if (val >= 1) field.onChange(val);
                    }}
                    className="h-9 w-9 flex items-center justify-center rounded-l-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors shadow-sm"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? undefined : Number(val));
                    }}
                    className="h-9 w-14 text-center border-y border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = (field.value ?? 1) + 1;
                      field.onChange(val);
                    }}
                    className="h-9 w-9 flex items-center justify-center rounded-r-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          />

          {/* Sold Units */}
          <FormField
            control={form.control}
            name="sold_units"
            render={({ field }) => (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-1">
                <span className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                  ปล่อย/จองแล้ว:
                </span>
                <div className="flex items-center gap-0.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const val = (field.value || 0) - 1;
                      if (val >= 0) field.onChange(val);
                    }}
                    className="h-9 w-9 flex items-center justify-center rounded-l-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors shadow-sm"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? undefined : Number(val));
                    }}
                    className="h-9 w-14 text-center border-y border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = (field.value ?? 0) + 1;
                      field.onChange(val);
                    }}
                    className="h-9 w-9 flex items-center justify-center rounded-r-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          />

          {/* Remaining - Highlight */}
          <div className="flex flex-row items-center justify-between lg:justify-end gap-3 border-t lg:border-t-0 border-slate-200 pt-3 lg:pt-0 mt-1 lg:mt-0 p-1">
            <span className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
              คงเหลือปัจจุบัน:
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-black shadow-sm ring-1 ring-inset ${
                (totalUnits ?? 1) - (soldUnits ?? 0) > 0
                  ? "bg-emerald-500 text-white ring-emerald-600"
                  : "bg-red-500 text-white ring-red-600"
              }`}
            >
              {(totalUnits ?? 1) - (soldUnits ?? 0)} ยูนิต
              {(totalUnits ?? 1) - (soldUnits ?? 0) > 0 && (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 my-1 sm:my-2" />

        {/* Agent Multi Select */}
        <AgentMultiSelect agents={agents} />

        {/* 🤝 Co-Agent Contact Details (Conditional) */}
        {isCoAgent && (
          <div className="mt-4 p-5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2 pb-2 border-b border-blue-100/50 text-blue-800">
              <User className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-widest">ข้อมูลผู้ดูแลจากภายนอก (Co-Agent Details)</h4>
            </div>

            {/* 🔍 Centralized Directory Selection */}
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
              <CoBrokerSelect />
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1.5">
                <Info className="w-3 h-3" />
                เคล็ดลับ: การเลือกจากฐานข้อมูลกลางจะช่วยบันทึกสถิติและลดเวลาการกรอกข้อมูล
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="co_agent_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">ชื่อ Co-Agent</FormLabel>
                    <FormControl>
                      <input 
                        {...field} 
                        value={field.value || ""} 
                        placeholder="ระบุชื่อเอเยนต์เจ้าของทรัพย์"
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none shadow-sm"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="co_agent_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">เบอร์โทรติดต่อ</FormLabel>
                    <FormControl>
                      <input 
                        {...field} 
                        value={field.value || ""} 
                        placeholder="เลขเบอร์โทรศัพท์"
                        inputMode="numeric"
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none shadow-sm"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="co_agent_contact_channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">ช่องทางที่โค (Channel)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger className="h-11! rounded-xl bg-white border-slate-200">
                          <SelectValue placeholder="เลือกช่องทางติดต่อ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white rounded-xl">
                        <SelectItem value="LINE">LINE</SelectItem>
                        <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                        <SelectItem value="PHONE">โทรศัพท์</SelectItem>
                        <SelectItem value="FACEBOOK">Facebook</SelectItem>
                        <SelectItem value="WECHAT">WeChat</SelectItem>
                        <SelectItem value="OTHER">อื่นๆ</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="co_agent_contact_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">ID / หมายเหตุติดต่อ</FormLabel>
                    <FormControl>
                      <input 
                        {...field} 
                        value={field.value || ""} 
                        placeholder="เช่น Line ID หรือลิ้งค์โพสต์"
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none shadow-sm"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Commission Split Section */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <FormField
                control={form.control}
                name="co_agent_sale_commission_percent"
                render={({ field }) => (
                  <FormItem className="bg-blue-100/30 p-3 rounded-xl border border-blue-100/50">
                    <FormLabel className="text-[10px] font-bold text-blue-700 uppercase tracking-tight flex items-center gap-1.5">
                      ส่วนแบ่งขาย (%)
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="number"
                          {...field} 
                          value={field.value ?? ""} 
                          onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                          className="w-full h-8 px-3 rounded-lg border-none bg-white font-bold text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                        />
                        <span className="text-xs font-bold text-blue-600">%</span>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="co_agent_rent_commission_months"
                render={({ field }) => (
                  <FormItem className="bg-blue-100/30 p-3 rounded-xl border border-blue-100/50">
                    <FormLabel className="text-[10px] font-bold text-blue-700 uppercase tracking-tight flex items-center gap-1.5">
                      ส่วนแบ่งเช่า (เดือน)
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="number"
                          {...field} 
                          value={field.value ?? ""} 
                          onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                          className="w-full h-8 px-3 rounded-lg border-none bg-white font-bold text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                        />
                        <span className="text-xs font-bold text-blue-600">ด.</span>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
