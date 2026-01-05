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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
 * Compact Refactor
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
  const isCoAgent = form.watch("is_co_agent");
  const listingType = form.watch("listing_type");

  const showSaleCommission =
    listingType === "SALE" || listingType === "SALE_AND_RENT";
  const showRentCommission =
    listingType === "RENT" || listingType === "SALE_AND_RENT";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/60 space-y-6">
        <div className="border-b border-slate-50 pb-4">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            คลังรูปภาพและอัลบั้ม
          </h3>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">
            อัลบั้มรูปภาพและสถานะประกาศ
          </p>
        </div>

        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem className="bg-slate-50/50 p-6 rounded-xl border-2 border-dashed border-slate-200">
              <FormLabel className="text-blue-700 font-bold text-xs uppercase tracking-wider mb-4 block text-center">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-50">
          <FormField
            control={form.control}
            name="owner_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-800 font-bold text-xs uppercase tracking-wide mb-2 block">
                  เจ้าของทรัพย์ 🔒
                </FormLabel>
                <Select
                  value={field.value ?? "NONE"}
                  onValueChange={(v) => field.onChange(v === "NONE" ? null : v)}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-lg bg-white border border-slate-200 font-bold px-4 text-sm">
                      <SelectValue placeholder="เลือกเจ้าของ" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white rounded-xl shadow-lg border-none max-h-[300px] overflow-y-auto">
                    <SelectItem
                      value="NONE"
                      className="font-bold text-slate-400 text-sm"
                    >
                      -- ไม่ระบุ --
                    </SelectItem>
                    {owners.map((o) => (
                      <SelectItem
                        key={o.id}
                        value={o.id}
                        className="py-3 font-bold text-sm"
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
                <FormLabel className="text-slate-800 font-bold text-xs uppercase tracking-wide mb-2 block">
                  สถานะปัจจุบัน
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 rounded-lg bg-white border border-slate-200 font-bold px-4 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white rounded-xl border-none shadow-lg">
                    {PROPERTY_STATUS_ORDER.map((s: any) => (
                      <SelectItem
                        key={s}
                        value={s}
                        className="py-3 font-bold text-sm"
                      >
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
              <FormLabel className="text-slate-800 font-bold text-xs uppercase tracking-wide mb-2 block">
                แหล่งที่มาของทรัพย์ 🔒
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  rows={2}
                  className="rounded-xl border-slate-200 bg-slate-50 font-medium p-4 resize-none shadow-inner text-sm focus:bg-white transition-colors"
                  placeholder="เช่น จากกลุ่ม Facebook, แนะนำจากเพื่อน..."
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Co-Agent Section */}
        <div className="pt-6 border-t border-slate-50 space-y-6">
          <FormField
            control={form.control}
            name="is_co_agent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-xl border border-blue-100 bg-blue-50/30 p-4 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel className="text-blue-900 font-bold text-base">
                    มี Co-agent
                  </FormLabel>
                  <p className="text-xs font-bold text-blue-600/70 uppercase tracking-wider">
                    ทำร่วมกับตัวแทนคนอื่น
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {isCoAgent && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 rounded-xl bg-slate-50/50 border border-dashed border-slate-300 animate-in fade-in zoom-in duration-300">
              <FormField
                control={form.control}
                name="co_agent_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-800 font-bold text-[10px] uppercase tracking-wider mb-1.5 block">
                      ชื่อ Co-Agent
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        className="h-10 rounded-lg bg-white border border-slate-200 font-bold px-4 text-sm"
                        placeholder="ระบุชื่อตัวแทนร่วม"
                        data-field="co_agent_name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="co_agent_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-800 font-bold text-[10px] uppercase tracking-wider mb-1.5 block">
                      เบอร์โทรติดต่อ
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        className="h-10 rounded-lg bg-white border border-slate-200 font-bold px-4 text-sm"
                        placeholder="08X-XXX-XXXX"
                        data-field="co_agent_phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="co_agent_contact_channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-800 font-bold text-[10px] uppercase tracking-wider mb-1.5 block">
                      ช่องทางติดต่ออื่น (ไม่บังคับ)
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined} // Handle null safely
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-lg bg-white border border-slate-200 font-bold px-4 text-sm">
                          <SelectValue placeholder="เลือกช่องทาง" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white rounded-xl border-none shadow-lg">
                        <SelectItem
                          value="Line"
                          className="py-2.5 font-bold text-sm"
                        >
                          Line
                        </SelectItem>
                        <SelectItem
                          value="Facebook"
                          className="py-2.5 font-bold text-sm"
                        >
                          Facebook
                        </SelectItem>
                        <SelectItem
                          value="Instagram"
                          className="py-2.5 font-bold text-sm"
                        >
                          Instagram
                        </SelectItem>
                        <SelectItem
                          value="WHATSAPP"
                          className="py-2.5 font-bold text-sm"
                        >
                          WhatsApp
                        </SelectItem>
                        <SelectItem
                          value="PHONE"
                          className="py-2.5 font-bold text-sm"
                        >
                          เบอร์โทรสาร
                        </SelectItem>
                        <SelectItem
                          value="OTHER"
                          className="py-2.5 font-bold text-sm"
                        >
                          อื่นๆ
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="co_agent_contact_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-800 font-bold text-[10px] uppercase tracking-wider mb-1.5 block">
                      ID / ลิงก์ช่องทางติดต่อ
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        className="h-10 rounded-lg bg-white border border-slate-200 font-bold px-4 text-sm"
                        placeholder="เช่น Line ID หรือ Facebook URL"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {showSaleCommission && (
                <FormField
                  control={form.control}
                  name="co_agent_sale_commission_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-800 font-bold text-[10px] uppercase tracking-wider mb-1.5 block">
                        ส่วนแบ่งขาย (%)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          className="h-10 rounded-lg bg-white border border-slate-200 font-bold px-4 text-sm"
                          placeholder="เช่น 1.5"
                          data-field="co_agent_sale_commission_percent"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {showRentCommission && (
                <FormField
                  control={form.control}
                  name="co_agent_rent_commission_months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-800 font-bold text-[10px] uppercase tracking-wider mb-1.5 block">
                        ส่วนแบ่งเช่า (เดือน)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          className="h-10 rounded-lg bg-white border border-slate-200 font-bold px-4 text-sm"
                          placeholder="เช่น 0.5"
                          data-field="co_agent_rent_commission_months"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
