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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  TRANSIT_TYPE_LABELS,
  TRANSIT_TYPE_ENUM,
} from "@/features/properties/labels";
import { TrainFront, MapPin, Ruler, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SectionHeader } from "../../components/SectionHeader";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormValues } from "@/features/properties/schema";

// Util function for parsing numbers
const parseNumber = (s: string) => {
  const cleaned = s.replace(/[^0-9.-]/g, "");
  return cleaned === "" ? undefined : Number(cleaned);
};

interface TransitSectionProps {
  form: UseFormReturn<PropertyFormValues>;
}

export function TransitSection({ form }: TransitSectionProps) {
  const watchedNearTransit = form.watch("near_transit");

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "nearby_transits",
  });

  const handleAddTransit = () => {
    append({
      type: "BTS",
      station_name: "",
      distance_meters: undefined,
    });
  };

  return (
    <Card className="border-slate-200/70 bg-white shadow-sm h-full min-h-[400px]">
      <CardHeader className="space-y-4 pb-0">
        <SectionHeader
          icon={TrainFront}
          title="การเดินทาง"
          desc="รถไฟฟ้าและจุดเชื่อมต่อสำคัญ"
          tone="blue"
        />
        <Separator className="bg-slate-200/70" />
      </CardHeader>
      <CardContent className="pt-6">
        <FormField
          control={form.control}
          name="near_transit"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-4 space-y-0 p-4 rounded-xl border border-slate-100 bg-slate-50">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    // Clear transit data when unchecked
                    if (!checked) {
                      form.setValue("nearby_transits", []);
                    }
                  }}
                  className="w-8 h-8 rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
              </FormControl>
              <div className="space-y-1">
                <FormLabel className="text-base font-bold text-slate-800 cursor-pointer">
                  ตั้งอยู่ใกล้รถไฟฟ้า / รถสาธารณะ
                </FormLabel>
                <p className="text-xs text-slate-500 font-medium">
                  หากติ๊กเลือก จะมีช่องให้กรอกรายละเอียดเพิ่มเติม
                </p>
              </div>
            </FormItem>
          )}
        />

        <div
          className={`space-y-4 mt-2 overflow-hidden transition-all duration-300 ease-in-out ${
            watchedNearTransit
              ? "max-h-[1000px] opacity-100 translate-y-0 pt-4"
              : "max-h-0 opacity-0 -translate-y-4 pt-0 mt-0"
          }`}
        >
          {/* Transit List - Scrollable container for max 3 visible */}
          <div className="max-h-[220px] overflow-y-auto space-y-4 pr-1">
            {fields.map((item, index) => (
              <div
                key={item.id}
                className="flex gap-4 items-end p-4 bg-slate-50/50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                {/* Transit Type */}
                <FormField
                  control={form.control}
                  name={`nearby_transits.${index}.type`}
                  render={({ field }) => (
                    <FormItem className="w-[150px]">
                      <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-xs uppercase tracking-wide">
                        <TrainFront className="h-3.5 w-3.5 text-blue-500" />
                        ประเภท
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? "BTS"}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full h-10 bg-white rounded-lg border-slate-200 shadow-sm font-medium text-xs">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white rounded-xl">
                          {TRANSIT_TYPE_ENUM.map((t) => (
                            <SelectItem
                              key={t}
                              value={t}
                              className="font-medium py-2 text-sm"
                            >
                              {TRANSIT_TYPE_LABELS[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Station Name */}
                <FormField
                  control={form.control}
                  name={`nearby_transits.${index}.station_name`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-xs uppercase tracking-wide">
                        <MapPin className="h-3.5 w-3.5 text-blue-500" />
                        ชื่อสถานี
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          className="h-10 rounded-lg bg-white border-slate-200 shadow-sm font-medium px-4 text-xs focus:ring-0 focus:border-blue-400"
                          placeholder="เช่น สถานีทองหล่อ"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Distance */}
                <FormField
                  control={form.control}
                  name={`nearby_transits.${index}.distance_meters`}
                  render={({ field }) => (
                    <FormItem className="w-[120px]">
                      <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-xs uppercase tracking-wide">
                        <Ruler className="h-3.5 w-3.5 text-blue-500" />
                        ระยะ (ม.)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          className="h-10 rounded-lg bg-white border-slate-200 shadow-sm font-medium text-xs text-center focus:ring-0 focus:border-blue-400"
                          placeholder="350"
                          onChange={(e) =>
                            field.onChange(parseNumber(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Delete Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 border-dashed border-2 border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 font-medium text-sm transition-all"
            onClick={handleAddTransit}
          >
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มสถานี
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
