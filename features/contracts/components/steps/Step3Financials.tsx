"use client";

import { 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage, 
  FormField 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PriceInput } from "@/components/ui/price-input";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import { ContractFormInput } from "@/features/rental-contracts/schema";

interface Step3Props {
  isSale: boolean;
}

export function Step3Financials({
  isSale,
}: Step3Props) {
  const form = useFormContext<ContractFormInput>();
  const rentPrice = form.watch("rent_price") || 0;
  const depositAmount = form.watch("deposit_amount") || 0;
  const advanceAmount = form.watch("advance_payment_amount") || 0;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
      {!isSale ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="deposit_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center justify-between text-sm font-bold text-slate-700 ml-1">
                  <span>เงินประกัน / มัดจำ</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => field.onChange(m * (rentPrice || 0))}
                        className={cn(
                          "px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all",
                          field.value === m * (rentPrice || 0)
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        )}
                      >
                        {m} ด.
                      </button>
                    ))}
                  </div>
                </FormLabel>
                <FormControl>
                  <PriceInput
                    value={field.value || 0}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="advance_payment_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center justify-between text-sm font-bold text-slate-700 ml-1">
                  <span>เงินล่วงหน้า</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => field.onChange(m * (rentPrice || 0))}
                        className={cn(
                          "px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all",
                          field.value === m * (rentPrice || 0)
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        )}
                      >
                        {m} ด.
                      </button>
                    ))}
                  </div>
                </FormLabel>
                <FormControl>
                  <PriceInput
                    value={field.value || 0}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="sm:col-span-2 bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-sm font-medium">เงินประกัน</span>
              <span className="text-sm font-bold">฿{depositAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 pb-3 border-b border-slate-200/50">
              <span className="text-sm font-medium">เงินล่วงหน้า</span>
              <span className="text-sm font-bold">฿{advanceAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-base font-bold text-slate-800">รวมยอดชำระแรกเข้า</span>
              <span className="text-xl font-black text-blue-600">
                ฿{(depositAmount + advanceAmount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between pt-1">
            <span className="text-base font-bold text-slate-800">ราคาขายสุทธิ</span>
            <span className="text-xl font-black text-emerald-600">
              ฿{(rentPrice || 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <FormField
        control={form.control}
        name="other_terms"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5 ml-1">
              <FormLabel className="text-sm font-bold text-slate-700">
                {isSale ? "เงื่อนไขการโอน" : "ข้อกำหนดอื่นๆ"}
              </FormLabel>
              {isSale && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
                  onClick={() => {
                    const term = "ค่าธรรมเนียมการโอน 50/50";
                    if (!(field.value || "").includes(term)) {
                      field.onChange(field.value ? `${field.value}, ${term}` : term);
                    }
                  }}
                >
                  + โอน 50/50
                </Button>
              )}
            </div>
            <FormControl>
              <Input
                placeholder={isSale ? "ระบุค่าใช้จ่ายการโอน..." : "เช่น จ่ายล่วงหน้า 1 เดือน"}
                {...field}
                className="h-11 rounded-xl"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
