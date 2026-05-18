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
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAITranslation } from "../../hooks/use-ai-translation";
import {
  TrainFront,
  MapPin,
  Ruler,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  Clock,
  MoreVertical,
  Landmark,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SectionHeader } from "../../components/SectionHeader";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormValues } from "@/features/properties/schema";
import { getTransitTypesAction, upsertMasterDataAction, type MasterDataTransitType } from "@/features/properties/actions/fetch-master-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";

// Util function for parsing numbers
const parseNumber = (s: string) => {
  const cleaned = s.replace(/[^0-9.-]/g, "");
  return cleaned === "" ? undefined : Number(cleaned);
};

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
  // Store the user's input string locally to allow things like "0." or "1.0"
  const [displayValue, setDisplayValue] = React.useState(() => {
    if (value === undefined || value === null) return "";
    return (value / 1000).toString();
  });

  // Sync from external value changes (e.g. form reset, loaded data)
  // We check if the external value (meters) matches our current display (km)
  // to avoid overwriting while the user is typing valid numbers.
  React.useEffect(() => {
    const currentMeters = value ?? undefined;
    const inputMeters =
      displayValue === "" ? undefined : parseFloat(displayValue) * 1000;

    // If they are effectively equal, do nothing (preserve user string like "1.00")
    if (currentMeters === inputMeters) return;
    // If undefined/null match
    if (
      (currentMeters === undefined || currentMeters === null) &&
      displayValue === ""
    )
      return;

    // Otherwise, external changed significantly (or initialization)
    setDisplayValue(
      currentMeters !== undefined && currentMeters !== null
        ? (currentMeters / 1000).toString()
        : "",
    );
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setDisplayValue(newVal); // Always update display text

    if (newVal === "") {
      onChange(undefined);
      return;
    }

    const parsed = parseFloat(newVal);
    if (!isNaN(parsed)) {
      onChange(parsed * 1000); // Send meters to parent
    }
  };

  return (
    <Input
      value={displayValue}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
    />
  );
};

import { useFormContext } from "react-hook-form";

interface TransitSectionProps {
  form?: UseFormReturn<PropertyFormValues>; // Optional: falls back to useFormContext
}

