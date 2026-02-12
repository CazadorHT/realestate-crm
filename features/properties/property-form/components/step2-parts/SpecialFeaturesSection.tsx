"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { PropertyFormValues } from "@/features/properties/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Star,
  CheckCircle2,
  PawPrint,
  Globe2,
  Cigarette,
  UserCheck,
  Hammer,
  Armchair,
  BoxSelect,
  LayoutDashboard,
  Maximize,
  TreePine,
  Waves,
  Building2,
  Compass,
  Medal,
  Layers,
  Wind,
  Wifi,
  CloudSun,
  ShieldCheck,
  Sunset,
  ArrowUpFromLine,
  Scan,
} from "lucide-react";

interface SpecialFeaturesSectionProps {
  form: UseFormReturn<PropertyFormValues>;
  isReadOnly: boolean;
}

export function SpecialFeaturesSection({
  form,
  isReadOnly,
}: SpecialFeaturesSectionProps) {
  return (
    <Card className="col-span-2 border-slate-200/70 bg-white h-full relative overflow-hidden">
      <CardHeader className="space-y-3 sm:space-y-4 pb-4 px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">
              คุณสมบัติพิเศษ
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              ฟีเจอร์และจุดขายที่ใช้วางแผนการตลาด
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 sm:space-y-8 px-3 sm:px-6">
        {/* Verified Listing Banner */}
        <FormField
          control={form.control}
          name="verified"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm">
              <div className="space-y-1">
                <FormLabel className="flex items-center gap-2 text-base font-bold text-blue-700">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  Verified Listing
                </FormLabel>
                <p className="text-xs text-blue-600/80">
                  เปิดตัวเลือกนี้เพื่อระบุว่าทรัพย์นี้ได้รับการตรวจสอบเอกสารสิทธิ์แล้ว
                  (ช่วยเพิ่มความน่าเชื่อถือ)
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    toast.success(
                      checked
                        ? "เปิด Verified Listing สำเร็จ"
                        : "ปิด Verified Listing สำเร็จ",
                    );
                  }}
                  disabled={isReadOnly}
                  className="data-[state=checked]:bg-blue-600"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Group 1: Rules & Rights */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-500 flex items-center gap-2">
            <UserCheck className="h-4 w-4" /> กฎระเบียบและทางเลือก
          </h4>
          <div className="flex flex-wrap gap-3">
            <FeatureChip
              form={form}
              name="is_pet_friendly"
              label="Pet Friendly"
              icon={PawPrint}
              color="orange"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="is_foreigner_quota"
              label={
                form.watch("listing_type") === "SALE"
                  ? "โควต้าต่างชาติ (Foreigner Quota)"
                  : form.watch("listing_type") === "RENT"
                    ? "รับชาวต่างชาติ"
                    : "โควต้าต่างชาติ / รับชาวต่างชาติ"
              }
              icon={Globe2}
              color="blue"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="allow_smoking"
              label="สูบบุหรี่ได้"
              icon={Cigarette}
              color="red"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="is_selling_with_tenant"
              label="ขายพร้อมผู้เช่า"
              icon={UserCheck}
              color="amber"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="is_exclusive"
              label="Exclusive (Sole Agent)"
              icon={Star}
              color="amber"
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* Group 2: Condition & Decor */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-500 flex items-center gap-2">
            <Armchair className="h-4 w-4" /> สภาพและเฟอร์นิเจอร์
          </h4>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <FeatureChip
              form={form}
              name="is_renovated"
              label="รีโนเวทใหม่"
              icon={Hammer}
              color="emerald"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="is_corner_unit"
              label="ห้องหัวมุม"
              icon={LayoutDashboard}
              color="purple"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="is_fully_furnished"
              label="เฟอร์ฯ ครบ"
              icon={Armchair}
              color="indigo"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="is_bare_shell"
              label="ห้องเปล่า / พื้นที่เปล่า"
              icon={BoxSelect}
              color="amber"
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* Group 3: View & Direction */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-500 flex items-center gap-2">
            <CloudSun className="h-4 w-4" /> วิวและบรรยากาศ
          </h4>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <FeatureChip
              form={form}
              name="has_garden_view"
              label="วิวสวน"
              icon={TreePine}
              color="green"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="has_pool_view"
              label="วิวสระ"
              icon={Waves}
              color="cyan"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="has_city_view"
              label="วิวเมือง"
              icon={Building2}
              color="violet"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="has_private_pool"
              label="สระว่ายน้ำส่วนตัว"
              icon={Waves}
              color="cyan"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="has_unblocked_view"
              label="วิวไม่บล็อก"
              icon={Scan}
              color="sky"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="has_river_view"
              label="วิวแม่น้ำ"
              icon={Waves}
              color="blue"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="facing_east"
              label="ทิศตะวันออก (แดดเช้า/ไม่ร้อนบ่าย)"
              icon={Compass}
              color="amber"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="facing_north"
              label="ทิศเหนือ (ไม่ร้อน)"
              icon={Compass}
              color="blue"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="facing_south"
              label="ทิศใต้ (ลมดี)"
              icon={Wind}
              color="teal"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="facing_west"
              label="ทิศตก (วิวพระอาทิตย์ตก)"
              icon={Sunset}
              color="orange"
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* Group 4: Office & Building Specs */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-500 flex items-center gap-2">
            <Building2 className="h-4 w-4" /> สำนักงานและอาคาร
          </h4>
          <div className="flex flex-wrap gap-3">
            <FeatureChip
              form={form}
              name="is_grade_a"
              label="Grade A"
              icon={Medal}
              color="purple"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="is_grade_b"
              label="Grade B"
              icon={Medal}
              color="blue"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="is_grade_c"
              label="Grade C"
              icon={Medal}
              color="blue"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="has_raised_floor"
              label="พื้นยก"
              icon={Layers}
              color="sky"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="is_high_ceiling"
              label="เพดานสูง"
              icon={ArrowUpFromLine}
              color="indigo"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="is_column_free"
              label="ไม่มีเสากลาง"
              icon={Maximize}
              color="cyan"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="is_central_air"
              label="แอร์รวม"
              icon={Wind}
              color="teal"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="is_split_air"
              label="แอร์แยก"
              icon={Wind}
              color="cyan"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="has_247_access"
              label="เข้า-ออก 24 ชม."
              icon={CheckCircle2}
              color="indigo"
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* Group 5: Services */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-500 flex items-center gap-2">
            <Wifi className="h-4 w-4" /> อื่นๆ และบริการ
          </h4>
          <div className="flex flex-wrap gap-3">
            <FeatureChip
              form={form}
              name="has_fiber_optic"
              label="Fiber Optic"
              icon={Wifi}
              color="sky"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="is_tax_registered"
              label="จดทะเบียนภาษี/บริษัทได้"
              icon={CheckCircle2}
              color="fuchsia"
              disabled={isReadOnly}
            />
            <FeatureChip
              form={form}
              name="has_multi_parking"
              label="จอดรถ > 1 คัน"
              icon={CheckCircle2}
              color="blue"
              disabled={isReadOnly}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Styled Feature Chip Component
