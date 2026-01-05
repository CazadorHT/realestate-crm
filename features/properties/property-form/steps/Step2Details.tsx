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
 */
export function Step2Details({ form, mode }: Step2Props) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-12 duration-700">
      <section className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-50 border border-slate-100 space-y-10">
        <div className="border-b border-slate-50 pb-6">
          <h3 className="text-2xl font-black text-slate-900">
            รายละเอียดข้อมูลทรัพย์
          </h3>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">
            ข้อมูลรายละเอียดและราคา
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {(form.watch("listing_type") === "SALE" ||
            form.watch("listing_type") === "SALE_AND_RENT") && (
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-emerald-600 font-black text-sm uppercase tracking-wider mb-2 block">
                    ราคาตั้งขาย (บาท)
                  </FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <NumberInput
                        value={field.value ?? undefined}
                        onChange={field.onChange}
                        placeholder="0"
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 font-black text-xl transition-colors">
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
                  <FormLabel className="text-blue-600 font-black text-sm uppercase tracking-wider mb-2 block">
                    ค่าเช่าต่อเดือน (บาท)
                  </FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <NumberInput
                        value={field.value ?? undefined}
                        onChange={field.onChange}
                        placeholder="0"
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 font-black text-xl transition-colors">
                        ฿
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
          <FormField
            control={form.control}
            name="bedrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] uppercase font-black text-slate-400 tracking-widest mb-2 block">
                  ห้องนอน
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value ?? ""}
                    className="h-12 bg-white rounded-2xl border-none shadow-sm font-bold text-center"
                    onChange={(e) =>
                      field.onChange(parseNumber(e.target.value))
                    }
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
                <FormLabel className="text-[11px] uppercase font-black text-slate-400 tracking-widest mb-2 block">
                  ห้องน้ำ
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value ?? ""}
                    className="h-12 bg-white rounded-2xl border-none shadow-sm font-bold text-center"
                    onChange={(e) =>
                      field.onChange(parseNumber(e.target.value))
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="size_sqm"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] uppercase font-black text-slate-400 tracking-widest mb-2 block">
                  พื้นที่ (ตร.ม.)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-12 bg-white rounded-2xl border-none shadow-sm font-bold text-center"
                    onChange={(e) =>
                      field.onChange(parseNumber(e.target.value))
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="land_size_sqwah"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] uppercase font-black text-slate-400 tracking-widest mb-2 block">
                  ที่ดิน (ตร.ว.)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-12 bg-white rounded-2xl border-none shadow-sm font-bold text-center"
                    onChange={(e) =>
                      field.onChange(parseNumber(e.target.value))
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-800 font-black text-sm uppercase tracking-wider mb-2 block">
                คำบรรยายประกอบประกาศ
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  rows={6}
                  className="rounded-3xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all leading-relaxed p-8 resize-none shadow-inner"
                  placeholder="บอกเล่าเรื่องราวของบ้านคุณ..."
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-slate-50">
          {/* Commission Sale */}
          {(form.watch("listing_type") === "SALE" ||
            form.watch("listing_type") === "SALE_AND_RENT") && (
            <FormField
              control={form.control}
              name="commission_sale_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700 font-black text-sm uppercase tracking-wider mb-2 block">
                    % ค่าคอมมิชชั่นการขาย 🔒
                  </FormLabel>
                  <FormControl>
                    <div className="relative group/comm">
                      <NumberInput
                        value={field.value ?? undefined}
                        onChange={field.onChange}
                        decimals={2}
                        placeholder="3"
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/comm:text-blue-500 font-black text-xl transition-colors">
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
                        className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                          field.value === val
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-white text-slate-500 border-slate-100 hover:border-blue-200"
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                  {form.watch("price") && field.value && (
                    <div className="mt-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="font-bold text-slate-700">
                        ฿
                        {(
                          ((form.watch("price") || 0) * field.value) /
                          100
                        ).toLocaleString()}
                      </span>{" "}
                      (โดยประมาณ)
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
                  <FormLabel className="text-blue-700 font-black text-sm uppercase tracking-wider mb-2 block">
                    เดือนค่าคอมการเช่า 🔒
                  </FormLabel>
                  <FormControl>
                    <div className="relative group/comm">
                      <NumberInput
                        value={field.value ?? undefined}
                        onChange={field.onChange}
                        decimals={1}
                        placeholder="1"
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/comm:text-blue-500 font-black text-sm transition-colors uppercase">
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
                        className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                          field.value === val
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-white text-slate-500 border-slate-100 hover:border-blue-200"
                        }`}
                      >
                        {val} เดือน
                      </button>
                    ))}
                  </div>
                  {form.watch("rental_price") && field.value && (
                    <div className="mt-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="font-bold text-slate-700">
                        ฿
                        {(
                          (form.watch("rental_price") || 0) * field.value
                        ).toLocaleString()}
                      </span>{" "}
                      (โดยประมาณ)
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
