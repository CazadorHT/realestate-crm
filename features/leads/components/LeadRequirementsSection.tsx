"use client";

import { UseFormReturn, Controller } from "react-hook-form";
import {
  ClipboardList,
  Maximize,
  Bed,
  Bath,
  Users,
  MapPin,
  PawPrint,
  Briefcase,
  PlaneTakeoff,
  Cigarette,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { LeadFormValues } from "../types";

interface LeadRequirementsSectionProps {
  form: UseFormReturn<LeadFormValues>;
}

export function LeadRequirementsSection({
  form,
}: LeadRequirementsSectionProps) {
  return (
    <Card className="shadow-lg border-slate-200 overflow-hidden">
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
                    {...form.register("min_size_sqm", { valueAsNumber: true })}
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
                    {...form.register("max_size_sqm", { valueAsNumber: true })}
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
                    {...form.register("min_bedrooms", { valueAsNumber: true })}
                  />
                </div>
                <div className="relative flex-1 group">
                  <Bath className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-500" />
                  <Input
                    type="number"
                    className="pl-9 text-center text-sm font-medium h-10 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500/20"
                    placeholder="น้ำ"
                    {...form.register("min_bathrooms", { valueAsNumber: true })}
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
                        onClick={() => form.setValue("num_occupants", num)}
                        className={`
                          h-9 w-full px-3 rounded-lg text-sm font-semibold transition-all border
                          ${isSelected ? "bg-slate-800 border-slate-800 text-white shadow-md" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"}
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
                checked={(form.watch(item.id as any) as boolean) ?? false}
                onCheckedChange={(checked) =>
                  form.setValue(item.id as any, checked)
                }
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
  );
}
