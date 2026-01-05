"use client";

import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { NumberInput } from "../components/NumberInput";
import type { Step2Props } from "../types";

// Util function for parsing numbers from input
const parseNumber = (s: string) => {
  const cleaned = s.replace(/[^0-9.-]/g, "");
  return cleaned === "" ? undefined : Number(cleaned);
};

/**
 * Step 2: Property Details
 * Price, rental price, specs, description, and commission fields
 * Compact Refactor
 */
export function Step2Details({ form, mode }: Step2Props) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-8">
        {/* === SECTION 1: PRICE === */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              ราคาและเงื่อนไข
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(form.watch("listing_type") === "SALE" ||
              form.watch("listing_type") === "SALE_AND_RENT") && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-bold text-sm mb-1.5 block">
                      ราคาตั้งขาย
                    </FormLabel>
                    <FormControl>
                      <div className="relative flex items-center">
                        <NumberInput
                          value={field.value ?? undefined}
                          onChange={field.onChange}
                          placeholder="0"
                          className="h-11 rounded-l-lg rounded-r-none border-r-0 bg-white border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-semibold text-lg"
                        />
                        <div className="h-11 px-4 bg-slate-50 border border-l-0 border-slate-200 rounded-r-lg flex items-center text-slate-500 text-sm font-medium">
                          ฿
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(form.watch("listing_type") === "RENT" ||
              form.watch("listing_type") === "SALE_AND_RENT") && (
              <FormField
                control={form.control}
                name="rental_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-bold text-sm mb-1.5 block">
                      ค่าเช่าต่อเดือน
                    </FormLabel>
                    <FormControl>
                      <div className="relative flex items-center">
                        <NumberInput
                          value={field.value ?? undefined}
                          onChange={field.onChange}
                          placeholder="0"
                          className="h-11 rounded-l-lg rounded-r-none border-r-0 bg-white border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-semibold text-lg"
                        />
                        <div className="h-11 px-4 bg-slate-50 border border-l-0 border-slate-200 rounded-r-lg flex items-center text-slate-500 text-sm font-medium">
                          ฿ / เดือน
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Maintenance Fee */}
            <FormField
              control={form.control}
              name="maintenance_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-600 font-bold text-sm mb-1.5 block">
                    ค่าส่วนกลาง
                  </FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                      <NumberInput
                        value={field.value ?? undefined}
                        onChange={field.onChange}
                        placeholder="0"
                        className="h-11 rounded-l-lg rounded-r-none border-r-0 bg-white border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-semibold text-lg"
                      />
                      <div className="h-11 px-4 bg-slate-50 border border-l-0 border-slate-200 rounded-r-lg flex items-center text-slate-500 text-sm font-medium">
                        ฿ / ปี
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* === SECTION 2: SPECS (Bed, Bath, Parking, Floor) === */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              พื้นที่และสัดส่วน
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <FormField
              control={form.control}
              name="bedrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-bold text-sm mb-1.5 block">
                    ห้องนอน
                  </FormLabel>
                  <FormControl>
                    <NumberInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0"
                      className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-100 rounded-lg text-center"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bathrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-bold text-sm mb-1.5 block">
                    ห้องน้ำ
                  </FormLabel>
                  <FormControl>
                    <NumberInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0"
                      className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-100 rounded-lg text-center"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parking_slots"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-bold text-sm mb-1.5 block">
                    ที่จอดรถ
                  </FormLabel>
                  <FormControl>
                    <NumberInput
                      value={field.value ?? undefined}
                      onChange={field.onChange}
                      placeholder="0"
                      className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-100 rounded-lg text-center"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="floor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-bold text-sm mb-1.5 block">
                    ชั้นที่ / จำนวนชั้น
                  </FormLabel>
                  <FormControl>
                    <NumberInput
                      value={field.value ?? undefined}
                      onChange={field.onChange}
                      placeholder="0"
                      className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-100 rounded-lg text-center"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* === SECTION 3: SIZE & AREA === */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              ขนาดและทำเล
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="size_sqm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-bold text-sm mb-1.5 block">
                    พื้นที่ใช้สอย
                  </FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                      <NumberInput
                        value={field.value ?? undefined}
                        onChange={field.onChange}
                        placeholder="0"
                        className="h-11 rounded-l-lg rounded-r-none border-r-0 bg-white border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-semibold text-center"
                      />
                      <div className="h-11 px-3 bg-slate-50 border border-l-0 border-slate-200 rounded-r-lg flex items-center text-slate-500 text-sm font-medium whitespace-nowrap">
                        ตร.ม.
                      </div>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="land_size_sqwah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-bold text-sm mb-1.5 block">
                    ขนาดที่ดิน
                  </FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                      <NumberInput
                        value={field.value ?? undefined}
                        onChange={field.onChange}
                        placeholder="0"
                        className="h-11 rounded-l-lg rounded-r-none border-r-0 bg-white border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-semibold text-center"
                      />
                      <div className="h-11 px-3 bg-slate-50 border border-l-0 border-slate-200 rounded-r-lg flex items-center text-slate-500 text-sm font-medium whitespace-nowrap">
                        ตร.ว.
                      </div>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="zoning"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-bold text-sm mb-1.5 block">
                    ผังสี / Zoning
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="เช่น สีส้ม ย.5-10"
                      className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-100 rounded-lg"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* === SECTION 4: ADDITIONAL INFO & TAGS === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="h-full">
                <FormLabel className="text-slate-700 font-bold text-sm mb-1.5 block">
                  รายละเอียดเพิ่มเติม
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    rows={5}
                    className="min-h-[140px] rounded-xl border-slate-200 bg-white focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all leading-relaxed p-4 resize-none shadow-sm"
                    placeholder="จุดเด่น สิ่งอำนวยความสะดวก และรายละเอียดอื่นๆ..."
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Tags Section */}
          <div className="space-y-4">
            <div>
              <FormLabel className="text-slate-700 font-bold text-sm mb-3 block">
                คุณสมบัติพิเศษ
              </FormLabel>
              <FormField
                control={form.control}
                name="is_pet_friendly"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span>🐶</span> Pet Friendly
                      </FormLabel>
                      <p className="text-xs text-slate-500 font-medium">
                        อนุญาตให้เลี้ยงสัตว์ได้
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* === SECTION 5: COMMISSION === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
          {/* Commission Sale */}
          {(form.watch("listing_type") === "SALE" ||
            form.watch("listing_type") === "SALE_AND_RENT") && (
            <FormField
              control={form.control}
              name="commission_sale_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-bold text-sm mb-1.5 block flex items-center gap-2">
                    % คอมมิชชั่นขาย{" "}
                    <span className="text-[10px] text-slate-400 font-normal ml-auto">
                      🔒 เฉพาะ Admin/Staff
                    </span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                      <NumberInput
                        value={field.value ?? undefined}
                        onChange={field.onChange}
                        decimals={2}
                        placeholder="3"
                        className="h-10 rounded-l-lg rounded-r-none border-r-0 bg-white border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm font-bold"
                      />
                      <div className="h-10 px-3 bg-slate-50 border border-l-0 border-slate-200 rounded-r-lg flex items-center text-slate-500 text-xs font-bold">
                        %
                      </div>
                    </div>
                  </FormControl>
                  <div className="flex gap-2 mt-2">
                    {[3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => field.onChange(val)}
                        className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold border transition-colors ${
                          field.value === val
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                  {form.watch("price") && field.value && (
                    <div className="mt-2 text-xs text-slate-500 flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
                      <span>ได้ค่าคอมมิชชั่นประมาณ:</span>
                      <span className="font-bold text-slate-700">
                        ฿
                        {(
                          ((form.watch("price") || 0) * field.value) /
                          100
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Commission Rent */}
          {(form.watch("listing_type") === "RENT" ||
            form.watch("listing_type") === "SALE_AND_RENT") && (
            <FormField
              control={form.control}
              name="commission_rent_months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-bold text-sm mb-1.5 block flex items-center gap-2">
                    คอมมิชชั่นเช่า (เดือน){" "}
                    <span className="text-[10px] text-slate-400 font-normal ml-auto">
                      🔒 เฉพาะ Admin/Staff
                    </span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                      <NumberInput
                        value={field.value ?? undefined}
                        onChange={field.onChange}
                        decimals={1}
                        placeholder="1"
                        className="h-10 rounded-l-lg rounded-r-none border-r-0 bg-white border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm font-bold"
                      />
                      <div className="h-10 px-3 bg-slate-50 border border-l-0 border-slate-200 rounded-r-lg flex items-center text-slate-500 text-xs font-bold">
                        เดือน
                      </div>
                    </div>
                  </FormControl>
                  <div className="flex gap-2 mt-2">
                    {[0.5, 1, 1.5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => field.onChange(val)}
                        className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold border transition-colors ${
                          field.value === val
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {val} ด.
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    *คำนวณจากราคาเช่ารายเดือน
                  </div>
                  {form.watch("rental_price") && field.value && (
                    <div className="mt-2 text-xs text-slate-500 flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
                      <span>ได้ค่าคอมมิชชั่นประมาณ:</span>
                      <span className="font-bold text-slate-700">
                        ฿
                        {(
                          (form.watch("rental_price") || 0) * field.value
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </section>
    </div>
  );
}
