"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Search, X, Settings, Loader2, Box } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
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

import { FeatureSchema, type FeatureFormValues } from "../schema";
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

const CATEGORIES = [
  "ทั่วไป (General)",
  "ความปลอดภัย (Security)",
  "ความสะดวกสบาย (Comfort)",
  "ครัว (Kitchen)",
  "สำหรับเด็ก (Kids)",
  "ห้องน้ำ (Bathroom)",
  "ภายนอก (Exterior)",
  "เทคโนโลยี (Tech)",
  "สันทนาการ (Recreation)",
  "สถานที่ใกล้เคียง (Nearby)",
  "บริการ (Services)",
  "อื่นๆ (Other)",
];

interface FeaturesManagementDialogProps {
  onUpdate?: () => void; // Callback to reload parent data
}

export function FeaturesManagementDialog({
  onUpdate,
}: FeaturesManagementDialogProps) {
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Management Dialog State
  const [isOpen, setIsOpen] = useState(false);

  // Edit/Create Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureRow | null>(null);

  const form = useForm<FeatureFormValues>({
    resolver: zodResolver(FeatureSchema),
    defaultValues: {
      name: "",
      name_en: "",
      name_cn: "",
      category: "",
      icon_key: "box",
    },
  });

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
          // If editing, close the dialog
          setIsFormOpen(false);
          setEditingFeature(null);
        } else {
          // If adding new, keep dialog open but reset form
          // Don't close setIsFormOpen(false)
          // Just reset to defaults
          form.reset({ name: "", category: values.category, icon_key: "box" });
          // Note: preserving category might be helpful for bulk entry
        }

        loadData(); // Reload local list
        onUpdate?.(); // Notify parent
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("บันทึกข้อมูลไม่สำเร็จ");
    }
  };

  const handleEdit = (feature: FeatureRow) => {
    setEditingFeature(feature);
    form.reset({
      name: feature.name,
      name_en: feature.name_en || "",
      name_cn: feature.name_cn || "",
      category: feature.category || "",
      icon_key: feature.icon_key,
    });
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingFeature(null);
    form.reset({
      name: "",
      name_en: "",
      name_cn: "",
      category: "",
      icon_key: "box",
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await deleteFeatureAction(id);
    if (result.success) {
      toast.success(result.message);
      loadData();
      onUpdate?.();
    } else {
      toast.error(result.message || "ลบข้อมูลไม่สำเร็จ");
    }
  };

  const filteredFeatures = features.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.category &&
        f.category.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-white/50 hover:bg-white/80"
        >
          <Settings className="w-4 h-4" />
          จัดการสิ่งอำนวยความสะดวก
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[60vw] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b bg-white z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <DialogTitle className="text-xl">
                จัดการรายการสิ่งอำนวยความสะดวก
              </DialogTitle>
              <DialogDescription className="mt-1 text-slate-500">
                เพิ่ม ลบ หรือแก้ไขรายการ Features ที่ใช้ในระบบ
              </DialogDescription>
            </div>
            <Button
              onClick={handleAddNew}
              size="sm"
              className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              เพิ่มรายการใหม่
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ค้นหา (ชื่อ, หมวดหมู่)..."
              className="pl-9 bg-slate-50 border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="flex h-full items-center justify-center flex-col gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-slate-400">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <>
              {filteredFeatures.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[300px]">
                  <Box className="w-12 h-12 text-slate-200" />
                  <p>ไม่พบรายการที่ค้นหา</p>
                  <Button variant="link" onClick={handleAddNew}>
                    + สร้างรายการใหม่
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
                            title="ลบรายการ"
                            description={`คุณแน่ใจหรือไม่ที่จะลบ "${feature.name}"?`}
                            confirmText="ลบ"
                            cancelText="ยกเลิก"
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
                            name={feature.icon_key}
                            className="w-6 h-6"
                          />
                        </div>
                        <div className="w-full space-y-1">
                          <h4
                            className="font-medium text-slate-700 text-sm  px-1 group-hover:text-emerald-900 transition-colors"
                            title={feature.name}
                          >
                            {feature.name}
                          </h4>
                          {feature.category && (
                            <div>
                              <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded-full inline-block max-w-full truncate border border-slate-100 uppercase tracking-wide">
                                {feature.category.split("(")[0].trim()}
                              </span>
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
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>
                {editingFeature ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อรายการ (ไทย)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="เช่น สระว่ายน้ำ, ฟิตเนส"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>หมวดหมู่</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกหมวดหมู่..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
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
                      <FormLabel>ไอคอน</FormLabel>
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

                <div className="flex justify-end gap-2 pt-4 border-t mt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsFormOpen(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {editingFeature ? "บันทึกการแก้ไข" : "สร้างรายการ"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
