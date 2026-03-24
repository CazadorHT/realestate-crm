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
import { Settings, Eye, EyeOff, SortAsc, ImagePlus, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlogImageUploader } from "@/components/blog/BlogImageUploader";

interface ServiceSidebarProps {
  form: UseFormReturn<any>;
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
            <h3 className="font-semibold text-slate-800">การตั้งค่า</h3>
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
                        {field.value ? "เผยแพร่" : "ซ่อน"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {field.value ? "แสดงบนเว็บไซต์" : "ไม่แสดงบนเว็บไซต์"}
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
                  ลำดับการแสดง
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white text-center font-mono"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs text-center">
                  ตัวเลขน้อย = แสดงก่อน
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Cover Image */}
        <div className="px-5 pb-5 pt-0">
          <div className="pt-5 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <ImagePlus className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">
                ภาพหน้าปก
              </span>
            </div>
            <FormField
              control={form.control}
              name="cover_image"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="rounded-xl overflow-hidden border-2 border-dashed border-slate-200 hover:border-blue-300 transition-colors">
                      <BlogImageUploader
                        value={field.value}
                        onChange={field.onChange}
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
              disabled={saving}
              className="w-full h-12 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30"
            >
              {saving ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Save className="mr-2 h-5 w-5" />
              )}
              {isNew ? "สร้างบริการ" : "บันทึกการเปลี่ยนแปลง"}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={onCancel}
              className="w-full h-11 border-slate-200 hover:bg-slate-50"
            >
              ยกเลิก
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