// ----------------------------------------------------------------------

// Color Maps for "Active" state
const COLOR_MAP: Record<string, string> = {
  orange:
    "border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300",
  blue: "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300",
  green: "border-green-200 bg-green-50 text-green-700 hover:border-green-300",
  emerald:
    "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300",
  red: "border-red-200 bg-red-50 text-red-700 hover:border-red-300",
  purple:
    "border-purple-200 bg-purple-50 text-purple-700 hover:border-purple-300",
  indigo:
    "border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300",
  amber: "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700 hover:border-cyan-300",
  violet:
    "border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300",
  sky: "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300",
  teal: "border-teal-200 bg-teal-50 text-teal-700 hover:border-teal-300",
  fuchsia:
    "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 hover:border-fuchsia-300",
  pink: "border-pink-200 bg-pink-50 text-pink-700 hover:border-pink-300",
};

// Icon Color Maps
const ICON_COLOR_MAP: Record<string, string> = {
  orange: "text-orange-500",
  blue: "text-blue-500",
  green: "text-green-500",
  emerald: "text-emerald-500",
  red: "text-red-500",
  purple: "text-purple-500",
  indigo: "text-indigo-500",
  amber: "text-amber-500",
  cyan: "text-cyan-500",
  violet: "text-violet-500",
  sky: "text-sky-500",
  teal: "text-teal-500",
  fuchsia: "text-fuchsia-500",
  pink: "text-pink-500",
};

interface FeatureChipProps {
  form: UseFormReturn<PropertyFormValues>;
  name: keyof PropertyFormValues;
  label: string;
  icon: React.ElementType;
  title?: string;
  color:
    | "orange"
    | "blue"
    | "green"
    | "emerald"
    | "red"
    | "purple"
    | "indigo"
    | "amber"
    | "cyan"
    | "violet"
    | "sky"
    | "teal"
    | "fuchsia"
    | "pink";
  disabled?: boolean;
}

function FeatureChip({
  form,
  name,
  label,
  icon: Icon,
  color,
  disabled,
}: FeatureChipProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const isChecked = !!field.value;
        return (
          <FormItem className="space-y-0 ">
            <FormControl>
              <button
                type="button"
                onClick={() => field.onChange(!field.value)}
                disabled={disabled}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 transition-all shadow-sm",
                  "hover:shadow-md active:scale-95",
                  isChecked
                    ? `${COLOR_MAP[color]} border-transparent ring-1 ring-offset-0`
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50/80",
                  disabled &&
                    "opacity-50 cursor-not-allowed pointer-events-none",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isChecked ? ICON_COLOR_MAP[color] : "text-slate-400",
                  )}
                />
                <span className="text-sm font-medium whitespace-nowrap">
                  {label}
                </span>
              </button>
            </FormControl>
          </FormItem>
        );
      }}
    />
  );
}