export function TransitSection({ form: formProp }: TransitSectionProps) {
  const formContext = useFormContext<PropertyFormValues>();
  const form = formProp || formContext;
  const [transitTypes, setTransitTypes] = React.useState<MasterDataTransitType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = React.useState(true);

  // Inline Modal State
  const [isTransitModalOpen, setIsTransitModalOpen] = React.useState(false);
  const [newTransitCode, setNewTransitCode] = React.useState("");
  const [newTransitLabelTh, setNewTransitLabelTh] = React.useState("");
  const [newTransitColor, setNewTransitColor] = React.useState("#3b82f6");
  const [isSavingTransit, setIsSavingTransit] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    getTransitTypesAction().then((data) => {
      if (isMounted) {
        setTransitTypes(data);
        setIsLoadingTypes(false);
      }
    }).catch(() => {
      if (isMounted) setIsLoadingTypes(false);
    });
    return () => { isMounted = false; };
  }, []);

  const handleSaveTransit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransitCode || !newTransitLabelTh) {
      toast.error("กรุณากรอกรหัสและชื่อสายรถไฟฟ้า");
      return;
    }
    setIsSavingTransit(true);
    try {
      const res = await upsertMasterDataAction({
        type: "TRANSIT_TYPE",
        code: newTransitCode.toUpperCase(),
        label: { th: newTransitLabelTh, en: newTransitLabelTh, cn: newTransitLabelTh, ru: newTransitLabelTh },
        metadata: { color: newTransitColor },
        sort_order: transitTypes.length * 10,
        is_active: true,
      });
      if (res.success) {
        toast.success("เพิ่มสายรถไฟฟ้าใหม่สำเร็จ!");
        setTransitTypes([...transitTypes, {
          code: newTransitCode.toUpperCase(),
          label: { th: newTransitLabelTh, en: newTransitLabelTh, cn: newTransitLabelTh, ru: newTransitLabelTh },
          metadata: { color: newTransitColor }
        }]);
        setIsTransitModalOpen(false);
        setNewTransitCode("");
        setNewTransitLabelTh("");
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSavingTransit(false);
    }
  };

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "nearby_transits",
  });

  const { isTranslating, translateTransits } = useAITranslation(form);

  const handleAddTransit = () => {
    append({
      type: "BTS",
      station_name: "",
      distance_meters: undefined,
      time: "",
    });
  };

  return (
    <Card className="border-slate-200/70 bg-white shadow-sm h-full min-h-[400px]">
      <CardHeader className="space-y-4 pb-0 px-4 sm:px-6 py-4 sm:py-6">
        <SectionHeader
          icon={TrainFront}
          title="การเดินทาง"
          desc="รถไฟฟ้าและจุดเชื่อมต่อสำคัญ"
          tone="blue"
          right={
            <div className="flex items-center gap-2">
              {fields.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-blue-600! border-blue-200! bg-blue-50! hover:bg-blue-100! font-semibold px-3 shadow-xs transition-all active:scale-95"
                  disabled={isTranslating}
                  onClick={() => translateTransits()}
                >
                  {isTranslating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  AI {isTranslating ? "กำลังแปล..." : "แปลชื่อทั้งหมด"}
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white rounded-xl shadow-lg border-slate-200 p-1">
                  <DropdownMenuItem
                    onClick={() => setIsTransitModalOpen(true)}
                    className="flex items-center gap-2 text-xs font-bold text-blue-600 cursor-pointer py-2 rounded-lg hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4" />
                    เพิ่มสายรถไฟฟ้าใหม่ (Add Line)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => window.open('/protected/admin/master-data', '_blank')}
                    className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer py-2 rounded-lg hover:bg-slate-50"
                  >
                    <Landmark className="h-4 w-4 text-slate-400" />
                    จัดการข้อมูลระบบ (Master Data)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        />
        <Separator className="bg-slate-200/70" />
      </CardHeader>
      <CardContent className="pt-6 px-4 sm:px-6">
        <div className="space-y-4">
          {/* Transit List - Scrollable container for max 3 visible */}
          <div className="max-h-[400px] overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            {fields.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-4 p-4 sm:p-5 bg-slate-50/50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200 relative group"
              >
                {/* Delete Button - Positioned top-right */}
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

                {/* Core Info: Type, Distance, Time */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Transit Type */}
                  <FormField
                    control={form.control}
                    name={`nearby_transits.${index}.type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-[10px] sm:text-xs uppercase tracking-wide">
                          <TrainFront className="h-3.5 w-3.5 text-blue-500" />
                          ประเภท
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? "BTS"}
                          disabled={isLoadingTypes}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full h-10 bg-white rounded-lg border-slate-200 shadow-sm font-medium text-xs">
                              {isLoadingTypes ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span>กำลังโหลด...</span>
                                </div>
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white rounded-xl shadow-lg border-slate-200">
                            {transitTypes.length > 0 ? (
                              transitTypes.map((t) => (
                                <SelectItem
                                  key={t.code}
                                  value={t.code}
                                  className="font-medium py-2.5 text-sm cursor-pointer hover:bg-slate-50"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div 
                                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-slate-200/50" 
                                      style={{ backgroundColor: t.metadata?.color || "#cbd5e1" }}
                                    />
                                    <span className="flex-1">{t.label.th}</span>
                                    <span className="text-[10px] text-slate-400 font-mono uppercase px-1.5 py-0.5 bg-slate-100 rounded">
                                      {t.code}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              ["BTS", "MRT", "ARL"].map((code) => (
                                <SelectItem key={code} value={code} className="py-2.5">
                                  {code}
                                </SelectItem>
                              ))
                            )}
                            <div className="p-1 border-t border-slate-100 mt-1">
                              <Button
                                type="button"
                                variant="ghost"
                                className="w-full justify-start text-xs text-blue-600 font-bold hover:bg-blue-50 py-1.5 h-auto cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsTransitModalOpen(true);
                                }}
                              >
                                <Plus className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                                เพิ่มสายรถไฟฟ้าใหม่ (Add New)
                              </Button>
                            </div>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  {/* Distance */}
                  <FormField
                    control={form.control}
                    name={`nearby_transits.${index}.distance_meters`}
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

                  {/* Time */}
                  <FormField
                    control={form.control}
                    name={`nearby_transits.${index}.time`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-[10px] sm:text-xs uppercase tracking-wide">
                          <Clock className="h-3.5 w-3.5 text-blue-500" />
                          เวลา (นาที)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            className="h-9! rounded-lg bg-white border-slate-200 shadow-sm font-medium text-xs text-center focus:ring-0 focus:border-blue-400"
                            placeholder="5"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Station Names: Stacked Vertically */}
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name={`nearby_transits.${index}.station_name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-[10px] sm:text-xs uppercase tracking-wide">
                          <MapPin className="h-3.5 w-3.5 text-blue-500" />
                          ชื่อสถานี (ภาษาไทย)
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

                  {/* International Names Stack */}
                  <div className="grid grid-cols-1 gap-3 pl-2 border-l-2 border-slate-100 ml-1">
                    <FormField
                      control={form.control}
                      name={`nearby_transits.${index}.station_name_en`}
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-300 w-6">EN</span>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="English Station Name"
                            className="h-9 text-xs bg-white text-slate-600 border-slate-200 rounded-lg focus:bg-white transition-all flex-1"
                          />
                        </div>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`nearby_transits.${index}.station_name_cn`}
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
                      name={`nearby_transits.${index}.station_name_ru`}
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-300 w-6">RU</span>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="Название станции"
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

          {/* Add Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 border-dashed border-2 border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 font-medium text-sm transition-all mt-4"
            onClick={handleAddTransit}
          >
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มสถานี
          </Button>
        </div>
      </CardContent>

      {/* Inline Add Transit Dialog */}
      <Dialog open={isTransitModalOpen} onOpenChange={setIsTransitModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border-slate-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              เพิ่มสายรถไฟฟ้า / การเดินทางใหม่
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              สายรถไฟฟ้าใหม่จะถูกบันทึกและพร้อมเลือกใช้งานในฟอร์มทันที
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTransit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">รหัสสายรถไฟฟ้า (Code) <span className="text-red-500">*</span></Label>
              <Input
                value={newTransitCode}
                onChange={(e) => setNewTransitCode(e.target.value.toUpperCase())}
                placeholder="เช่น BTS_GOLD หรือ BRT"
                className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold uppercase"
              />
              <span className="text-[10px] text-slate-400">ภาษาอังกฤษตัวพิมพ์ใหญ่ ไม่มีเว้นวรรค</span>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">ชื่อสายรถไฟฟ้า (ภาษาไทย) <span className="text-red-500">*</span></Label>
              <Input
                value={newTransitLabelTh}
                onChange={(e) => setNewTransitLabelTh(e.target.value)}
                placeholder="เช่น รถไฟฟ้าสายสีทอง / BRT"
                className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">สีประจำสาย</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={newTransitColor}
                  onChange={(e) => setNewTransitColor(e.target.value)}
                  className="w-14 h-11 p-1 rounded-xl bg-slate-50 border-slate-200 cursor-pointer"
                />
                <Input
                  type="text"
                  value={newTransitColor}
                  onChange={(e) => setNewTransitColor(e.target.value)}
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-mono font-bold uppercase flex-1"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTransitModalOpen(false)}
                className="h-10 rounded-xl font-bold text-slate-600"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSavingTransit}
                className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6"
              >
                {isSavingTransit ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                บันทึกสายรถไฟฟ้า
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
