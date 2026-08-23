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
import { Calendar as CalendarIcon, Wallet } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { PriceInput } from "@/components/ui/price-input";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import { ContractFormInput } from "@/features/rental-contracts/schema";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface Step2Props {
  isSale: boolean;
  isPriceEditing: boolean;
  setIsPriceEditing: (val: boolean) => void;
  updateEndDateFromTerm: (months: number) => void;
}

export function Step2ContractDetails({
  isSale,
  isPriceEditing,
  setIsPriceEditing,
  updateEndDateFromTerm,
}: Step2Props) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const form = useFormContext<ContractFormInput>();

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                <CalendarIcon className="h-4 w-4 text-blue-500" />
                {isEn ? "Contract Start Date" : "วันที่เริ่มสัญญา"}
              </FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="end_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                <CalendarIcon className="h-4 w-4 text-blue-500" />
                {isSale ? (isEn ? "Transfer Date" : "วันที่โอน") : (isEn ? "Contract End Date (Calculated)" : "วันที่สิ้นสุดสัญญา (คำนวณ)")}
              </FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  placeholder={isSale ? (isEn ? "DD/MM/YYYY" : "วว/ดด/ปปปป") : (isEn ? "Auto-calculated" : "คำนวณอัตโนมัติ")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rent_price"
          render={({ field }) => (
            <FormItem className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between ml-1 mb-2">
                <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Wallet className="h-4 w-4 text-emerald-500" />
                  {isSale ? (isEn ? "Net Sale Price" : "ราคาขายสุทธิ") : (isEn ? "Monthly Rent Price" : "ราคาค่าเช่าต่อเดือน")}
                </FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPriceEditing(!isPriceEditing)}
                  className={cn(
                    "h-7 px-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer",
                    isPriceEditing 
                      ? "bg-amber-50 text-amber-600 hover:bg-amber-100" 
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  )}
                >
                  {isPriceEditing ? (isEn ? "Lock Price" : "ล็อกราคา") : (isEn ? "Edit Price" : "แก้ไขราคา")}
                </Button>
              </div>
              <FormControl>
                <div className={cn(
                  "transition-all duration-200",
                  !isPriceEditing && "pointer-events-none opacity-60 grayscale-[0.5]"
                )}>
                  <PriceInput
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isSale && (
          <FormField
            control={form.control}
            name="lease_term_months"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-slate-700 ml-1">
                  {isEn ? "Lease Term (Months)" : "ระยะสัญญา (เดือน)"}
                </FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {[12, 24, 36].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          variant={field.value === v ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "flex-1 h-9 rounded-xl font-bold transition-all cursor-pointer",
                            field.value === v ? "bg-blue-600 text-white border-blue-600" : "text-slate-500"
                          )}
                          onClick={() => {
                            field.onChange(v);
                            updateEndDateFromTerm(v);
                          }}
                        >
                          {v / 12} {isEn ? (v / 12 > 1 ? "Years" : "Year") : "ปี"}
                        </Button>
                      ))}
                    </div>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        field.onChange(v);
                        if (!isNaN(v)) updateEndDateFromTerm(v);
                      }}
                      className="h-11 rounded-xl" 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );
}

