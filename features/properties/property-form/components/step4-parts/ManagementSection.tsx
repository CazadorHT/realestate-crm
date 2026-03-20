"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ShieldCheck, Activity, User, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { UseFormReturn, useWatch } from "react-hook-form";
import { PropertyFormValues } from "../../../schema";
import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_ORDER,
} from "@/features/properties/labels";
import { AgentMultiSelect } from "../../sections/AgentMultiSelect";
import { Button } from "@/components/ui/button";

interface ManagementSectionProps {
  form: UseFormReturn<PropertyFormValues>;
  owners: any[];
  agents: any[];
  refreshOwners?: () => Promise<any>;
  allBranches?: boolean;
  setAllBranches?: (val: boolean) => void;
  isMultiTenant?: boolean;
  userRole?: string;
}

export const ManagementSection = ({
  form,
  owners,
  agents,
  refreshOwners,
  allBranches,
  setAllBranches,
  isMultiTenant,
  userRole,
}: ManagementSectionProps) => {
  const [isAddingOwner, setIsAddingOwner] = useState(false);
  const totalUnits = useWatch({ control: form.control, name: "total_units" });
  const soldUnits = useWatch({ control: form.control, name: "sold_units" });

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

      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-900 font-medium text-[10px] sm:text-xs uppercase tracking-wide flex items-center gap-2">
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
                          "bg-slate-800 text-white border-slate-900 hover:bg-slate-900",
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
                <FormLabel className="text-slate-900 font-medium text-[10px] sm:text-xs uppercase tracking-wide flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-emerald-600" />
                    เจ้าของทรัพย์
                  </div>
                  <div className="flex items-center gap-4">
                    {setAllBranches && isMultiTenant && userRole === "ADMIN" && (
                      <div className="flex items-center gap-1.5 bg-blue-50/50 px-2 py-0.5 rounded-full border border-blue-100/50">
                        <Label
                          htmlFor="owner-all-branches"
                          className="text-[9px] text-blue-600 font-medium cursor-pointer"
                        >
                          ทุกสาขา
                        </Label>
                        <Switch
                          id="owner-all-branches"
                          checked={allBranches}
                          onCheckedChange={setAllBranches}
                          className="scale-75 origin-right translate-x-1"
                        />
                      </div>
                    )}
                    <span className="text-[10px] text-slate-500 font-normal">
                      ส่วนตัว 🔒
                    </span>
                  </div>
                </FormLabel>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <Select
                    value={field.value ?? "NONE"}
                    onValueChange={(v) =>
                      field.onChange(v === "NONE" ? null : v)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 flex-1 min-w-0 rounded-lg bg-white border border-slate-200 font-normal px-4 text-xs sm:text-sm">
                        <SelectValue placeholder="เลือกเจ้าของ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white rounded-xl shadow-lg border-none max-h-[300px] overflow-y-auto custom-scrollbar">
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

                  <Dialog open={isAddingOwner} onOpenChange={setIsAddingOwner}>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 shrink-0 rounded-lg border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm"
                      onClick={() => setIsAddingOwner(true)}
                      title="เพิ่มเจ้าของใหม่"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none custom-scrollbar">
                      <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                        <DialogHeader className="p-6 bg-slate-50/50 border-b border-slate-100">
                          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                              <Plus className="w-5 h-5" />
                            </div>
                            เพิ่มเจ้าของทรัพย์ใหม่
                          </DialogTitle>
                          <DialogDescription className="text-slate-500">
                            กรอกข้อมูลเจ้าของทรัพย์เพื่อบันทึกลงในระบบ
                          </DialogDescription>
                        </DialogHeader>

                        <div className="p-6">
                          <OwnerForm
                            mode="create"
                            onCancel={() => setIsAddingOwner(false)}
                            onSuccess={async () => {
                              setIsAddingOwner(false);
                              if (refreshOwners) {
                                const newOwners = await refreshOwners();
                                // Option: Automatically select the latest one
                                if (newOwners && newOwners.length > 0) {
                                  // Sort by created_at if possible, or just the last one
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
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </FormItem>
            )}
          />

          {/* 🏢 Stock Management - Responsive Column Layout */}
          <div className="col-span-1 md:col-span-2 grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
            {/* Total Units */}
            <FormField
              control={form.control}
              name="total_units"
              render={({ field }) => (
                <div className="lg:col-span-4 flex items-center justify-between lg:justify-start gap-2">
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-tight whitespace-nowrap">
                    ยูนิตทั้งหมด:
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        const val = (field.value || 0) - 1;
                        if (val >= 1) field.onChange(val);
                      }}
                      className="h-9 w-9 flex items-center justify-center rounded-l-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
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
                      className="h-9 w-12 text-center border-y border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = (field.value ?? 1) + 1;
                        field.onChange(val);
                      }}
                      className="h-9 w-9 flex items-center justify-center rounded-r-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
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
                <div className="lg:col-span-4 flex items-center justify-between lg:justify-start gap-2">
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-tight whitespace-nowrap">
                    ปล่อยแล้ว:
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        const val = (field.value || 0) - 1;
                        if (val >= 0) field.onChange(val);
                      }}
                      className="h-9 w-9 flex items-center justify-center rounded-l-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
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
                      className="h-9 w-12 text-center border-y border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = (field.value ?? 0) + 1;
                        field.onChange(val);
                      }}
                      className="h-9 w-9 flex items-center justify-center rounded-r-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            />

            {/* Remaining - Highlight */}
            <div className="lg:col-span-4 flex items-center justify-between lg:justify-end gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 mt-2 lg:mt-0">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-tight">
                คงเหลือ:
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-sm ${
                  (totalUnits ?? 1) - (soldUnits ?? 0) > 0
                    ? "bg-emerald-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {(totalUnits ?? 1) - (soldUnits ?? 0)} ยูนิต
                {(totalUnits ?? 1) - (soldUnits ?? 0) > 0 && (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 my-1 sm:my-2" />

        {/* Agent Multi Select */}
        <AgentMultiSelect form={form} agents={agents} />
      </div>
    </section>
  );
};
