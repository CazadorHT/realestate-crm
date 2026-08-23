"use client";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { OwnerForm } from "@/features/owners/OwnerForm";
import React, { useState, useEffect } from "react";
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
import { ShieldCheck, Activity, User, Minus, Plus, Info, Check, Search, Phone, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFormContext, useWatch, type UseFormReturn } from "react-hook-form";
import { PropertyFormValues } from "../../../schema";
import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_ORDER,
  PropertyStatus,
} from "@/features/properties/labels";
import { AgentMultiSelect } from "../../sections/AgentMultiSelect";
import { Button } from "@/components/ui/button";
import { FaUserPlus } from "react-icons/fa";
import { CoBrokerSelect } from "@/features/co-brokers/components/CoBrokerSelect";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface ManagementSectionProps {
  form?: UseFormReturn<PropertyFormValues>; // Optional: falls back to useFormContext
  owners: Array<{ id: string; full_name: string; phone: string | null; created_at?: string; line_id?: string | null }>;
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
  const { language } = useLanguage();
  const isEn = language === "en";
  const formContext = useFormContext<PropertyFormValues>();
  const form = formProp || formContext;
  const [isAddingOwner, setIsAddingOwner] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newlyCreatedOwnerId, setNewlyCreatedOwnerId] = useState<string | null>(null);
  const [prefilledOwnerName, setPrefilledOwnerName] = useState("");

  const isNewOwner = (createdAtStr?: string) => {
    if (!createdAtStr) return false;
    try {
      const createdAt = new Date(createdAtStr);
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours <= 24;
    } catch {
      return false;
    }
  };

  const filteredOwners = owners.filter((o) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = o.full_name.toLowerCase().includes(term);
    const phoneMatch = o.phone ? o.phone.includes(term) : false;
    return nameMatch || phoneMatch;
  });

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1535px)");
    const onChange = () => setIsMobileOrTablet(mql.matches);
    mql.addEventListener("change", onChange);
    setIsMobileOrTablet(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

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
            {isEn ? "Management & Inventory" : "การจัดการ (Management)"}
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-500">
            {isEn ? "Manage listing status, ownership and allocation" : "จัดการข้อมูลทรัพย์สิน"}
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
                  <span>{isEn ? "Listing Status" : "สถานะประกาศ (Status)"}</span>
                </FormLabel>
                {isMobileOrTablet ? (
                  <ResponsiveDialog
                    open={statusOpen}
                    onOpenChange={setStatusOpen}
                    title={isEn ? "Select Listing Status" : "เลือกสถานะประกาศ"}
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full h-11! rounded-xl border-2 px-4 text-sm font-bold transition-all shadow-sm justify-between text-left",
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
                        <span>{PROPERTY_STATUS_LABELS[field.value as PropertyStatus]?.[isEn ? "en" : "th"] || field.value}</span>
                      </Button>
                    }
                  >
                    <div className="p-4 max-h-[60vh] grid grid-cols-2 overflow-y-auto space-y-2 gap-2 bg-white">
                      {PROPERTY_STATUS_ORDER.map((s) => {
                        const isSelected = field.value === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              field.onChange(s);
                              setStatusOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between p-3.5 rounded-xl transition-all active:scale-[0.98] border text-left",
                              isSelected
                                ? "bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm"
                                : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700",
                            )}
                          >
                            <span className="flex items-center gap-3 text-xs font-bold">
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
                              <span>{PROPERTY_STATUS_LABELS[s]?.[isEn ? "en" : "th"] || s}</span>
                            </span>
                            {isSelected && (
                              <div className="bg-blue-600 rounded-full p-1 text-white shrink-0">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </ResponsiveDialog>
                ) : (
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
                    <SelectContent className="bg-white rounded-2xl shadow-xl border-none p-1">
                      {PROPERTY_STATUS_ORDER.map((s) => (
                        <SelectItem
                          key={s}
                          value={s}
                          className="py-3 font-medium text-sm rounded-lg"
                        >
                          <span className="flex items-center gap-3">
                            <span
                              className={cn(
                                "w-2.5 h-2.5 rounded-full shrink-0 shadow-inner",
                                s === "ACTIVE" && "bg-emerald-500",
                                s === "DRAFT" && "bg-slate-400",
                                s === "ARCHIVED" && "bg-slate-800",
                                (s === "SOLD" || s === "RENTED") && "bg-red-500",
                                (s === "UNDER_OFFER" || s === "RESERVED") &&
                                  "bg-amber-500",
                              )}
                            />
                            <span>{PROPERTY_STATUS_LABELS[s]?.[isEn ? "en" : "th"] || s}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
                    <span>{isEn ? "Property Owner" : "เจ้าของทรัพย์ (Owner)"}</span>
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
                            {isEn ? "All Branches" : "ทุกสาขา"}
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
                        <span>{isEn ? "ℹ️ Supports Co-Agent record" : "ℹ️ บันทึกคู่กับ Co-Agent ได้"}</span>
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                      {isEn ? "Private 🔒" : "ส่วนตัว 🔒"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                  {(() => {
                    const selectedOwner = owners.find((o) => o.id === field.value);
                    return (
                      <div className="flex-1 min-w-0 flex items-stretch gap-2">
                        {isMobileOrTablet ? (
                          <ResponsiveDialog
                            open={ownerOpen}
                            onOpenChange={setOwnerOpen}
                            title={isEn ? "Select Property Owner" : "เลือกเจ้าของทรัพย์"}
                            trigger={
                              <Button
                                type="button"
                                variant="outline"
                                className="h-11! flex-1 min-w-0 rounded-xl bg-white border-slate-200 hover:border-slate-300 transition-colors font-medium px-4 text-sm shadow-sm justify-between text-left"
                              >
                                <span className="truncate">
                                  {selectedOwner
                                    ? `K. ${selectedOwner.full_name}${selectedOwner.phone ? ` (${selectedOwner.phone})` : ""}`
                                    : (isEn ? "Search or select owner" : "ค้นหาหรือเลือกเจ้าของ")}
                                </span>
                              </Button>
                            }
                          >
                      <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2 bg-white">
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange(null);
                            setOwnerOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between p-3.5 rounded-xl transition-all active:scale-[0.98] border text-left",
                            !field.value
                              ? "bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm"
                              : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700",
                          )}
                        >
                          <span className="text-xs font-bold italic text-slate-400">{isEn ? "-- No Owner Specified --" : "-- ไม่ระบุเจ้าของ --"}</span>
                          {!field.value && (
                            <div className="bg-blue-600 rounded-full p-1 text-white shrink-0">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </button>
                        {owners.map((o) => {
                          const isSelected = field.value === o.id;
                          return (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => {
                                field.onChange(o.id);
                                setOwnerOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center justify-between p-3.5 rounded-xl transition-all active:scale-[0.98] border text-left",
                                isSelected
                                  ? "bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm"
                                  : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700",
                              )}
                            >
                              <span className="text-xs font-bold flex items-center gap-1.5 min-w-0">
                                <span className="text-slate-500 mr-1.5 shrink-0">K.</span>
                                <span className="inline-block truncate flex-1 min-w-0 align-bottom">{o.full_name}</span>{" "}
                                {o.phone && (
                                  <span className="text-[10px] text-slate-400 font-normal ml-2 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 shrink-0">
                                    {o.phone}
                                  </span>
                                )}
                              </span>
                              {isSelected && (
                                <div className="bg-blue-600 rounded-full p-1 text-white shrink-0">
                                  <Check className="h-3 w-3" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </ResponsiveDialog>
                  ) : (
                    <Select
                      value={field.value ?? "NONE"}
                      onValueChange={(v) =>
                        field.onChange(v === "NONE" ? null : v)
                      }
                      onOpenChange={(open) => {
                        if (!open) setSearchTerm("");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11! w-full flex-1 min-w-0 rounded-xl bg-white border-slate-200 hover:border-slate-300 transition-colors font-medium px-4 text-sm shadow-sm overflow-hidden">
                          <SelectValue placeholder={isEn ? "Search or select owner" : "ค้นหาหรือเลือกเจ้าของ"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white rounded-2xl shadow-xl border-none max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                        <div 
                          className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50 sticky top-0 z-10"
                          onClick={(e) => e.stopPropagation()} 
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            placeholder={isEn ? "Search name or phone..." : "พิมพ์ค้นหาชื่อ หรือเบอร์..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white  placeholder:text-sm placeholder:font-medium border-none text-xs outline-none placeholder:text-slate-400 text-slate-700"
                          />
                          {searchTerm && (
                            <button
                              type="button"
                              onClick={() => setSearchTerm("")}
                              className="text-[10px] text-slate-400 hover:text-slate-600 font-medium px-1"
                            >
                              {isEn ? "Clear" : "ล้าง"}
                            </button>
                          )}
                        </div>
                        <SelectItem
                          value="NONE"
                          className="font-medium text-slate-400 text-sm italic py-3 rounded-lg"
                        >
                          {isEn ? "-- No Owner Specified --" : "-- ไม่ระบุเจ้าของ --"}
                        </SelectItem>
                        {searchTerm && (
                          <div className="p-2 border-b border-slate-100 bg-slate-50/20" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => {
                                setPrefilledOwnerName(searchTerm);
                                setIsAddingOwner(true);
                              }}
                              className="w-full flex items-center gap-2 p-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl border border-dashed border-emerald-200 transition-all text-left"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{isEn ? `Add new owner named "${searchTerm}"` : `เพิ่มเจ้าของใหม่ชื่อ "${searchTerm}"`}</span>
                            </button>
                          </div>
                        )}
                        {filteredOwners.length === 0 && searchTerm ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            {isEn ? "No matching owners found" : "ไม่พบรายชื่อที่ค้นหา"}
                          </div>
                        ) : (
                          filteredOwners.map((o) => {
                            const isNew = isNewOwner(o.created_at) || o.id === newlyCreatedOwnerId;
                            return (
                              <SelectItem
                                key={o.id}
                                value={o.id}
                                className="py-3 font-medium text-sm rounded-lg"
                              >
                                <span className="flex items-center gap-1.5 min-w-0 w-full overflow-hidden">
                                  <span className="text-slate-500 shrink-0">K.</span>
                                  <span className="inline-block truncate flex-1 min-w-0 max-w-[80px] align-bottom">{o.full_name}</span>
                                  {isNew && (
                                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200 shrink-0">
                                      NEW
                                    </span>
                                  )}
                                  {o.phone && (
                                    <span className="text-[11px] text-slate-400 font-normal ml-2 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 shrink-0">
                                      {o.phone}
                                    </span>
                                  )}
                                </span>
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  )}

                  {selectedOwner && (selectedOwner.phone || selectedOwner.line_id) && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {selectedOwner.phone && (
                        <a
                          href={`tel:${selectedOwner.phone}`}
                          title={isEn ? `Call K. ${selectedOwner.full_name}` : `โทรหา K. ${selectedOwner.full_name}`}
                          className="h-11 w-11 flex items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      {selectedOwner.line_id && (
                        <button
                          type="button"
                          title={isEn ? `Copy Line ID of K. ${selectedOwner.full_name}` : `คัดลอก Line ID ของ K. ${selectedOwner.full_name}`}
                          onClick={() => {
                            navigator.clipboard.writeText(selectedOwner.line_id || "");
                            toast.success(isEn ? `Line ID "${selectedOwner.line_id}" copied!` : `คัดลอก Line ID "${selectedOwner.line_id}" สำเร็จ`);
                          }}
                          className="h-11 w-11 flex items-center justify-center rounded-xl border border-green-100 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white hover:border-green-600 transition-all shadow-sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

                  <ResponsiveDialog
                    open={isAddingOwner}
                    onOpenChange={setIsAddingOwner}
                    title={isEn ? "Add New Owner" : "เพิ่มเจ้าของทรัพย์ใหม่"}
                    description={isEn ? "Record owner details to match listings and manage communication" : "กรอกข้อมูลเจ้าของทรัพย์เพื่อบันทึกลงในระบบเพื่อใช้ในการจับคู่ทรัพย์สิน"}
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 px-4 shrink-0 rounded-xl border-emerald-200 bg-emerald-50/30 text-emerald-700 hover:text-white hover:bg-emerald-600 hover:border-emerald-700 transition-all shadow-sm group font-bold text-xs"
                      >
                        <FaUserPlus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                        {isEn ? "Add New Owner" : "เพิ่มเจ้าของใหม่"}
                      </Button>
                    }
                  >
                    <div className="py-4">
                      <OwnerForm
                        mode="create"
                        initialValues={prefilledOwnerName ? { full_name: prefilledOwnerName } : undefined}
                        onCancel={() => {
                          setIsAddingOwner(false);
                          setPrefilledOwnerName("");
                        }}
                        onSuccess={async (newOwnerId) => {
                          setIsAddingOwner(false);
                          setPrefilledOwnerName("");
                          if (newOwnerId) {
                            setNewlyCreatedOwnerId(newOwnerId);
                          }
                          if (refreshOwners) {
                            await refreshOwners();
                          }
                          // ดีเลย์เล็กน้อยเพื่อให้ React อัปเดต State รายการเจ้าของคนใหม่ใน Dropdown สำเร็จก่อนเลือกค่า
                          setTimeout(() => {
                            if (newOwnerId) {
                              form.setValue("owner_id", newOwnerId, {
                                shouldValidate: true,
                                shouldDirty: true,
                                shouldTouch: true,
                              });
                            }
                          }, 150);
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
                  {isEn ? "Total Units:" : "จำนวนยูนิตทั้งหมด:"}
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
                  {isEn ? "Sold / Reserved Units:" : "ปล่อย/จองแล้ว:"}
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
              {isEn ? "Current Available Units:" : "คงเหลือปัจจุบัน:"}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-black shadow-sm ring-1 ring-inset ${
                (totalUnits ?? 1) - (soldUnits ?? 0) > 0
                  ? "bg-emerald-500 text-white ring-emerald-600"
                  : "bg-red-500 text-white ring-red-600"
              }`}
            >
              <span>{(totalUnits ?? 1) - (soldUnits ?? 0)} {isEn ? "Units" : "ยูนิต"}</span>
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
              <h4 className="text-xs font-bold uppercase tracking-widest">{isEn ? "Co-Agent Details" : "ข้อมูลผู้ดูแลจากภายนอก (Co-Agent Details)"}</h4>
            </div>

            {/* 🔍 Centralized Directory Selection */}
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
              <CoBrokerSelect />
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1.5">
                <Info className="w-3 h-3" />
                <span>{isEn ? "Tip: Selecting from the co-broker directory records statistics and speeds up data entry." : "เคล็ดลับ: การเลือกจากฐานข้อมูลกลางจะช่วยบันทึกสถิติและลดเวลาการกรอกข้อมูล"}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="co_agent_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{isEn ? "Co-Agent Name" : "ชื่อ Co-Agent"}</FormLabel>
                    <FormControl>
                      <input 
                        {...field} 
                        value={field.value || ""} 
                        placeholder={isEn ? "External agent name" : "ระบุชื่อเอเยนต์เจ้าของทรัพย์"}
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
                    <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{isEn ? "Phone Number" : "เบอร์โทรติดต่อ"}</FormLabel>
                    <FormControl>
                      <input 
                        {...field} 
                        value={field.value || ""} 
                        placeholder={isEn ? "Contact phone number" : "เลขเบอร์โทรศัพท์"}
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
                    <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{isEn ? "Contact Channel" : "ช่องทางที่โค (Channel)"}</FormLabel>
                    {isMobileOrTablet ? (
                      <ResponsiveDialog
                        open={channelOpen}
                        onOpenChange={setChannelOpen}
                        title={isEn ? "Select Contact Channel" : "เลือกช่องทางติดต่อ"}
                        trigger={
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11! rounded-xl bg-white border border-slate-200 justify-between text-left font-medium text-xs px-4"
                          >
                            <span>{field.value || (isEn ? "Select contact channel" : "เลือกช่องทางติดต่อ")}</span>
                          </Button>
                        }
                      >
                        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2 bg-white">
                          {[
                            { label: "LINE", value: "LINE" },
                            { label: "WhatsApp", value: "WHATSAPP" },
                            { label: isEn ? "Phone" : "โทรศัพท์", value: "PHONE" },
                            { label: "Facebook", value: "FACEBOOK" },
                            { label: "WeChat", value: "WECHAT" },
                            { label: isEn ? "Other" : "อื่นๆ", value: "OTHER" },
                          ].map((item) => {
                            const isSelected = field.value === item.value;
                            return (
                              <button
                                key={item.value}
                                type="button"
                                onClick={() => {
                                  field.onChange(item.value);
                                  setChannelOpen(false);
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between p-3.5 rounded-xl transition-all active:scale-[0.98] border text-left",
                                  isSelected
                                    ? "bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm"
                                    : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700",
                                )}
                              >
                                <span className="text-xs font-bold">{item.label}</span>
                                {isSelected && (
                                  <div className="bg-blue-600 rounded-full p-1 text-white shrink-0">
                                    <Check className="h-3 w-3" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </ResponsiveDialog>
                    ) : (
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="h-11! rounded-xl bg-white border-slate-200">
                            <SelectValue placeholder={isEn ? "Select contact channel" : "เลือกช่องทางติดต่อ"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white rounded-xl">
                          <SelectItem value="LINE">LINE</SelectItem>
                          <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                          <SelectItem value="PHONE">{isEn ? "Phone" : "โทรศัพท์"}</SelectItem>
                          <SelectItem value="FACEBOOK">Facebook</SelectItem>
                          <SelectItem value="WECHAT">WeChat</SelectItem>
                          <SelectItem value="OTHER">{isEn ? "Other" : "อื่นๆ"}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="co_agent_contact_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{isEn ? "ID / Contact Notes" : "ID / หมายเหตุติดต่อ"}</FormLabel>
                    <FormControl>
                      <input 
                        {...field} 
                        value={field.value || ""} 
                        placeholder={isEn ? "e.g. Line ID or listing post link" : "เช่น Line ID หรือลิ้งค์โพสต์"}
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
                      <span>{isEn ? "Sale Split (%)" : "ส่วนแบ่งขาย (%)"}</span>
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
                      <span>{isEn ? "Rent Split (Mo)" : "ส่วนแบ่งเช่า (เดือน)"}</span>
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
                        <span className="text-xs font-bold text-blue-600">{isEn ? "Mo" : "ด."}</span>
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
