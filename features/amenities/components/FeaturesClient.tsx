"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Box,
  Layers,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { FeatureSchema, getFeatureSchema, type FeatureFormValues } from "../schema";
import {
  createFeatureAction,
  updateFeatureAction,
  deleteFeatureAction,
  type FeatureRow,
} from "../actions";
import { ICON_MAP, DEFAULT_ICON } from "../icons";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeleteFeaturesAction } from "../bulk-actions";
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface FeaturesClientProps {
  features: FeatureRow[];
}

const CATEGORIES = [
  "ทั่วไป",
  "ความปลอดภัย",
  "ความสะดวกสบาย",
  "ครัว",
  "ห้องน้ำ",
  "ภายนอก",
  "เทคโนโลยี",
  "สันทนาการ",
  "สถานที่ใกล้เคียง",
  "อื่นๆ",
];

export function FeaturesClient({ features }: FeaturesClientProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const isEn = language === "en";
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureRow | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate Stats
  const totalFeatures = features.length;
  const uniqueCategories = new Set(
    features.map((f) => f.category).filter(Boolean),
  ).size;
  const iconCount = Object.keys(ICON_MAP).length;

  const form = useForm<FeatureFormValues>({
    resolver: zodResolver(getFeatureSchema(isEn)),
    defaultValues: {
      name: "",
      category: "",
      icon_key: "box",
    },
  });

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
        setIsDialogOpen(false);
        setEditingFeature(null);
        form.reset({ name: "", category: "", icon_key: "box" });
        router.refresh();
      } else {
        toast.error(result.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"));
      }
    } catch (error) {
      toast.error(isEn ? "Failed to save" : "บันทึกไม่สำเร็จ");
    }
  };

  const handleEdit = (feature: FeatureRow) => {
    setEditingFeature(feature);
    form.reset({
      name: feature.name,
      category: feature.category || "",
      icon_key: feature.icon_key || "box",
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingFeature(null);
    form.reset({ name: "", category: "", icon_key: "box" });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteFeatureAction(id);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message || (isEn ? "Failed to delete" : "ลบไม่สำเร็จ"));
      throw new Error(result.message || (isEn ? "Failed to delete" : "ลบไม่สำเร็จ"));
    }
  };

  const filteredFeatures = features.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.category &&
        f.category.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const totalPages = Math.ceil(filteredFeatures.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFeatures = filteredFeatures.slice(startIndex, endIndex);

  // Bulk selection
  const allIds = useMemo(
    () => currentFeatures.map((f) => f.id),
    [currentFeatures],
  );
  const {
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isPartialSelected,
    selectedCount,
    selectedIds,
  } = useTableSelection(allIds);

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const result = await bulkDeleteFeaturesAction(ids);
    if (result.success) {
      toast.success(result.message);
      clearSelection();
      router.refresh();
    } else {
      toast.error(result.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"));
      throw new Error(result.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"));
    }
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <Box className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {isEn ? "Amenities & Features" : "สิ่งอำนวยความสะดวก (Features)"}
              </h1>
            </div>
            <p className="text-white/80 text-sm md:text-base max-w-md">
              {isEn 
                ? `Manage property amenities, icons, and categories • Total `
                : `จัดการรายการสิ่งอำนวยความสะดวก ไอคอน และหมวดหมู่ • มีทั้งหมด `}
              <span className="font-bold text-white">{totalFeatures}</span>{" "}
              {isEn ? "items" : "รายการ"}
            </p>
          </div>

          <Button
            onClick={handleAddNew}
            size="lg"
            className="bg-white text-slate-800 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold cursor-pointer"
          >
            <Plus className="w-5 h-5 mr-2" />
            {isEn ? "Add New Feature" : "เพิ่มรายการใหม่"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isEn ? "Total Features" : "รายการทั้งหมด"}</CardTitle>
            <Box className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFeatures}</div>
            <p className="text-xs text-slate-500 mt-1">Total Features</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isEn ? "Categories" : "หมวดหมู่"}</CardTitle>
            <Layers className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {uniqueCategories}
            </div>
            <p className="text-xs text-slate-500 mt-1">Active Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isEn ? "System Icons" : "ไอคอนระบบ"}</CardTitle>
            <LayoutGrid className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {iconCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">Available Icons</p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        entityName={isEn ? "Items" : "รายการ"}
      />

      {/* Filters & Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder={isEn ? "Search (name, category)..." : "ค้นหา (ชื่อ, หมวดหมู่)..."}
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to page 1 on search
              }}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={() => toggleSelectAll(allIds)}
                  aria-label={isEn ? "Select all" : "เลือกทั้งหมด"}
                  className={
                    isPartialSelected
                      ? "data-[state=checked]:bg-primary/50"
                      : ""
                  }
                />
              </TableHead>
              <TableHead className="w-[80px]">{isEn ? "Icon" : "ไอคอน"}</TableHead>
              <TableHead>{isEn ? "Name" : "ชื่อ"}</TableHead>
              <TableHead>{isEn ? "Category" : "หมวดหมู่"}</TableHead>
              <TableHead className="w-[100px] text-right">{isEn ? "Actions" : "จัดการ"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentFeatures.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Box className="h-8 w-8 text-slate-300" />
                    <p>{isEn ? "No features found" : "ไม่พบข้อมูล"}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              currentFeatures.map((feature) => {
                const Icon = ICON_MAP[feature.icon_key || "box"] || DEFAULT_ICON;
                return (
                  <TableRow
                    key={feature.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isSelected(feature.id) ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <TableCell className="w-[50px]">
                      <Checkbox
                        checked={isSelected(feature.id)}
                        onCheckedChange={() => toggleSelect(feature.id)}
                        aria-label={isEn ? `Select ${feature.name}` : `เลือก ${feature.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="p-2 bg-slate-100 rounded-lg w-fit text-slate-600">
                        <Icon className="w-5 h-5" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {feature.name}
                    </TableCell>
                    <TableCell>
                      {feature.category ? (
                        <Badge
                          variant="outline"
                          className="font-medium bg-slate-50"
                        >
                          {feature.category}
                        </Badge>
                      ) : (
                        <span className="text-slate-400 italic text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(feature)}
                          className="hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <ConfirmDialog
                          title={isEn ? "Delete Feature" : "ลบรายการ"}
                          description={isEn ? `Are you sure you want to delete "${feature.name}"?` : `คุณแน่ใจหรือไม่ที่จะลบ "${feature.name}"?`}
                          confirmText={isEn ? "Delete" : "ลบ"}
                          variant="destructive"
                          onConfirm={() => handleDelete(feature.id)}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t bg-slate-50/50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {isEn 
              ? `Showing ${Math.min(startIndex + 1, filteredFeatures.length)} to ${Math.min(endIndex, filteredFeatures.length)} of ${filteredFeatures.length} items`
              : `แสดง ${Math.min(startIndex + 1, filteredFeatures.length)} ถึง ${Math.min(endIndex, filteredFeatures.length)} จากทั้งหมด ${filteredFeatures.length} รายการ`}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium text-slate-600">
              {isEn ? `Page ${currentPage} / ${totalPages || 1}` : `หน้า ${currentPage} / ${totalPages || 1}`}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={currentPage === totalPages || totalPages === 0}
              className="h-8 w-8 p-0 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Form Dialog */}
      <ResponsiveDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingFeature ? (isEn ? "Edit Feature" : "แก้ไขรายการ") : (isEn ? "Add New Feature" : "เพิ่มรายการใหม่")}
        description={isEn ? "Specify feature name, category, and icon representation." : "กรอกข้อมูลสิ่งอำนวยความสะดวก หมวดหมู่ และไอคอนที่ต้องการแสดง"}
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="flex-1 sm:flex-none rounded-xl h-11 font-bold border-slate-200 text-slate-500 cursor-pointer"
            >
              {isEn ? "Cancel" : "ยกเลิก"}
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              className="flex-1 rounded-xl h-11 px-8 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              {editingFeature ? (isEn ? "Save Changes" : "บันทึกการแก้ไข") : (isEn ? "Create Feature" : "สร้างรายการใหม่")}
            </Button>
          </div>
        }
      >
        <Form {...form}>
          <form className="space-y-6 py-2 text-left">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-bold">{isEn ? "Feature Name" : "ชื่อสิ่งอำนวยความสะดวก"}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isEn ? "e.g. Swimming Pool, Fitness" : "เช่น สระว่ายน้ำ, ฟิตเนส"}
                      className="rounded-xl border-slate-200 h-11 focus:ring-blue-500/10"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-bold">{isEn ? "Category" : "หมวดหมู่"}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder={isEn ? "Select or type..." : "เลือกหรือพิมพ์..."}
                          className="rounded-xl border-slate-200 h-11 focus:ring-blue-500/10"
                          {...field}
                          value={field.value || ""}
                          list="categories"
                        />
                        <datalist id="categories">
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
                    <FormLabel className="text-slate-700 font-bold">{isEn ? "Icon" : "ไอคอน"}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                          <SelectValue placeholder={isEn ? "Select Icon" : "เลือกไอคอน"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px] rounded-xl border-slate-200 shadow-xl">
                        <div className="grid grid-cols-4 gap-2 p-2">
                          {Object.entries(ICON_MAP).map(
                            ([key, IconComponent]) => (
                              <SelectItem
                                key={key}
                                value={key}
                                className="flex justify-center cursor-pointer rounded-md p-2 hover:bg-slate-100 focus:bg-slate-100 data-[state=checked]:bg-blue-50 data-[state=checked]:border-blue-200 border border-transparent transition-all"
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <IconComponent className="w-5 h-5 text-slate-600" />
                                  <span className="text-[9px] text-slate-400 truncate w-full text-center">
                                    {key}
                                  </span>
                                </div>
                              </SelectItem>
                            ),
                          )}
                        </div>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </ResponsiveDialog>
    </div>
  );
}
