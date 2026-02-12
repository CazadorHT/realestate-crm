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
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormValues } from "@/features/properties/schema";

interface NearbyPlacesSectionProps {
  form: UseFormReturn<PropertyFormValues>;
}

export function NearbyPlacesSection({ form }: NearbyPlacesSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "nearby_places",
  });

  const { isTranslating, translatePlaces } = useAITranslation(form);

  const handleAddPlace = () => {
    append({
      category: "Other",
      name: "",
      distance: "",
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
            fields.length > 0 && (
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
                AI {isTranslating ? "กำลังแปล..." : "Fix All"}
              </Button>
            )
          }
        />
        <Separator className="bg-slate-200/70" />
      </CardHeader>

      <CardContent className="pt-6 space-y-4 px-4 sm:px-6">
        {/* Places List - Scrollable container for max 3 visible */}
        <div className="max-h-[280px] overflow-y-auto space-y-4 pr-1">
          {fields.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-x-4 gap-y-3 p-3 sm:p-4 bg-slate-50/50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              {/* Category */}
              <FormField
                control={form.control}
                name={`nearby_places.${index}.category`}
                render={({ field }) => (
                  <FormItem className="col-span-6 sm:col-span-4 lg:col-span-3">
                    <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-[10px] sm:text-xs uppercase tracking-wide">
                      <Landmark className="h-3.5 w-3.5 text-blue-500" />
                      ประเภท
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full min-w-0 h-10 bg-white rounded-lg border-slate-200 shadow-sm font-medium text-xs">
                          <SelectValue placeholder="เลือก..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white rounded-xl">
                        {NEARBY_PLACE_CATEGORIES.map((cat) => (
                          <SelectItem
                            key={cat.value}
                            value={cat.value}
                            className="font-medium py-2 text-sm"
                          >
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Distance */}
              <FormField
                control={form.control}
                name={`nearby_places.${index}.distance`}
                render={({ field }) => (
                  <FormItem className="col-span-3 sm:col-span-2">
                    <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-[10px] sm:text-xs uppercase tracking-wide">
                      <Ruler className="h-3.5 w-3.5 text-blue-500" />
                      ระยะ
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="1 กม."
                        className="h-10 rounded-lg bg-white border-slate-200 shadow-sm font-medium text-xs text-center focus:ring-0 focus:border-blue-400 px-1"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Time */}
              <FormField
                control={form.control}
                name={`nearby_places.${index}.time`}
                render={({ field }) => (
                  <FormItem className="col-span-3 sm:col-span-2">
                    <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-[10px] sm:text-xs uppercase tracking-wide">
                      <Clock className="h-3.5 w-3.5 text-blue-500" />
                      เวลา
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="5 นาที"
                        className="h-10 rounded-lg bg-white border-slate-200 shadow-sm font-medium text-xs text-center focus:ring-0 focus:border-blue-400 px-1"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Name */}
              <FormField
                control={form.control}
                name={`nearby_places.${index}.name`}
                render={({ field }) => (
                  <FormItem className="col-span-10 sm:col-span-3 lg:col-span-4">
                    <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-[10px] sm:text-xs uppercase tracking-wide">
                      <MapPin className="h-3.5 w-3.5 text-blue-500" />
                      ชื่อสถานที่
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="เช่น โรงเรียนสาธิต"
                        className="h-10 rounded-lg bg-white border-slate-200 shadow-sm font-medium px-4 text-xs focus:ring-0 focus:border-blue-400"
                      />
                    </FormControl>

                    {/* Hidden fields for EN/CN */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <FormField
                        control={form.control}
                        name={`nearby_places.${index}.name_en`}
                        render={({ field }) => (
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="EN Name"
                            className="h-8 text-[10px] bg-slate-50/50 text-slate-500 border-slate-100 focus:bg-white transition-all"
                          />
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`nearby_places.${index}.name_cn`}
                        render={({ field }) => (
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="CN Name"
                            className="h-8 text-[10px] bg-slate-50/50 text-slate-500 border-slate-100 focus:bg-white transition-all"
                          />
                        )}
                      />
                    </div>
                  </FormItem>
                )}
              />

              {/* Delete Button */}
              <div className="col-span-2 sm:col-span-1 flex items-start justify-end pt-5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 border-dashed border-2 border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 font-medium text-sm transition-all"
          onClick={handleAddPlace}
        >
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มสถานที่
        </Button>
      </CardContent>
    </Card>
  );
}
