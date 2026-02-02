"use client";
import { useState, useTransition } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { leadFormSchema, type LeadFormValues } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LEAD_STAGE_ORDER,
  LEAD_SOURCE_ORDER,
  LEAD_STAGE_LABELS,
  LEAD_SOURCE_LABELS,
  NATIONALITY_OPTIONS,
} from "./labels";
import {
  UserCircle,
  Phone,
  Mail,
  Search,
  DollarSign,
  Bed,
  Bath,
  Maximize,
  Users,
  PawPrint,
  Briefcase,
  PlaneTakeoff,
  Globe,
  MapPin,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar,
  Cigarette,
  Save,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  leadId?: string;
  initialValues?: Partial<LeadFormValues>;
  onSubmitAction: (values: LeadFormValues) => Promise<void>;
};

import { useRouter } from "next/navigation";
import { toast } from "sonner";

function isNextRedirectError(e: unknown) {
  return (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    typeof (e as any).digest === "string" &&
    (e as any).digest.startsWith("NEXT_REDIRECT")
  );
}

export function LeadForm({ leadId, initialValues, onSubmitAction }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema) as unknown as Resolver<any>,
    mode: "onChange",
    defaultValues: {
      full_name: "",
      stage: "NEW",
      source: "OTHER",
      budget_min: null,
      budget_max: null,
      min_bedrooms: null,
      min_bathrooms: null,
      min_size_sqm: null,
      max_size_sqm: null,
      num_occupants: null,
      has_pets: false,
      need_company_registration: false,
      allow_airbnb: false,
      is_foreigner: false,
      lead_type: "INDIVIDUAL",
      nationality: ["ไทย"],
      preferred_locations: [], // New field for preferred locations
      note: "", // General notes
      ...initialValues,
    },
  });

  const onSubmit = (values: LeadFormValues) => {
    setError(null);
    startTransition(async () => {
      try {
        await onSubmitAction(values);
        toast.success("บันทึกข้อมูลสำเร็จ");
      } catch (e: any) {
        if (isNextRedirectError(e)) {
          toast.success("บันทึกข้อมูลสำเร็จ");
          throw e;
        }
        toast.error(e?.message ?? "เกิดข้อผิดพลาด");
        setError(e?.message ?? "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <form className="space-y-6  mx-auto" onSubmit={form.handleSubmit(onSubmit)}>
      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm flex items-center gap-3">
          <Info className="h-4 w-4 text-destructive" />
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* --- LEFT COLUMN: Contact (Span 4) --- */}
        <div className="xl:col-span-4 space-y-6">
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
                          form.setValue(
                            "lead_type",
                            option.value as
                              | "INDIVIDUAL"
                              | "COMPANY"
                              | "JURISTIC_PERSON",
                          )
                        }
                        className={`
                          px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 flex-1 cursor-pointer
                          ${
                            isSelected
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200"
                              : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                          }
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
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
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
                    const currentVal = form.watch("nationality");
                    const selected = Array.isArray(currentVal)
                      ? currentVal
                      : typeof currentVal === "string" && currentVal.length > 0
                        ? currentVal.split(",").map((x) => x.trim())
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

                          // Auto-set is_foreigner logic
                          const hasThai = newSelected.includes("ไทย");
                          if (newSelected.length > 0 && !hasThai) {
                            form.setValue("is_foreigner", true);
                          } else if (hasThai) {
                            form.setValue("is_foreigner", false);
                          }
                        }}
                        className={`
                            flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200
                            ${
                              isSelected
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                                : "bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                            }
                          `}
                      >
                        <div
                          className={`
                             w-2 h-2 rounded-full shrink-0
                             ${isSelected ? "bg-emerald-500" : "bg-slate-300"}
                          `}
                        />
                        {nat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- RIGHT COLUMN: Requirements & Pipeline (Span 8) --- */}
        <div className="xl:col-span-8 space-y-6">
          {/* Requirements Card */}
          <Card className="shadow-lg border-slate-200 dark:border-slate-800 overflow-hidden">
            <CardHeader className="bg-linear-to-r from-slate-900 to-slate-800 border-b border-slate-700 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-white/10 text-white backdrop-blur-sm border border-white/20">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white font-bold">
                    ความต้องการทรัพย์
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    รายละเอียด Spec ที่ลูกค้ากำลังมองหา
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 space-y-4">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3">
                      <Maximize className="h-3.5 w-3.5" /> พื้นที่ใช้สอย (ตร.ม.)
                    </Label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 group-focus-within:text-slate-600 transition-colors">
                          MIN
                        </span>
                        <Input
                          type="number"
                          step="any"
                          className="pl-10 text-center text-sm font-medium h-10 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500/20"
                          placeholder="0"
                          {...form.register("min_size_sqm", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className="h-px w-4 bg-slate-300"></div>
                      <div className="relative flex-1 group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 group-focus-within:text-slate-600 transition-colors">
                          MAX
                        </span>
                        <Input
                          type="number"
                          step="any"
                          className="pl-10 text-center text-sm font-medium h-10 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500/20"
                          placeholder="∞"
                          {...form.register("max_size_sqm", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 space-y-4">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3">
                      <Bed className="h-3.5 w-3.5" /> ฟังก์ชันห้อง
                    </Label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 group">
                        <Bed className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-500" />
                        <Input
                          type="number"
                          className="pl-9 text-center text-sm font-medium h-10 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500/20"
                          placeholder="นอน"
                          {...form.register("min_bedrooms", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className="relative flex-1 group">
                        <Bath className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-500" />
                        <Input
                          type="number"
                          className="pl-9 text-center text-sm font-medium h-10 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500/20"
                          placeholder="น้ำ"
                          {...form.register("min_bathrooms", {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-2">
                        <Users className="h-3.5 w-3.5" /> จำนวนคนอยู่
                      </Label>
                      <div className="flex flex-row gap-2">
                        {[1, 2, 3, 4, 5].map((num) => {
                          const current = form.watch("num_occupants");
                          const isSelected = current === num;
                          const label = num === 5 ? "> 4" : num.toString();

                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() =>
                                form.setValue("num_occupants", num)
                              }
                              className={`
                                h-9 w-full px-3 rounded-lg text-sm font-semibold transition-all border
                                ${
                                  isSelected
                                    ? "bg-slate-800 border-slate-800 text-white shadow-md"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                                }
                              `}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2 h-full flex flex-col">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" /> ทำเลที่สนใจ
                    </Label>
                    <div className="relative flex-1">
                      <Controller
                        control={form.control}
                        name="preferred_locations"
                        render={({ field }) => (
                          <Textarea
                            className="w-full h-full min-h-[140px] p-4 resize-none border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500/20 bg-slate-50/50 leading-relaxed"
                            placeholder={"เช่น\n• สุขุมวิท\n• สีลม\n• ทองหล่อ"}
                            value={
                              Array.isArray(field.value)
                                ? field.value.join(", ")
                                : field.value || ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              const arr = val
                                .split(",")
                                .map((x) => x.trim())
                                .filter(Boolean);
                              field.onChange(arr.length > 0 ? arr : null);
                            }}
                          />
                        )}
                      />
                      <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 bg-white/80 px-2 py-0.5 rounded-md backdrop-blur-sm border border-slate-100">
                        คั่นด้วยจุลภาค (,)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    id: "has_pets",
                    label: "เลี้ยงสัตว์",
                    icon: PawPrint,
                    color: "text-orange-500",
                    bg: "bg-orange-50",
                    border: "border-orange-100",
                  },
                  {
                    id: "need_company_registration",
                    label: "จดบริษัท",
                    icon: Briefcase,
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                    border: "border-blue-100",
                  },
                  {
                    id: "allow_airbnb",
                    label: "Airbnb",
                    icon: PlaneTakeoff,
                    color: "text-rose-500",
                    bg: "bg-rose-50",
                    border: "border-rose-100",
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-xl border ${item.border} ${item.bg} transition-all hover:shadow-sm`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-4.5 w-4.5 ${item.color}`} />
                      <span className="text-sm font-semibold text-slate-700">
                        {item.label}
                      </span>
                    </div>
                    <Switch
                      className="data-[state=checked]:bg-slate-800"
                      checked={
                        (form.watch(
                          item.id as keyof LeadFormValues,
                        ) as boolean) ?? false
                      }
                      onCheckedChange={(checked) => {
                        form.setValue(item.id as keyof LeadFormValues, checked);
                      }}
                    />
                  </div>
                ))}

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white transition-all hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <Cigarette className="h-4.5 w-4.5 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-700">
                      สูบบุหรี่
                    </span>
                  </div>
                  <Switch
                    className="data-[state=checked]:bg-slate-800"
                    checked={!!form.watch("preferences")?.is_smoker}
                    onCheckedChange={(checked) => {
                      const current = form.getValues("preferences") || {};
                      form.setValue("preferences", {
                        ...current,
                        is_smoker: checked,
                      });
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status & Budget Card */}
          <Card className="shadow-lg border-slate-200 dark:border-slate-800 overflow-hidden">
            <CardHeader className="bg-linear-to-r from-violet-600 to-indigo-600 border-b border-white/10 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-white/20 text-white shadow-inner backdrop-blur-sm">
                  <Search className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white font-bold">
                    สถานะและงบประมาณ
                  </CardTitle>
                  <CardDescription className="text-indigo-100">
                    ติดตามความคืบหน้าและประเมินงบประมาณ
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Stage (สถานะ)
                  </Label>
                  <Select
                    value={form.watch("stage")}
                    onValueChange={(v) => form.setValue("stage", v as any)}
                  >
                    <SelectTrigger className="w-full h-11 border-slate-200 rounded-xl bg-slate-50/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STAGE_ORDER.map((s) => (
                        <SelectItem key={s} value={s}>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                s === "NEW"
                                  ? "default"
                                  : s === "CLOSED"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="rounded-md px-1.5 py-0.5 text-[10px] h-auto"
                            >
                              {s}
                            </Badge>
                            {LEAD_STAGE_LABELS[s]}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Source (ที่มา)
                  </Label>
                  <Select
                    value={form.watch("source") ?? "OTHER"}
                    onValueChange={(v) =>
                      form.setValue("source", (v as any) || null)
                    }
                  >
                    <SelectTrigger className="w-full h-11 border-slate-200 rounded-xl bg-slate-50/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCE_ORDER.map((s) => (
                        <SelectItem key={s} value={s}>
                          {LEAD_SOURCE_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 space-y-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-indigo-900/70 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-indigo-500" />{" "}
                  งบประมาณที่คาดหวัง (Budget)
                </Label>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-indigo-100 rounded text-[10px] font-bold text-indigo-600">
                      MIN
                    </div>
                    <Input
                      type="number"
                      className="pl-14 text-right pr-4 h-12 text-lg font-semibold text-indigo-900 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-indigo-500/20 bg-white shadow-sm"
                      placeholder="0"
                      {...form.register("budget_min", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="text-indigo-300 font-medium">ถึง</div>
                  <div className="relative flex-1 group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-indigo-100 rounded text-[10px] font-bold text-indigo-600">
                      MAX
                    </div>
                    <Input
                      type="number"
                      className="pl-14 text-right pr-4 h-12 text-lg font-semibold text-indigo-900 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-indigo-500/20 bg-white shadow-sm"
                      placeholder="ไม่อั้น"
                      {...form.register("budget_max", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Info className="h-3.5 w-3.5" /> บันทึกเพิ่มเติม
                </Label>
                <Textarea
                  className="min-h-[100px] bg-slate-50/50 border-slate-200 rounded-xl resize-y focus:border-slate-400 focus:ring-slate-400/20"
                  placeholder="รายละเอียดอื่นๆ..."
                  {...form.register("note")}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons (Sticky Bottom) */}
      <div className="sticky bottom-0 z-40 -mx-7 -mb-6 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 rounded-b-xl">
        <Button
          className="h-15 px-8 text-muted-foreground hover:text-foreground cursor-pointer"
          variant="ghost"
          type="button"
          disabled={isPending}
          onClick={() => router.back()}
        >
          ยกเลิก
        </Button>
        <Button
          className="h-15 px-8 text-md font-bold shadow-lg cursor-pointer shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all min-w-[200px] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
          type="submit"
          disabled={
            isPending || !form.formState.isValid || !form.formState.isDirty
          }
        >
          <Save className="h-4 w-4 mr-2" />
          {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </Button>
      </div>
    </form>
  );
}
