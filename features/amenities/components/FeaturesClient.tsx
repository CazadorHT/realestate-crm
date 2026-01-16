"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { FeatureSchema, type FeatureFormValues } from "../schema";
import {
  createFeatureAction,
  updateFeatureAction,
  deleteFeatureAction,
  type FeatureRow,
} from "../actions";
import { ICON_MAP, DEFAULT_ICON } from "../icons";

interface FeaturesClientProps {
  features: FeatureRow[];
}

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

export function FeaturesClient({ features }: FeaturesClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureRow | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate Stats
  const totalFeatures = features.length;
  const uniqueCategories = new Set(
    features.map((f) => f.category).filter(Boolean)
  ).size;
  const iconCount = Object.keys(ICON_MAP).length;

  const form = useForm<FeatureFormValues>({
    resolver: zodResolver(FeatureSchema),
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
        toast.error(result.message || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("บันทึกไม่สำเร็จ");
    }
  };

  const handleEdit = (feature: FeatureRow) => {
    setEditingFeature(feature);
    form.reset({
      name: feature.name,
      category: feature.category || "",
      icon_key: feature.icon_key,
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
      toast.error(result.message || "ลบไม่สำเร็จ");
    }
  };

  const filteredFeatures = features.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.category &&
        f.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredFeatures.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFeatures = filteredFeatures.slice(startIndex, endIndex);

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            สิ่งอำนวยความสะดวก (Features)
          </h1>
          <p className="text-slate-500 mt-2">
            จัดการรายการสิ่งอำนวยความสะดวก ไอคอน และหมวดหมู่
          </p>
        </div>
        <Button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มรายการใหม่
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายการทั้งหมด</CardTitle>
            <Box className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFeatures}</div>
            <p className="text-xs text-slate-500 mt-1">Total Features</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">หมวดหมู่</CardTitle>
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
            <CardTitle className="text-sm font-medium">ไอคอนระบบ</CardTitle>
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

      {/* Filters & Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ค้นหา (ชื่อ, หมวดหมู่)..."
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
              <TableHead className="w-[80px]">ไอคอน</TableHead>
              <TableHead>ชื่อ</TableHead>
              <TableHead>หมวดหมู่</TableHead>
              <TableHead className="w-[100px] text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentFeatures.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-32 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Box className="h-8 w-8 text-slate-300" />
                    <p>ไม่พบข้อมูล</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              currentFeatures.map((feature) => {
                const Icon = ICON_MAP[feature.icon_key] || DEFAULT_ICON;
                return (
                  <TableRow
                    key={feature.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
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
                          className="hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <ConfirmDialog
                          title="ลบรายการ"
                          description={`คุณแน่ใจหรือไม่ที่จะลบ "${feature.name}"?`}
                          confirmText="ลบ"
                          variant="destructive"
                          onConfirm={() => handleDelete(feature.id)}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:text-red-600 hover:bg-red-50"
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
            แสดง {Math.min(startIndex + 1, filteredFeatures.length)} ถึง{" "}
            {Math.min(endIndex, filteredFeatures.length)} จากทั้งหมด{" "}
            {filteredFeatures.length} รายการ
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium text-slate-600">
              หน้า {currentPage} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={currentPage === totalPages || totalPages === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingFeature ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อสิ่งอำนวยความสะดวก</FormLabel>
                    <FormControl>
                      <Input placeholder="เช่น สระว่ายน้ำ, ฟิตเนส" {...field} />
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
                            placeholder="เลือกหรือพิมพ์..."
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
                                  className="flex justify-center cursor-pointer rounded-md p-2 hover:bg-slate-100 focus:bg-slate-100 data-[state=checked]:bg-blue-50 data-[state=checked]:border-blue-200 border border-transparent transition-all"
                                >
                                  <div className="flex flex-col items-center gap-1">
                                    <IconComponent className="w-5 h-5 text-slate-600" />
                                    <span className="text-[9px] text-slate-400 truncate w-full text-center">
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

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingFeature ? "บันทึกการแก้ไข" : "สร้างรายการใหม่"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
