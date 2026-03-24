"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { BlogPostInput } from "@/features/blog/types";
import { FormField } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BlogStickyBottomProps {
  form: UseFormReturn<BlogPostInput>;
  isSubmitting: boolean;
  characterCount: number;
}

export function BlogStickyBottom({
  form,
  isSubmitting,
  characterCount,
}: BlogStickyBottomProps) {
  const router = useRouter();
  const watchedIsPublished = form.watch("is_published");
  const watchedTitle = form.watch("title");

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] sm:w-max md:min-w-[600px] lg:min-w-6xl max-w-6xl px-4">
      <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl py-3 md:py-4 px-6 md:px-10 flex items-center justify-center lg:justify-between gap-6">
        <div className="hidden lg:flex items-center gap-4 text-xs text-slate-500">
          <span className="hidden md:inline">
            {watchedIsPublished
              ? "บทความนี้ถูกเผยแพร่แล้ว"
              : "บทความนี้ยังเป็นแบบร่าง"}
          </span>
          <div className="h-4 w-px bg-slate-200 hidden md:block" />
          <span>{characterCount.toLocaleString()} ตัวอักษร</span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 justify-center lg:justify-end">
          <FormField
            control={form.control}
            name="is_published"
            render={({ field }) => (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 h-10 md:h-12 overflow-hidden">
                <span className="text-[10px] md:text-sm font-medium text-slate-600">
                  เผยแพร่
                </span>
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    toast.success(
                      checked
                        ? "เปิดเผยแพร่บทความสำเร็จ"
                        : "ปิดการเผยแพร่บทความสำเร็จ"
                    );
                  }}
                  className="h-5 w-9 data-[state=checked]:bg-blue-600 scale-75 md:scale-90"
                />
              </div>
            )}
          />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="hover:bg-slate-100 h-10 md:h-12 px-2 md:px-4 text-xs md:text-sm"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !watchedTitle?.trim() ||
                characterCount === 0 ||
                !form.formState.isDirty
              }
              className="gap-2 bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-green-500/25 min-w-[80px] md:min-w-[120px] h-10 md:h-12 text-xs md:text-sm"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              บันทึก
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
