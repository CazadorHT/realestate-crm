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
    <form
      className="space-y-6 max-w-full mx-auto pb-10"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm flex items-center gap-3">
          <Info className="h-4 w-4 text-destructive" />
          {error}
        </div>
      ) : null}

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => router.push("/protected/leads")}
          className="p-0 h-auto text-muted-foreground hover:text-primary"
        >
          ลีด
        </Button>
        <ChevronRight className="h-3 w-3" />
        {initialValues?.full_name && leadId ? (
          <>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => router.push(`/protected/leads/${leadId}`)}
              className="p-0 h-auto font-medium text-foreground hover:text-primary truncate max-w-[200px]"
            >
              {initialValues.full_name}
            </Button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">แก้ไข</span>
          </>
        ) : initialValues?.full_name ? (
          <>
            <span className="font-medium text-foreground truncate max-w-[200px]">
              {initialValues.full_name}
            </span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">แก้ไข</span>
          </>
        ) : (
          <span className="text-foreground">สร้างใหม่</span>
        )}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- LEFT COLUMN: Contact & Requirements --- */}
        <div className="space-y-6">
          <Card className="shadow-md border-slate-200 dark:border-slate-800 overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <UserCircle className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">ข้อมูลติดต่อหลัก</CardTitle>
                  <CardDescription>
                    ข้อมูลส่วนตัวและสัญชาติของลูกค้า
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    ชื่อ-นามสกุล <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="ระบุชื่อของ Lead..."
                    {...form.register("full_name")}
                    className="h-10 border-slate-200 dark:border-slate-700 bg-slate-50/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    ประเภทลูกค้า
                  </Label>
                  <Select
                    value={form.watch("lead_type") ?? "INDIVIDUAL"}
                    onValueChange={(v) =>
                      form.setValue(
                        "lead_type",
                        v as "INDIVIDUAL" | "COMPANY" | "JURISTIC_PERSON",
                      )
                    }
                  >
                    <SelectTrigger className="h-10 border-slate-200 dark:border-slate-700">
                      <SelectValue placeholder="เลือกประเภท" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">บุคคลธรรมดา</SelectItem>
                      <SelectItem value="COMPANY">บริษัท/องค์กร</SelectItem>
                      <SelectItem value="JURISTIC_PERSON">นิติบุคคล</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    เบอร์โทรศัพท์
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      className="pl-9 h-10 border-slate-200 dark:border-slate-700"
                      placeholder="0xx-xxxxxxx"
                      {...form.register("phone")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    อีเมล
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      className="pl-9 h-10 border-slate-200 dark:border-slate-700"
                      placeholder="example@email.com"
                      {...form.register("email")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Line ID
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60 flex items-center justify-center">
                      <span className="font-bold text-[10px]">L</span>
                    </div>
                    <Input
                      className="pl-9 h-10 border-slate-200 dark:border-slate-700"
                      placeholder="Line ID ของลูกค้า..."
                      {...form.register("preferences.line_id")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    ช่องทางติดต่อออนไลน์
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      className="pl-9 h-10 border-slate-200 dark:border-slate-700"
                      placeholder="เช่น Facebook, WeChat, WhatsApp..."
                      {...form.register("preferences.online_contact")}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    สัญชาติ
                  </Label>
                  {/* Nationality Button Grid */}
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-40 overflow-y-auto">
                    {NATIONALITY_OPTIONS.map((nat) => {
                      const currentVal = form.watch("nationality");
                      const selected = Array.isArray(currentVal)
                        ? currentVal
                        : typeof currentVal === "string" &&
                            currentVal.length > 0
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
                              newSelected = newSelected.filter(
                                (x) => x !== nat,
                              );
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
                            flex items-center gap-2 p-2 rounded-lg border text-sm font-medium transition-all
                            ${
                              isSelected
                                ? "bg-blue-600 border-blue-600 text-white shadow-md active:scale-95"
                                : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                            }
                          `}
                        >
                          <div
                            className={`
                             p-1 rounded-full 
                             ${
                               isSelected
                                 ? "bg-white/20 text-white"
                                 : "bg-slate-100 text-slate-400"
                             }
                          `}
                          >
                            <Globe className="h-3 w-3" />
                          </div>
                          {nat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- RIGHT COLUMN: Requirements & Pipeline --- */}
        <div className="space-y-6">
          <Card className="shadow-md border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">ความต้องการทรัพย์</CardTitle>
                  <CardDescription>
                    ระบุรายละเอียดทรัพย์ที่ลูกค้าต้องการ
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    พื้นที่ใช้สอย (ตร.ม.)
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Maximize className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/50" />
                      <Input
                        type="number"
                        step="any"
                        className="pl-8 text-center"
                        placeholder="Min"
                        {...form.register("min_size_sqm", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        step="any"
                        className="text-center"
                        placeholder="Max"
                        {...form.register("max_size_sqm", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    ยูนิตสำคัญ (ห้องนอน/น้ำ)
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Bed className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/50" />
                      <Input
                        type="number"
                        className="pl-8 text-center"
                        placeholder="นอน"
                        {...form.register("min_bedrooms", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="relative flex-1">
                      <Bath className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/50" />
                      <Input
                        type="number"
                        className="pl-8 text-center"
                        placeholder="น้ำ"
                        {...form.register("min_bathrooms", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    จำนวนคนอยู่
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      type="number"
                      className="pl-9 h-10 border-slate-200 dark:border-slate-700"
                      placeholder="คน"
                      {...form.register("num_occupants", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-3 md:col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    ย่านทำเลที่สนใจ
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                    <Controller
                      control={form.control}
                      name="preferred_locations"
                      render={({ field }) => (
                        <Textarea
                          className="pl-9 min-h-[60px] py-2 resize-none border-slate-200 dark:border-slate-700"
                          placeholder="เช่น สุขุมวิท, สีลม, ทองหล่อ, อโศก (คั่นด้วยจุลภาค)"
                          value={
                            Array.isArray(field.value)
                              ? field.value.join(", ")
                              : field.value || ""
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            // Convert comma-separated string back to string[]
                            const arr = val
                              .split(",")
                              .map((x) => x.trim())
                              .filter(Boolean);
                            field.onChange(arr.length > 0 ? arr : null);
                          }}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 pt-2">
                {[
                  {
                    id: "has_pets",
                    label: "เลี้ยงสัตว์",
                    icon: PawPrint,
                    color: "text-orange-500",
                  },
                  {
                    id: "need_company_registration",
                    label: "จดบริษัท",
                    icon: Briefcase,
                    color: "text-blue-500",
                  },
                  {
                    id: "allow_airbnb",
                    label: "Airbnb",
                    icon: PlaneTakeoff,
                    color: "text-red-500",
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40"
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                    <Switch
                      checked={
                        (form.watch(
                          item.id as keyof LeadFormValues,
                        ) as boolean) ?? false
                      }
                      onCheckedChange={(v) =>
                        form.setValue(item.id as keyof LeadFormValues, v)
                      }
                    />
                  </div>
                ))}

                {/* Smoking Switch (Stored in preferences JSON) */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <div className="flex items-center gap-2">
                    <Cigarette className="h-4 w-4 text-gray-500" />
                    <span className="text-xs font-medium">สูบบุหรี่</span>
                  </div>
                  <Switch
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
        </div>

        {/* สถานะและดีล */}
        <div className="space-y-6">
          <Card className="shadow-md border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Search className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">สถานะและงบประมาณ</CardTitle>
                  <CardDescription>
                    ระบุสถานะของลูกค้าและงบประมาณ
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    กระบวนการขาย (Stage)
                  </Label>
                  <Select
                    value={form.watch("stage")}
                    onValueChange={(v) =>
                      form.setValue(
                        "stage",
                        v as
                          | "NEW"
                          | "CONTACTED"
                          | "VIEWED"
                          | "NEGOTIATING"
                          | "CLOSED",
                      )
                    }
                  >
                    <SelectTrigger className="w-full h-10 border-indigo-200 dark:border-indigo-900 focus-visible:ring-indigo-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STAGE_ORDER.map((s) => (
                        <SelectItem key={s} value={s}>
                          <Badge
                            variant={
                              s === "NEW"
                                ? "default"
                                : s === "CLOSED"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="mr-2 h-4 text-[10px] px-1.5"
                          >
                            {s}
                          </Badge>
                          {LEAD_STAGE_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 flex-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    ช่องทางการติดต่อ (Source)
                  </Label>
                  <Select
                    value={form.watch("source") ?? "OTHER"}
                    onValueChange={(v) =>
                      form.setValue("source", (v as any) || null)
                    }
                  >
                    <SelectTrigger className="h-10 border-slate-200">
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
              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3" /> งบประมาณที่คาดหวัง
                </Label>
                <div className="space-y-3 flex  gap-2">
                  <div className="relative group flex-1">
                    <span className="absolute left-3 top-3 text-xs font-bold text-muted-foreground group-focus-within:text-primary transition-colors">
                      MIN
                    </span>
                    <Input
                      type="number"
                      className="pl-12 h-10 font-mono text-right pr-6"
                      placeholder="ไม่ระบุ"
                      {...form.register("budget_min", {
                        valueAsNumber: true,
                      })}
                    />
                    <span className="absolute right-3 top-3 text-[10px] font-bold text-muted-foreground/50">
                      THB
                    </span>
                  </div>
                  <div className="relative group flex-1">
                    <span className="absolute left-3 top-3 text-xs font-bold text-muted-foreground group-focus-within:text-primary transition-colors">
                      MAX
                    </span>
                    <Input
                      type="number"
                      className="pl-12 h-10 font-mono text-right pr-6"
                      placeholder="ไม่ระบุ"
                      {...form.register("budget_max", {
                        valueAsNumber: true,
                      })}
                    />
                    <span className="absolute right-3 top-3 text-[10px] font-bold text-muted-foreground/50">
                      THB
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Info className="h-3 w-3" /> บันทึกเพิ่มเติม
                </Label>
                <Textarea
                  className="min-h-[120px] bg-sky-50/20 border-slate-200 dark:border-slate-800"
                  placeholder="ระบุรายละเอียดอื่นๆ ที่ควรรู้เกี่ยวกับลูกค้า..."
                  {...form.register("note")}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-6 mt-6 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:justify-start gap-3">
        
        <Button
          className="h-11 px-8 text-md font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all min-w-[200px]"
          type="submit"
          disabled={isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </Button>
        <Button
          className="h-11 px-8 text-muted-foreground hover:text-foreground"
          variant="outline"
          type="button"
          disabled={isPending}
          onClick={() => router.back()}
        >
          ยกเลิก
        </Button>
      </div>
    </form>
  );
}
