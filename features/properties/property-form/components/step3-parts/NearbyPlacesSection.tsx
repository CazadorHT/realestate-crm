"use client";

import * as React from "react";
import { useFieldArray } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAITranslation } from "../../hooks/use-ai-translation";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { NEARBY_PLACE_CATEGORIES } from "@/features/properties/labels";
import {
  Landmark,
  MapPin,
  Ruler,
  Clock,
  Trash2,
  Plus,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SectionHeader } from "../../components/SectionHeader";
import { useFormContext, useWatch, type UseFormReturn } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import type { PropertyFormValues } from "@/features/properties/schema";

const KilometerInput = ({
  value,
  onChange,
  className,
  placeholder,
}: {
  value?: number | null;
  onChange: (val?: number) => void;
  className?: string;
  placeholder?: string;
}) => {
  const [displayValue, setDisplayValue] = React.useState(() => {
    if (value === undefined || value === null) return "";
    return (value / 1000).toString();
  });

  React.useEffect(() => {
    const currentMeters = value ?? undefined;
    const inputMeters = displayValue === "" ? undefined : parseFloat(displayValue) * 1000;
    if (currentMeters === inputMeters) return;
    setDisplayValue(currentMeters !== undefined && currentMeters !== null ? (currentMeters / 1000).toString() : "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setDisplayValue(newVal);
    if (newVal === "") {
      onChange(undefined as any);
      return;
    }
    const parsed = parseFloat(newVal);
    if (!isNaN(parsed)) onChange(parsed * 1000);
  };

  return <Input value={displayValue} onChange={handleChange} className={className} placeholder={placeholder} />;
};

interface NearbyPlacesSectionProps {
  form?: UseFormReturn<PropertyFormValues>; // Optional: falls back to useFormContext
}

export function NearbyPlacesSection({
  form: formProp,
}: NearbyPlacesSectionProps) {
  const formContext = useFormContext<PropertyFormValues>();
  const form = formProp || formContext;
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "nearby_places",
  });

  const { isTranslating, translatePlaces } = useAITranslation(form);

  const handleAddPlace = () => {
    append({
      category: "Other",
      name: "",
      distance_meters: undefined,
      time: "",
    });
  };

  return (
    <Card className="border-slate-200/70 bg-white shadow-sm h-full min-h-[400px]">
      <CardHeader className="space-y-4 pb-0 px-4 sm:px-6 py-4 sm:py-6">
        <SectionHeader
          icon={Landmark}
          title="สถานที่ใกล้เคียง"
          desc="เพิ่มจุดเด่นรอบๆ ทรัพย์สิน"
          tone="blue"
          right={
            fields.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 font-bold px-3 shadow-xs transition-all active:scale-95"
                disabled={isTranslating}
                onClick={() => translatePlaces()}
              >
                {isTranslating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                AI {isTranslating ? "กำลังแปล..." : "แปลชื่อทั้งหมด"}
              </Button>
            ) : null
          }
        />
        <Separator className="bg-slate-200/70" />
      </CardHeader>

      <CardContent className="pt-6 px-4 sm:px-6">
        <div className="space-y-4">
          <div className="max-h-[400px] overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            {fields.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-4 p-4 sm:p-5 bg-slate-50/50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200 relative group"
              >
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`nearby_places.${index}.category`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-[10px] sm:text-xs uppercase tracking-wide">
                          <Landmark className="h-3.5 w-3.5 text-blue-500" />
                          ประเภท
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full h-10 bg-white rounded-lg border-slate-200 shadow-sm font-medium text-xs">
                              <SelectValue placeholder="เลือก..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white rounded-xl">
                            {NEARBY_PLACE_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value} className="font-medium py-2 text-sm">
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`nearby_places.${index}.distance_meters`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-[10px] sm:text-xs uppercase tracking-wide">
                          <Ruler className="h-3.5 w-3.5 text-blue-500" />
                          ระยะทาง (กม.)
                        </FormLabel>
                        <FormControl>
                          <KilometerInput
                            value={field.value}
                            onChange={field.onChange}
                            className="h-9! rounded-lg bg-white border-slate-200 shadow-sm font-medium text-xs text-center focus:ring-0 focus:border-blue-400"
                            placeholder="0.5"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`nearby_places.${index}.time`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-[10px] sm:text-xs uppercase tracking-wide">
                          <Clock className="h-3.5 w-3.5 text-blue-500" />
                          เวลา (นาที)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="5"
                            className="h-9! rounded-lg bg-white border-slate-200 shadow-sm font-medium text-xs text-center focus:ring-0 focus:border-blue-400"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name={`nearby_places.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-[10px] sm:text-xs uppercase tracking-wide">
                          <MapPin className="h-3.5 w-3.5 text-blue-500" />
                          ชื่อสถานที่ (ภาษาไทย)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="เช่น โรงเรียนสาธิต"
                            className="h-10 rounded-lg bg-white border-slate-200 shadow-sm font-medium px-4 text-xs focus:ring-0 focus:border-blue-400"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-3 pl-2 border-l-2 border-slate-100 ml-1">
                    <FormField
                      control={form.control}
                      name={`nearby_places.${index}.name_en`}
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-300 w-6">EN</span>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="English Place Name"
                            className="h-9 text-xs bg-white text-slate-600 border-slate-200 rounded-lg focus:bg-white transition-all flex-1"
                          />
                        </div>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`nearby_places.${index}.name_cn`}
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-300 w-6">CN</span>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="中文名称"
                            className="h-9 text-xs bg-white text-slate-600 border-slate-200 rounded-lg focus:bg-white transition-all flex-1"
                          />
                        </div>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`nearby_places.${index}.name_ru`}
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-300 w-6">RU</span>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="Название места"
                            className="h-9 text-xs bg-white text-slate-600 border-slate-200 rounded-lg focus:bg-white transition-all flex-1"
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 border-dashed border-2 border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 font-medium text-sm transition-all mt-4"
            onClick={handleAddPlace}
          >
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มสถานที่
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
