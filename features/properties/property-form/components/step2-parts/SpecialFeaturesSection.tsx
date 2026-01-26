"use client";

import React from "react";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SectionHeader } from "../SectionHeader";
import {
  Building2,
  Cigarette,
  Globe,
  Home,
  LayoutGrid,
  PackageCheck,
  PackageX,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Users,
  Waves,
  LucideIcon,
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { PropertyFormValues } from "@/features/properties/schema";

// Helper Button Component
function FeatureToggleBtn({
  form,
  name,
  label,
  icon: Icon,
  activeColor,
  isReadOnly,
}: {
  form: UseFormReturn<PropertyFormValues>;
  name: keyof PropertyFormValues; // keyof instead of string to match schema
  label: string;
  icon: LucideIcon;
  activeColor:
    | "orange"
    | "indigo"
    | "rose"
    | "emerald"
    | "blue"
    | "slate"
    | "purple"
    | "cyan"
    | "green";
  isReadOnly: boolean;
}) {
  const colorStyles: Record<string, string> = {
    orange:
      "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 ring-orange-200",
    indigo:
      "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 ring-indigo-200",
    rose: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 ring-rose-200",
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-emerald-200",
    blue: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 ring-blue-200",
    slate:
      "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 ring-slate-200",
    purple:
      "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 ring-purple-200",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 ring-cyan-200",
    green:
      "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 ring-green-200",
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const isActive = field.value === true;
        const activeStyle = isActive
          ? `ring-2 ring-offset-1 ${colorStyles[activeColor]}`
          : "border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700";

        return (
          <FormItem className="space-y-0">
            <FormControl>
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => field.onChange(!field.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${activeStyle}`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive ? "currentColor" : "text-slate-400"}`}
                />
                {label}
              </button>
            </FormControl>
          </FormItem>
        );
      }}
    />
  );
}

interface SpecialFeaturesSectionProps {
  form: UseFormReturn<PropertyFormValues>;
  isReadOnly: boolean;
}

export function SpecialFeaturesSection({
  form,
  isReadOnly,
}: SpecialFeaturesSectionProps) {
  return (
    <Card className="border-slate-200/70 bg-white">
      <CardHeader className="space-y-3">
        <SectionHeader
          icon={Sparkles}
          title="คุณสมบัติพิเศษ"
          desc="ช่วยกรองลูกค้าได้เร็วและแม่นยำ"
          tone="purple"
        />
        <Separator className="bg-slate-200/70" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Verified Toggle (Moved to top) */}
        <FormField
          control={form.control}
          name="verified"
          render={({ field }) => (
            <FormItem className="rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-2 transition-all hover:bg-blue-50 hover:border-blue-300">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <FormLabel className="text-base font-medium text-blue-800 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    Verified Listing
                  </FormLabel>
                  <p className="text-xs text-blue-600/80">
                    เปิดเมื่อตรวจสอบเอกสารสิทธิ์และทรัพย์จริงแล้ว
                    (ช่วยเพิ่มความน่าเชื่อถือ)
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isReadOnly}
                    className="data-[state=checked]:bg-blue-600 scale-110"
                  />
                </FormControl>
              </div>
            </FormItem>
          )}
        />

        <Separator className="bg-slate-100" />

        {/* Group 1: Pet & Rules */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <PawPrint className="h-4 w-4 text-orange-500" />
            กฎระเบียบและการเลี้ยงสัตว์
          </h4>
          <div className="flex flex-wrap gap-3">
            <FeatureToggleBtn
              form={form}
              name="is_pet_friendly"
              label="Pet Friendly"
              icon={PawPrint}
              activeColor="orange"
              isReadOnly={isReadOnly}
            />
            <FeatureToggleBtn
              form={form}
              name="is_foreigner_quota"
              label="รับชาวต่างชาติ"
              icon={Globe}
              activeColor="indigo"
              isReadOnly={isReadOnly}
            />
            <FeatureToggleBtn
              form={form}
              name="allow_smoking"
              label="สูบบุหรี่ได้"
              icon={Cigarette}
              activeColor="rose"
              isReadOnly={isReadOnly}
            />
          </div>
        </div>

        <Separator className="bg-slate-100" />

        {/* Group 2: Furnishing Condition */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-500" />
            สภาพและเฟอร์นิเจอร์
          </h4>
          <div className="flex flex-wrap gap-3">
            <FeatureToggleBtn
              form={form}
              name="is_renovated"
              label="รีโนเวทใหม่"
              icon={Home}
              activeColor="emerald"
              isReadOnly={isReadOnly}
            />
            <FeatureToggleBtn
              form={form}
              name="is_fully_furnished"
              label="เฟอร์ฯ ครบ"
              icon={PackageCheck}
              activeColor="blue"
              isReadOnly={isReadOnly}
            />
            <FeatureToggleBtn
              form={form}
              name="is_unfurnished"
              label="ห้องเปล่า"
              icon={PackageX}
              activeColor="slate"
              isReadOnly={isReadOnly}
            />
          </div>
        </div>

        <Separator className="bg-slate-100" />

        {/* Group 3: Highlights */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            จุดเด่นพิเศษ
          </h4>
          <div className="flex flex-wrap gap-3">
            <FeatureToggleBtn
              form={form}
              name="is_corner_unit"
              label="ห้องมุม"
              icon={LayoutGrid}
              activeColor="purple"
              isReadOnly={isReadOnly}
            />
            <FeatureToggleBtn
              form={form}
              name="has_private_pool"
              label="สระส่วนตัว"
              icon={Waves}
              activeColor="cyan"
              isReadOnly={isReadOnly}
            />
            <FeatureToggleBtn
              form={form}
              name="is_selling_with_tenant"
              label="ขายพร้อมผู้เช่า"
              icon={Users}
              activeColor="green"
              isReadOnly={isReadOnly}
            />
          </div>
        </div>

        <Separator className="bg-slate-100" />
      </CardContent>
    </Card>
  );
}
