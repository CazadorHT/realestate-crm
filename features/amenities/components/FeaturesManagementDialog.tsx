"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Search, X, Settings, Loader2, Box } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { FeatureSchema, getFeatureSchema, type FeatureFormValues } from "../schema";
import {
  createFeatureAction,
  updateFeatureAction,
  deleteFeatureAction,
  getFeatures,
  type FeatureRow,
} from "../actions";
import { DEFAULT_ICON } from "../icons";
import { IconPicker } from "@/components/icon-picker";
import { DynamicIcon } from "@/components/dynamic-icon";

import { useLanguage } from "@/components/providers/LanguageProvider";

const CATEGORIES = [
  "RESIDENTIAL",
  "OFFICE",
  "FACILITY",
  "UNIT",
  "EXTERIOR",
  "SECURITY",
  "KITCHEN",
  "TECH",
  "RECREATION",
  "NEARBY",
  "SERVICES",
  "OTHER",
];

const FEATURE_TRANSLATION_MAP: Record<string, string> = {
  "อ่างอาบน้ำ": "Bathtub",
  "คลับเฮ้าส์": "Clubhouse",
  "คลับเฮ้าส์ / เลานจ์": "Clubhouse / Lounge",
  "โซล่าเซลล์": "Solar Cells",
  "โซลาร์เซลล์": "Solar Cells",
  "วิวทะเล": "Sea View",
  "วิวภูเขา": "Mountain View",
  "วิวเมือง": "City View",
  "วิวแม่น้ำ": "River View",
  "สวน": "Garden",
  "สวนหย่อม": "Garden",
  "สวนขั้นดาดฟ้า": "Rooftop Garden",
  "สวนดาดฟ้า": "Rooftop Garden",
  "สวนสาธารณะ": "Public Park",
  "เครื่องชาร์จรถยนต์ไฟฟ้า": "EV Charger",
  "จุดชาร์จรถยนต์ไฟฟ้า": "EV Charging Station",
  "โซนสัตว์เลี้ยง": "Pet Friendly Zone",
  "ที่จอดรถ": "Parking",
  "โรงยิม / ฟิตเนส": "Fitness / Gym",
  "ฟิตเนส": "Fitness Gym",
  "ลิฟต์": "Elevator",
  "ลิฟต์โดยสาร": "Passenger Lift",
  "สระว่ายน้ำ": "Swimming Pool",
  "ห้องซาวน่า / ห้องอบไอน้ำ": "Sauna / Steam Room",
  "ห้องซาวน่า": "Sauna",
  "ห้องอบไอน้ำ": "Steam Room",
  "สตรีม": "Steam Room",
  "สนามเด็กเล่น": "Playground",
  "ระบบรักษาความปลอดภัย": "24/7 Security",
  "ระบบรักษาความปลอดภัย 24 ชม.": "24-Hour Security",
  "กล้องวงจรปิด": "CCTV",
  "กล้องวงจรปิด (CCTV)": "CCTV Security",
  "คีย์การ์ด": "Keycard Access",
  "เข้า-ออกด้วยคีย์การ์ด": "Key Card Access",
  "ล็อบบี้": "Lobby",
  "ล็อบบี้ / แผนกต้อนรับ": "Lobby / Reception",
  "ห้องสมุด": "Library",
  "ห้องสมุด / Co-working Space": "Library / Co-working Space",
  "co-working space": "Co-Working Space",
  "เพดานสูง": "High Ceiling",
  "เพดานสูงโปร่ง": "High Ceiling",
  "ระบบสมาร์ทโฮม": "Smart Home System",
  "ห้องแม่บ้าน": "Maid Quarter",
  "บริการรถรับส่ง": "Shuttle Service",
  "พนักงานต้อนรับ": "Concierge",
  "อินเทอร์เน็ต / wifi": "High-Speed Wi-Fi",
  "wifi": "Wi-Fi",
  "เครื่องปรับอากาศ": "Air Conditioning",
  "แอร์": "Air Conditioning",
  "เครื่องทำน้ำอุ่น": "Water Heater",
  "เฟอร์นิเจอร์": "Fully Furnished",
  "ตู้เย็น": "Refrigerator",
  "ไมโครเวฟ": "Microwave",
  "เตาไฟฟ้า": "Electric Stove",
  "เครื่องดูดควัน": "Cooker Hood",
  "เครื่องซักผ้า": "Washing Machine",
  "ระเบียง": "Balcony",
  "จากุซซี่": "Jacuzzi",
  "อ่างจากุซซี่": "Jacuzzi Bathtub",
};

