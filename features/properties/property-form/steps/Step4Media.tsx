"use client";

import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  IMAGE_UPLOAD_POLICY,
  PropertyImageUploader,
} from "@/components/property-image-uploader";
import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_ORDER,
} from "@/features/properties/labels";
import { AgentMultiSelect } from "../sections/AgentMultiSelect";
import type { Step4Props } from "../types";

/**
 * Step 4: Media & Management
 * Images, owner, status, agents, and property source
 */
export function Step4Media({
  form,
  mode,
  owners,
  agents,
  initialImages,
  uploadSessionId,
  persistImages,
}: Step4Props) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-12 duration-700">
      <section className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-50 border border-slate-100 space-y-10">
        <div className="border-b border-slate-50 pb-6">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            คลังรูปภาพและอัลบั้ม
          </h3>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
            อัลบั้มรูปภาพและสถานะประกาศ
          </p>
        </div>

        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem className="bg-slate-50/50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200">
              <FormLabel className="text-blue-700 font-black text-sm uppercase tracking-wider mb-6 block text-center">
                อัปโหลดรูปภาพที่สวยที่สุดของคุณ
              </FormLabel>
              <FormControl>
                <PropertyImageUploader
                  sessionId={uploadSessionId}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  initialImages={initialImages}
                  maxFiles={IMAGE_UPLOAD_POLICY.maxFiles}
                  maxFileSizeMB={IMAGE_UPLOAD_POLICY.maxBytes / (1024 * 1024)}
                  cleanupOnUnmount={!persistImages}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-slate-50">
          <FormField
            control={form.control}
            name="owner_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-800 font-black text-xs uppercase tracking-widest mb-3 block">
                  เจ้าของทรัพย์ 🔒
                </FormLabel>
                <Select
                  value={field.value ?? "NONE"}
                  onValueChange={(v) => field.onChange(v === "NONE" ? null : v)}
                >
                  <FormControl>
                    <SelectTrigger className="h-14 rounded-2xl bg-white border-2 border-slate-100 font-bold px-6">
                      <SelectValue placeholder="เลือกเจ้าของ" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white rounded-2xl shadow-2xl border-none max-h-[300px] overflow-y-auto">
                    <SelectItem
                      value="NONE"
                      className="font-bold text-slate-400"
                    >
                      -- ไม่ระบุ --
                    </SelectItem>
                    {owners.map((o) => (
                      <SelectItem
                        key={o.id}
                        value={o.id}
                        className="py-4 font-black"
                      >
                        {o.full_name} {o.phone ? `(${o.phone})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-800 font-black text-xs uppercase tracking-widest mb-3 block">
                  สถานะปัจจุบัน
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-14 rounded-2xl bg-white border-2 border-slate-100 font-bold px-6">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white rounded-2xl border-none shadow-2xl">
                    {PROPERTY_STATUS_ORDER.map((s: any) => (
                      <SelectItem key={s} value={s} className="py-4 font-black">
                        {(PROPERTY_STATUS_LABELS as any)[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <AgentMultiSelect form={form} agents={agents} />

        <FormField
          control={form.control}
          name="property_source"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-800 font-black text-xs uppercase tracking-widest mb-3 block">
                แหล่งที่มาของทรัพย์ 🔒
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  rows={3}
                  className="rounded-3xl border-slate-100 bg-slate-50 font-medium p-6 resize-none"
                  placeholder="เช่น จากกลุ่ม Facebook, แนะนำจากเพื่อน..."
                />
              </FormControl>
            </FormItem>
          )}
        />
      </section>
    </div>
  );
}
