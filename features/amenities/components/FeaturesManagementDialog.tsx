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
import { ICON_MAP, DEFAULT_ICON } from "../icons";

const CATEGORIES = [
  "ทั่วไป (General)",
  "ความปลอดภัย (Security)",
  "ความสะดวกสบาย (Comfort)",
  "ครัว (Kitchen)",
  "ห้องน้ำ (Bathroom)",
  "ภายนอก (Exterior)",
  "เทคโนโลยี (Tech)",
  "สันทนาการ (Recreation)",
  "สถานที่ใกล้เคียง (Nearby)",
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
        setIsFormOpen(false);
        setEditingFeature(null);
        form.reset({ name: "", category: "", icon_key: "box" });
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
      category: feature.category || "",
      icon_key: feature.icon_key,
    });
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingFeature(null);
    form.reset({ name: "", category: "", icon_key: "box" });
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
        f.category.toLowerCase().includes(searchTerm.toLowerCase()))
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
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredFeatures.map((feature) => {
                    const Icon = ICON_MAP[feature.icon_key] || DEFAULT_ICON;
                    return (
                      <div
                        key={feature.id}
                        className="group relative bg-white border border-slate-200 rounded-xl p-3 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col items-center text-center gap-2 aspect-square justify-center"
                        onClick={() => handleEdit(feature)}
                      >
                        <div
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
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
                              <div className="h-6 w-6 rounded-full bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-600 flex items-center justify-center transition-colors">
                                <X className="w-3 h-3" />
                              </div>
                            }
                          />
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="w-full">
                          <h4
                            className="font-medium text-slate-700 text-sm truncate px-1"
                            title={feature.name}
                          >
                            {feature.name}
                          </h4>
                          {feature.category && (
                            <div className="mt-1">
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block max-w-full truncate">
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
                      <FormLabel>ชื่อรายการ</FormLabel>
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

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>หมวดหมู่</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="เลือก..."
                            {...field}
                            value={field.value || ""}
                            list="categories-list"
                            className="text-sm"
                          />
                          <datalist id="categories-list">
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c} />
                            ))}
                          </datalist>
                        </div>
                      </FormControl>
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 w-full">
                            <SelectValue placeholder="เลือกไอคอน" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          <div className="grid grid-cols-6 gap-2 p-2">
                            {Object.entries(ICON_MAP).map(
                              ([key, IconComponent]) => (
                                <SelectItem
                                  key={key}
                                  value={key}
                                  className="flex justify-center cursor-pointer rounded-md p-2 hover:bg-slate-100 focus:bg-slate-100 data-[state=checked]:bg-blue-50 data-[state=checked]:border-blue-200 border border-transparent"
                                >
                                  <div className="flex flex-col items-center justify-center w-6 h-6">
                                    <IconComponent className="w-5 h-5 text-slate-600" />
                                  </div>
                                </SelectItem>
                              )
                            )}
                          </div>
                        </SelectContent>
                      </Select>
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