function getFeatureDisplayName(feature: { name: string; name_en?: string | null }, isEn: boolean): string {
  if (!isEn) return feature.name;
  if (feature.name_en && feature.name_en.trim()) return feature.name_en;

  const trimmed = feature.name.trim();
  if (FEATURE_TRANSLATION_MAP[trimmed]) return FEATURE_TRANSLATION_MAP[trimmed];

  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(FEATURE_TRANSLATION_MAP)) {
    if (lower === key.toLowerCase()) return val;
  }

  return feature.name;
}

interface FeaturesManagementDialogProps {
  onUpdate?: () => void; // Callback to reload parent data
}

export function FeaturesManagementDialog({
  onUpdate,
}: FeaturesManagementDialogProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Management Dialog State
  const [isOpen, setIsOpen] = useState(false);

  // Edit/Create Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureRow | null>(null);

  const form = useForm<FeatureFormValues>({
    resolver: zodResolver(getFeatureSchema(isEn)),
    defaultValues: {
      name: "",
      name_en: "",
      name_cn: "",
      name_ru: "",
      category: "",
      icon_key: "box",
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await getFeatures();
    setFeatures(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const onSubmit = async (values: FeatureFormValues) => {
    setIsSubmitting(true);
    try {
      let result;
      if (editingFeature) {
        result = await updateFeatureAction(editingFeature.id, values);
      } else {
        result = await createFeatureAction(values);
      }

      if (result.success) {
        toast.success(result.message);

        if (editingFeature) {
          setIsFormOpen(false);
          setEditingFeature(null);
        } else {
          form.reset({ name: "", name_en: "", name_cn: "", name_ru: "", category: values.category, icon_key: "box" });
        }

        loadData();
        onUpdate?.();
      } else {
        toast.error(result.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"));
      }
    } catch (error) {
      toast.error(isEn ? "Failed to save feature" : "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (feature: FeatureRow) => {
    setEditingFeature(feature);
    form.reset({
      name: feature.name,
      name_en: feature.name_en || "",
      name_cn: feature.name_cn || "",
      name_ru: feature.name_ru || "",
      category: feature.category || "",
      icon_key: feature.icon_key || "box",
    });
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingFeature(null);
    form.reset({
      name: "",
      name_en: "",
      name_cn: "",
      name_ru: "",
      category: "",
      icon_key: "box",
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id);
    try {
      const result = await deleteFeatureAction(id);
      if (result.success) {
        toast.success(result.message);
        loadData();
        onUpdate?.();
      } else {
        toast.error(result.message || (isEn ? "Failed to delete" : "ลบข้อมูลไม่สำเร็จ"));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filteredFeatures = features.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.name_en && f.name_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.category &&
        f.category.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title={isEn ? "Manage Features & Amenities" : "จัดการรายการสิ่งอำนวยความสะดวก"}
      description={isEn ? "Add, delete, or edit features used across the system" : "เพิ่ม ลบ หรือแก้ไขรายการ Features ที่ใช้ในระบบ"}
      className="sm:max-w-[800px]"
      trigger={
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-white/50 hover:bg-white/80 text-blue-500! cursor-pointer"
        >
          <Settings className="w-4 h-4 text-blue-500" />
          <span>{isEn ? "Manage Amenities" : "จัดการสิ่งอำนวยความสะดวก"}</span>
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between mb-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={isEn ? "Search (name, category)..." : "ค้นหา (ชื่อ, หมวดหมู่)..."}
              className="pl-9 bg-slate-50 border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={handleAddNew}
            size="sm"
            className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? "Add New Feature" : "เพิ่มรายการใหม่"}</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="flex h-full items-center justify-center flex-col gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-slate-400">{isEn ? "Loading features..." : "กำลังโหลดข้อมูล..."}</p>
            </div>
          ) : (
            <>
              {filteredFeatures.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[300px]">
                  <Box className="w-12 h-12 text-slate-200" />
                  <p>{isEn ? "No matching features found" : "ไม่พบรายการที่ค้นหา"}</p>
                  <Button variant="link" onClick={handleAddNew}>
                    {isEn ? "+ Create New Feature" : "+ สร้างรายการใหม่"}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredFeatures.map((feature) => {
                    return (
                      <div
                        key={feature.id}
                        className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col items-center text-center gap-3"
                        onClick={() => handleEdit(feature)}
                      >
                        <div
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ConfirmDialog
                            title={isEn ? "Delete Feature" : "ลบรายการ"}
                            description={isEn ? `Are you sure you want to delete "${feature.name_en || feature.name}"?` : `คุณแน่ใจหรือไม่ที่จะลบ "${feature.name}"?`}
                            confirmText={isEn ? "Delete" : "ลบ"}
                            cancelText={isEn ? "Cancel" : "ยกเลิก"}
                            variant="destructive"
                            onConfirm={() =>
                              handleDelete(feature.id, feature.name)
                            }
                            trigger={
                              <div className="h-8 w-8 rounded-full bg-white shadow-sm border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all">
                                <X className="w-4 h-4" />
                              </div>
                            }
                          />
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                          <DynamicIcon
                            name={feature.icon_key || "box"}
                            className="w-6 h-6"
                          />
                        </div>
                        <div className="w-full space-y-1">
                          <h4
                            className="font-medium text-slate-700 text-sm px-1 group-hover:text-emerald-900 transition-colors"
                            title={feature.name}
                          >
                            {getFeatureDisplayName(feature, isEn)}
                          </h4>
                          {feature.category && (
                            <div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded-full inline-block max-w-full truncate border border-slate-100 uppercase tracking-wide">
                                  {(() => {
                                    const displayNames: Record<string, { th: string; en: string }> = {
                                      RESIDENTIAL: { th: "ที่พักอาศัย", en: "Residential" },
                                      OFFICE: { th: "สำนักงาน", en: "Office" },
                                      FACILITY: { th: "ส่วนกลาง", en: "Facility" },
                                      UNIT: { th: "ในยูนิต", en: "Unit" },
                                      EXTERIOR: { th: "ภายนอก", en: "Exterior" },
                                      SECURITY: { th: "ความปลอดภัย", en: "Security" },
                                      KITCHEN: { th: "ครัว", en: "Kitchen" },
                                      TECH: { th: "เทคโนโลยี", en: "Tech" },
                                      RECREATION: { th: "สันทนาการ", en: "Recreation" },
                                      NEARBY: { th: "สถานที่ใกล้เคียง", en: "Nearby" },
                                      SERVICES: { th: "บริการ", en: "Services" },
                                      OTHER: { th: "อื่นๆ", en: "Other" },
                                    };
                                    const entry = displayNames[feature.category.toUpperCase()];
                                    if (entry) return isEn ? entry.en : entry.th;
                                    return feature.category.split("(")[0].trim();
                                  })()}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Nested Dialog for Add/Edit */}
        <ResponsiveDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          title={editingFeature ? (isEn ? "Edit Feature" : "แก้ไขรายการ") : (isEn ? "Add New Feature" : "เพิ่มรายการใหม่")}
          className="sm:max-w-[450px]"
        >
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-4 px-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEn ? "Feature Name (Thai)" : "ชื่อรายการ (ไทย)"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={isEn ? "e.g. สระว่ายน้ำ, ฟิตเนส" : "เช่น สระว่ายน้ำ, ฟิตเนส"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="name_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>English Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Swimming Pool" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name_cn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>中文名称</FormLabel>
                      <FormControl>
                        <Input placeholder="游泳池" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name_ru"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Русское название</FormLabel>
                      <FormControl>
                        <Input placeholder="Бассейн" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEn ? "Category" : "หมวดหมู่"}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isEn ? "Select category..." : "เลือกหมวดหมู่..."} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((c) => {
                          const displayNames: Record<string, { th: string; en: string }> = {
                            RESIDENTIAL: { th: "ที่พักอาศัย (Residential)", en: "Residential" },
                            OFFICE: { th: "สำนักงาน (Office)", en: "Office" },
                            FACILITY: { th: "ส่วนกลาง (Facilities)", en: "Facilities" },
                            UNIT: { th: "ในยูนิต (Unit Features)", en: "In-Unit Features" },
                            EXTERIOR: { th: "ภายนอก (Exterior)", en: "Exterior" },
                            SECURITY: { th: "ความปลอดภัย (Security)", en: "Security" },
                            KITCHEN: { th: "ครัว (Kitchen)", en: "Kitchen" },
                            TECH: { th: "เทคโนโลยี (Tech)", en: "Technology & Smart Home" },
                            RECREATION: { th: "สันทนาการ (Recreation)", en: "Recreation & Sports" },
                            NEARBY: { th: "สถานที่ใกล้เคียง (Nearby)", en: "Nearby Places" },
                            SERVICES: { th: "บริการ (Services)", en: "Services" },
                            OTHER: { th: "อื่นๆ (Other)", en: "Other" },
                          };
                          return (
                            <SelectItem key={c} value={c}>
                              {displayNames[c] ? (isEn ? displayNames[c].en : displayNames[c].th) : c}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEn ? "Icon" : "ไอคอน"}</FormLabel>
                    <FormControl>
                      <IconPicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200 mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 rounded-xl text-slate-500 font-medium cursor-pointer"
                  onClick={() => setIsFormOpen(false)}
                >
                  {isEn ? "Cancel" : "ยกเลิก"}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold gap-2 shadow-lg shadow-blue-100 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingFeature ? (isEn ? "Save Changes" : "บันทึกการแก้ไข") : (isEn ? "Create Feature" : "สร้างรายการ")}
                </Button>
              </div>
            </form>
          </Form>
        </ResponsiveDialog>
      </div>
    </ResponsiveDialog>
  );
}
