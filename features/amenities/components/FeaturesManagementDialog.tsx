"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Settings,
  Save,
  Loader2,
} from "lucide-react";

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
import { Badge } from "@/components/ui/badge";

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
  "General",
  "Security",
  "Comfort",
  "Kitchen",
  "Bathroom",
  "Exterior",
  "Tech",
  "Recreation",
  "Nearby",
  "Other",
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
    // We handle confirmation in the UI before calling this,
    // BUT the requirement says "Delete at the cross on the card head".
    // I will use ConfirmDialog wrapping the X button.
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
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          จัดการสิ่งอำนวยความสะดวก
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              จัดการสิ่งอำนวยความสะดวก
            </DialogTitle>
            <Button
              onClick={handleAddNew}
              size="sm"
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              เพิ่มรายการ
            </Button>
          </div>
          <DialogDescription className="mt-2 text-slate-500">
            จัดการรายการสิ่งอำนวยความสะดวก ไอคอน และหมวดหมู่
          </DialogDescription>

          <div className="pt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ค้นหา..."
              className="pl-9 bg-slate-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFeatures.map((feature) => {
                const Icon = ICON_MAP[feature.icon_key] || DEFAULT_ICON;
                return (
                  <div
                    key={feature.id}
                    className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col items-center text-center gap-3"
                    onClick={() => handleEdit(feature)}
                  >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <ConfirmDialog
                        title="ลบรายการ"
                        description={`คุณแน่ใจหรือไม่ที่จะลบ "${feature.name}"?`}
                        confirmText="ลบ"
                        cancelText="ยกเลิก"
                        variant="destructive"
                        onConfirm={() => handleDelete(feature.id, feature.name)}
                        trigger={
                          <div
                            className="h-6 w-6 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <X className="w-3 h-3" />
                          </div>
                        }
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 text-sm">
                        {feature.name}
                      </h4>
                      {feature.category && (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                          {feature.category}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!loading && filteredFeatures.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p>ไม่พบรายการที่ค้นหา</p>
            </div>
          )}
        </div>

        {/* Nested Dialog for Add/Edit */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[500px]">
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>หมวดหมู่</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="เลือกหรือพิมพ์ใหม่"
                              {...field}
                              value={field.value || ""}
                              list="categories-list"
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
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="เลือกไอคอน" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            <div className="grid grid-cols-4 gap-2 p-2">
                              {Object.entries(ICON_MAP).map(
                                ([key, IconComponent]) => (
                                  <SelectItem
                                    key={key}
                                    value={key}
                                    className="flex justify-center cursor-pointer rounded-md p-2 hover:bg-slate-100 focus:bg-slate-100 data-[state=checked]:bg-blue-50 data-[state=checked]:border-blue-200 border border-transparent"
                                    // hideIndicator - removed to fix type error, relying on default check or custom styling if needed but SelectItem handles it.
                                  >
                                    <div className="flex flex-col items-center gap-1">
                                      <IconComponent className="w-5 h-5 text-slate-600" />
                                      <span className="text-[10px] text-slate-400 truncate w-full text-center">
                                        {key}
                                      </span>
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
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFormOpen(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit">
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
