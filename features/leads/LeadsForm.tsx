"use client"
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
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
  ChevronRight,
  Info,
  Calendar
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  initialValues?: Partial<LeadFormValues>;
  onSubmitAction: (values: LeadFormValues) => Promise<void>;
};

import { useRouter } from "next/navigation";
import { toast } from "sonner";

function isNextRedirectError(e: any) {
  return typeof e?.digest === "string" && e.digest.startsWith("NEXT_REDIRECT");
}

export function LeadForm({ initialValues, onSubmitAction }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
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
      preferred_locations: "", // New field for preferred locations
      note: "", // General notes
      ...initialValues,
      // If initialValues has a 'note' that was previously for locations,
      // we might need to map it to 'preferred_locations' here.
      // For now, assuming initialValues will provide correct fields.
    } as any,
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
    <form className="space-y-6 max-w-5xl mx-auto pb-10" onSubmit={form.handleSubmit(onSubmit)}>
      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm flex items-center gap-3">
          <Info className="h-4 w-4 text-destructive" />
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* --- LEFT COLUMN: Contact & Identity --- */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-md border-slate-200 dark:border-slate-800 overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <UserCircle className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">ข้อมูลติดต่อหลัก</CardTitle>
                  <CardDescription>ข้อมูลส่วนตัวและสัญชาติของลูกค้า</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ชื่อ-นามสกุล <span className="text-destructive">*</span></Label>
                  <Input placeholder="ระบุชื่อของ Lead..." {...form.register("full_name")} className="h-10 border-slate-200 dark:border-slate-700 bg-slate-50/10" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ประเภทลูกค้า</Label>
                  <Select
                    value={form.watch("lead_type") as any ?? "INDIVIDUAL"}
                    onValueChange={(v) => form.setValue("lead_type", v as any)}
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
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">เบอร์โทรศัพท์</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                    <Input className="pl-9 h-10 border-slate-200 dark:border-slate-700" placeholder="0xx-xxxxxxx" {...form.register("phone")} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">อีเมล</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                    <Input className="pl-9 h-10 border-slate-200 dark:border-slate-700" placeholder="example@email.com" {...form.register("email")} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">สัญชาติ</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                    <Input className="pl-9 h-10 border-slate-200 dark:border-slate-700" placeholder="เช่น ไทย, อังกฤษ..." {...form.register("nationality")} />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/30 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 self-end h-10">
                   <Label htmlFor="is_foreigner" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                      <PlaneTakeoff className="h-4 w-4 text-blue-500" /> เป็นชาวต่างชาติไหม?
                   </Label>
                   <Switch id="is_foreigner" checked={form.watch("is_foreigner") ?? false} onCheckedChange={(v) => form.setValue("is_foreigner", v)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">ความต้องการทรัพย์</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                 <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">พื้นที่ใช้สอย (ตร.ม.)</Label>
                    <div className="flex items-center gap-2">
                       <div className="relative flex-1">
                          <Maximize className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/50" />
                          <Input type="number" step="any" className="pl-8 text-center" placeholder="Min" {...form.register("min_size_sqm", { valueAsNumber: true })} />
                       </div>
                       <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                       <div className="relative flex-1">
                          <Input type="number" step="any" className="text-center" placeholder="Max" {...form.register("max_size_sqm", { valueAsNumber: true })} />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ยูนิตสำคัญ (ห้องนอน/น้ำ)</Label>
                    <div className="flex items-center gap-2">
                       <div className="relative flex-1">
                          <Bed className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/50" />
                          <Input type="number" className="pl-8 text-center" placeholder="นอน" {...form.register("min_bedrooms", { valueAsNumber: true })} />
                       </div>
                       <div className="relative flex-1">
                          <Bath className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/50" />
                          <Input type="number" className="pl-8 text-center" placeholder="น้ำ" {...form.register("min_bathrooms", { valueAsNumber: true })} />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">จำนวนคนอยู่</Label>
                    <div className="relative">
                       <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                       <Input type="number" className="pl-9 h-10 border-slate-200 dark:border-slate-700" placeholder="คน" {...form.register("num_occupants", { valueAsNumber: true })} />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ทำเลที่สนใจ (Preferred Locations)</Label>
                    <div className="relative">
                       <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                       <Textarea className="pl-9 min-h-[42px] py-2 resize-none border-slate-200 dark:border-slate-700" placeholder="ย่าน, โครงการ..." {...form.register("preferred_locations")} />
                    </div>
                 </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 pt-2">
                {[
                  { id: "has_pets", label: "เลี้ยงสัตว์", icon: PawPrint, color: "text-orange-500" },
                  { id: "need_company_registration", label: "จดบริษัท", icon: Briefcase, color: "text-blue-500" },
                  { id: "allow_airbnb", label: "Airbnb", icon: PlaneTakeoff, color: "text-red-500" },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <div className="flex items-center gap-2">
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                    <Switch
                      checked={form.watch(item.id as any) ?? false}
                      onCheckedChange={(v) => form.setValue(item.id as any, v)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- RIGHT COLUMN: Pipeline & Summary --- */}
        <div className="space-y-6">
          <Card className="shadow-md border-slate-200 dark:border-slate-800 sticky top-6">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5 text-indigo-500" />
                สถานะและดีล
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
               <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">กระบวนการขาย (Stage)</Label>
                    <Select value={form.watch("stage")} onValueChange={(v) => form.setValue("stage", v as any)}>
                      <SelectTrigger className="w-full h-10 border-indigo-200 dark:border-indigo-900 focus-visible:ring-indigo-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_STAGE_ORDER.map((s) => (
                          <SelectItem key={s} value={s}>
                            <Badge variant={s === 'NEW' ? 'default' : s === 'CLOSED' ? 'secondary' : 'outline'} className="mr-2 h-4 text-[10px] px-1.5">{s}</Badge>
                            {LEAD_STAGE_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ช่องทางการติดต่อ (Source)</Label>
                    <Select value={(form.watch("source") as any) ?? "OTHER"} onValueChange={(v) => form.setValue("source", v as any)}>
                      <SelectTrigger className="h-10 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_SOURCE_ORDER.map((s) => (
                          <SelectItem key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <DollarSign className="h-3 w-3" /> งบประมาณที่คาดหวัง
                    </Label>
                    <div className="space-y-3">
                       <div className="relative group">
                          <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground group-focus-within:text-primary transition-colors">MIN</span>
                          <Input type="number" className="pl-12 h-10 font-mono text-right" placeholder="0" {...form.register("budget_min", { valueAsNumber: true })} />
                          <span className="absolute right-3 top-2.5 text-[10px] font-bold text-muted-foreground/50">THB</span>
                       </div>
                       <div className="relative group">
                          <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground group-focus-within:text-primary transition-colors">MAX</span>
                          <Input type="number" className="pl-12 h-10 font-mono text-right" placeholder="0" {...form.register("budget_max", { valueAsNumber: true })} />
                          <span className="absolute right-3 top-2.5 text-[10px] font-bold text-muted-foreground/50">THB</span>
                       </div>
                    </div>
                  </div>
               </div>

               <div className="space-y-2 pt-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Info className="h-3 w-3" /> บันทึกเพิ่มเติม
                  </Label>
                  <Textarea className="min-h-[120px] bg-sky-50/20 border-slate-200 dark:border-slate-800" placeholder="ระบุรายละเอียดอื่นๆ ที่ควรรู้เกี่ยวกับลูกค้า..." {...form.register("note")} />
               </div>

               <div className="pt-2">
                 <Button className="w-full h-12 text-md font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all" type="submit" disabled={isPending}>
                    {isPending ? "กำลังดำเนินการ..." : "บันทึกข้อมูลลูกค้า"}
                 </Button>
                 <Button className="w-full mt-3 h-10 text-muted-foreground hover:text-foreground" variant="ghost" type="button" disabled={isPending} onClick={() => router.back()}>
                    ยกเลิกและย้อนกลับ
                 </Button>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

