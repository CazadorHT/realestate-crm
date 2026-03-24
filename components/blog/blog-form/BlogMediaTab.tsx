"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { BlogPostInput } from "@/features/blog/types";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { ImageIcon, Tag, Calendar as CalendarIcon } from "lucide-react";
import { BlogImageUploader } from "../BlogImageUploader";
import { CategoryDialog } from "../CategoryDialog";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface BlogMediaTabProps {
  form: UseFormReturn<BlogPostInput>;
  categories: { id: string; name: string }[];
}

export function BlogMediaTab({ form, categories }: BlogMediaTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Featured Image */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ImageIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">รูปภาพหน้าปก</h3>
              <p className="text-sm text-slate-500">รูปภาพหลักของบทความ</p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="cover_image"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <BlogImageUploader
                    value={field.value || ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Category & Tags */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Tag className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">หมวดหมู่และแท็ก</h3>
              <p className="text-sm text-slate-500">จัดระเบียบบทความของคุณ</p>
            </div>
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-medium">
                    หมวดหมู่
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 border-slate-200">
                        <SelectValue placeholder="เลือกหมวดหมู่" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      {categories.map(
                        (cat) =>
                          cat.name !== "General" && (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ),
                      )}
                    </SelectContent>
                  </Select>
                  <div className="pt-2">
                    <CategoryDialog categories={categories} />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-medium">
                    แท็ก
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ข่าว, เคล็ดลับ, 2024 (คั่นด้วยเครื่องหมายจุลภาค)"
                      className="h-11 border-slate-200"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-slate-500">
                    ใส่แท็กคั่นด้วยเครื่องหมายจุลภาค (,)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Schedule */}
            <FormField
              control={form.control}
              name="published_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-medium">
                    กำหนดการเผยแพร่
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-11 pl-3 text-left font-normal border-slate-200",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP", {
                              locale: th,
                            })
                          ) : (
                            <span>เลือกวันที่</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date?.toISOString())}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription className="text-slate-500">
                    หากเลือกวันในอนาคต บทความจะถูกตั้งเวลาเผยแพร่
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
