"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  Eye, 
  EyeOff, 
  SortAsc, 
  ImagePlus, 
  Save, 
  Upload, 
  X, 
  Loader2, 
  Image as ImageIcon, 
  ZoomIn, 
  ZoomOut, 
  CheckCircle2,
  Edit
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ServiceImageUploader } from "@/components/services/ServiceImageUploader";
import { ServiceFormValues } from "../ServiceForm";

interface ServiceSidebarProps {
  form: UseFormReturn<ServiceFormValues>;
  saving: boolean;
  isNew: boolean;
  onCancel: () => void;
}

export function ServiceSidebar({
  form,
  saving,
  isNew,
  onCancel,
}: ServiceSidebarProps) {

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden sticky top-4">
        <div className="px-5 py-4 bg-linear-to-r from-emerald-50 to-teal-50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Settings className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-slate-800">
              การจัดการสถานะและลำดับ
            </h3>
          </div>
        </div>
        <div className="p-5 space-y-5">
          {/* Status Toggle */}
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem>
                <div
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer",
                    field.value
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-slate-50 border-slate-200",
                  )}
                  onClick={() => field.onChange(!field.value)}
                >
                  <div className="flex items-center gap-3">
                    {field.value ? (
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Eye className="h-4 w-4 text-emerald-600" />
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-200 rounded-lg">
                        <EyeOff className="h-4 w-4 text-slate-500" />
                      </div>
                    )}
                    <div>
                      <p
                        className={cn(
                          "font-medium text-sm",
                          field.value ? "text-emerald-700" : "text-slate-600",
                        )}
                      >
                        {field.value 
                          ? "เปิดใช้งาน" 
                          : "ซ่อนบริการ"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {field.value 
                          ? "บริการนี้แสดงบนหน้าเว็บไซต์" 
                          : "บริการนี้ถูกซ่อนจากหน้าเว็บไซต์"}
                      </p>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />

          {/* Sort Order */}
          <FormField
            control={form.control}
            name="sort_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-medium flex items-center gap-2">
                  <SortAsc className="h-4 w-4 text-slate-400" />
                  ลำดับการแสดงผล
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white text-center font-mono"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs text-center">
                  ใช้สำหรับจัดลำดับการแสดงผล (ตัวเลขน้อยแสดงก่อน)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Cover Image */}
        <div className="px-5 pb-5 pt-0">
          <div className="pt-5 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <Settings className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-slate-800">
                การตั้งค่าระบบและเผยแพร่
              </h2>
            </div>
            <FormField
              control={form.control}
              name="cover_image"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="bg-white">
                      <ServiceImageUploader
                        value={field.value}
                        onChange={field.onChange}
                        mode="single"
                        aspectRatio={16 / 9}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-5 pb-5">
          <div className="flex flex-col gap-3 pt-5 border-t border-slate-100">
            <Button
              type="submit"
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all gap-2 font-bold text-white rounded-xl"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving
                ? "กำลังบันทึก..."
                : isNew
                  ? "เพิ่มบริการใหม่"
                  : "บันทึกการเปลี่ยนแปลง"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl font-medium"
              onClick={onCancel}
              disabled={saving}
            >
              ยกเลิก
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
