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
import { getNearbyPlaceCategoriesAction, upsertMasterDataAction } from "@/features/properties/actions/fetch-master-data";
import {
  Landmark,
  MapPin,
  Ruler,
  Clock,
  Trash2,
  Plus,
  Sparkles,
  Loader2,
  MoreVertical,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SectionHeader } from "../../components/SectionHeader";
import { useFormContext, useWatch, type UseFormReturn } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import type { PropertyFormValues } from "@/features/properties/schema";
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // intentionally omit displayValue: adding it would create an infinite update loop

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

  const [categories, setCategories] = React.useState<{ value: string; label: string }[]>(
    NEARBY_PLACE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))
  );
  const [isLoadingCats, setIsLoadingCats] = React.useState(true);

  // Inline Modal State
  const [isCatModalOpen, setIsCatModalOpen] = React.useState(false);
  const [newCatCode, setNewCatCode] = React.useState("");
  const [newCatLabelTh, setNewCatLabelTh] = React.useState("");
  const [isSavingCat, setIsSavingCat] = React.useState(false);
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const [isMobileOrTablet, setIsMobileOrTablet] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 1535px)");
    const onChange = () => setIsMobileOrTablet(mql.matches);
    mql.addEventListener("change", onChange);
    setIsMobileOrTablet(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    getNearbyPlaceCategoriesAction().then((data) => {
      if (isMounted) {
        if (data.length > 0) {
          const dbValues = new Set(data.map((d) => d.code));
          const defaultsToAdd = NEARBY_PLACE_CATEGORIES
            .filter((c) => !dbValues.has(c.value))
            .map((c) => ({ value: c.value, label: c.label }));
          setCategories([
            ...data.map((d) => ({ value: d.code, label: d.label.th })),
            ...defaultsToAdd,
          ]);
        }
        setIsLoadingCats(false);
      }
    }).catch(() => {
      if (isMounted) setIsLoadingCats(false);
    });
    return () => { isMounted = false; };
  }, []);

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatCode || !newCatLabelTh) {
      toast.error("กรุณากรอกรหัสและชื่อหมวดหมู่");
      return;
    }
    setIsSavingCat(true);
    try {
      const res = await upsertMasterDataAction({
        type: "NEARBY_PLACE_CATEGORY",
        code: newCatCode.toUpperCase(),
        label: { th: newCatLabelTh, en: newCatLabelTh, cn: newCatLabelTh, ru: newCatLabelTh },
        sort_order: categories.length * 10,
        is_active: true,
      });
      if (res.success) {
        toast.success("เพิ่มหมวดหมู่ใหม่สำเร็จ!");
        setCategories([...categories, { value: newCatCode.toUpperCase(), label: newCatLabelTh }]);
        setIsCatModalOpen(false);
        setNewCatCode("");
        setNewCatLabelTh("");
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSavingCat(false);
    }
  };

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
            <div className="flex items-center gap-2">
              {fields.length > 0 ? (
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
                  <span>AI {isTranslating ? "กำลังแปล..." : "แปลชื่อทั้งหมด"}</span>
                </Button>
              ) : null}
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
                    onClick={() => setIsCatModalOpen(true)}
                    className="flex items-center gap-2 text-xs font-bold text-emerald-600 cursor-pointer py-2 rounded-lg hover:bg-emerald-50"
                  >
                    <Plus className="h-4 w-4" />
                    <span>เพิ่มหมวดหมู่ใหม่ (Add Category)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => window.open('/protected/admin/master-data', '_blank')}
                    className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer py-2 rounded-lg hover:bg-slate-50"
                  >
                    <Landmark className="h-4 w-4 text-slate-400" />
                    <span>จัดการข้อมูลระบบ (Master Data)</span>
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

                <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-4">
                  <FormField
                    control={form.control}
                    name={`nearby_places.${index}.category`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 font-medium text-slate-700 text-[10px] sm:text-xs uppercase tracking-wide">
                          <Landmark className="h-3.5 w-3.5 text-blue-500" />
                          <span>ประเภท</span>
                        </FormLabel>
                        {isMobileOrTablet ? (
                          <ResponsiveDialog
                            open={openIndex === index}
                            onOpenChange={(open) => setOpenIndex(open ? index : null)}
                            title="เลือกหมวดหมู่สถานที่"
                            trigger={
                              <Button
                                type="button"
                                variant="outline"
                                disabled={isLoadingCats}
                                className="w-full h-10 bg-white rounded-lg border-slate-200 shadow-sm font-medium text-xs justify-start text-left text-slate-800"
                              >
                                {isLoadingCats ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span>กำลังโหลด...</span>
                                  </div>
                                ) : (
                                  <span>
                                    {categories.find((cat) => cat.value === field.value)?.label || field.value || "เลือก..."}
                                  </span>
                                )}
                              </Button>
                            }
                          >
                            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2 bg-white">
                              {categories.map((cat) => {
                                const isSelected = field.value === cat.value;
                                return (
                                  <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => {
                                      field.onChange(cat.value);
                                      setOpenIndex(null);
                                    }}
                                    className={cn(
                                      "w-full flex items-center justify-between p-3.5 rounded-xl transition-all active:scale-[0.98] border text-left",
                                      isSelected
                                        ? "bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm"
                                        : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700",
                                    )}
                                  >
                                    <span className="text-xs font-bold">{cat.label}</span>
                                    {isSelected && (
                                      <div className="bg-blue-600 rounded-full p-1 text-white">
                                        <Check className="h-3 w-3" />
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                              <div className="pt-2 border-t border-slate-100 mt-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="w-full justify-start text-xs text-blue-600 font-bold hover:bg-blue-50 py-2.5 h-auto cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenIndex(null);
                                    setIsCatModalOpen(true);
                                  }}
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                                  เพิ่มหมวดหมู่ใหม่ (Add New)
                                </Button>
                              </div>
                            </div>
                          </ResponsiveDialog>
                        ) : (
                          <Select value={field.value} onValueChange={field.onChange} disabled={isLoadingCats}>
                            <FormControl>
                              <SelectTrigger className="w-full h-10 bg-white rounded-lg border-slate-200 shadow-sm font-medium text-xs">
                                {isLoadingCats ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span>กำลังโหลด...</span>
                                  </div>
                                ) : (
                                  <SelectValue placeholder="เลือก..." />
                                )}
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white rounded-xl">
                              {categories.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value} className="font-medium py-2 text-sm">
                                  {cat.label}
                                </SelectItem>
                              ))}
                              <div className="p-1 border-t border-slate-100 mt-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="w-full justify-start text-xs text-blue-600 font-bold hover:bg-blue-50 py-1.5 h-auto cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsCatModalOpen(true);
                                  }}
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                                  เพิ่มหมวดหมู่ใหม่ (Add New)
                                </Button>
                              </div>
                            </SelectContent>
                          </Select>
                        )}
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
                          <span>ระยะทาง (กม.)</span>
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
                          <span>เวลา (นาที)</span>
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
                          <span>ชื่อสถานที่ (ภาษาไทย)</span>
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
            className="w-full h-12 border-dashed border-2 border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 font-medium text-sm transition-all mt-4 cursor-pointer"
            onClick={handleAddPlace}
          >
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มสถานที่
          </Button>
        </div>
      </CardContent>

      {/* Inline Add Category Dialog */}
      <Dialog open={isCatModalOpen} onOpenChange={setIsCatModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border-slate-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              <span>เพิ่มหมวดหมู่สถานที่ใกล้เคียงใหม่</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              หมวดหมู่ใหม่จะถูกบันทึกและพร้อมเลือกใช้งานในฟอร์มทันที
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCat} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">รหัสหมวดหมู่ (Code) <span className="text-red-500">*</span></Label>
              <Input
                value={newCatCode}
                onChange={(e) => setNewCatCode(e.target.value.toUpperCase())}
                placeholder="เช่น SUPERMARKET หรือ CLINIC"
                className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold uppercase"
              />
              <span className="text-[10px] text-slate-400">ภาษาอังกฤษตัวพิมพ์ใหญ่ ไม่มีเว้นวรรค</span>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">ชื่อหมวดหมู่ (ภาษาไทย) <span className="text-red-500">*</span></Label>
              <Input
                value={newCatLabelTh}
                onChange={(e) => setNewCatLabelTh(e.target.value)}
                placeholder="เช่น ซูเปอร์มาร์เก็ต / คลินิก"
                className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCatModalOpen(false)}
                className="h-10 rounded-xl font-bold text-slate-600"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSavingCat}
                className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
              >
                {isSavingCat ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                <span>บันทึกหมวดหมู่</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
