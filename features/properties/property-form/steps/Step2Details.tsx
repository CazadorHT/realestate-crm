"use client";

import React, { useMemo } from "react";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "../components/NumberInput";
import type { Step2Props } from "../types";
import {
  Banknote,
  LayoutGrid,
  Maximize2,
  FileText,
  Percent,
  Lock,
  TrendingDown,
  Sparkles,
  Info,
  PawPrint,
  ShieldCheck,
} from "lucide-react";
// จัดการ header section
function SectionHeader({
  icon: Icon,
  title,
  desc,
  tone = "default",
  right,
}: {
  icon: React.ElementType;
  title: string;
  desc?: string;
  tone?: "default" | "blue" | "purple" | "emerald";
  right?: React.ReactNode;
}) {
  const toneMap: Record<string, string> = {
    default: "text-slate-700 bg-slate-100",
    blue: "text-blue-700 bg-blue-100",
    purple: "text-purple-700 bg-purple-100",
    emerald: "text-emerald-700 bg-emerald-100",
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 rounded-xl p-2 ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold tracking-tight text-slate-900">
              {title}
            </h3>
            {desc ? (
              <span className="hidden sm:inline text-xs text-slate-500">
                {desc}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {right ? <div className="pt-0.5">{right}</div> : null}
    </div>
  );
}
// จัดการ input number
function UnitNumberField({
  label,
  name,
  control,
  placeholder,
  suffix,
  className,
  decimals,
  disabled,
  labelHint,
  description,
  emphasize,
}: {
  label: string;
  name: any;
  control: any;
  placeholder?: string;
  suffix: string;
  className?: string;
  decimals?: number;
  disabled?: boolean;
  labelHint?: React.ReactNode;
  description?: string;
  emphasize?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
            <span className="inline-flex items-center gap-2">
              {label}
              {labelHint}
            </span>
            {fieldState.error ? (
              <span className="text-xs font-medium text-rose-600">
                {fieldState.error.message}
              </span>
            ) : null}
          </FormLabel>

          {description ? (
            <FormDescription className="text-xs text-slate-500">
              {description}
            </FormDescription>
          ) : null}
          {/*  แก้ไข Input ได้ที่นี้  */}
          <FormControl>
            <div className="flex items-center ">
              <NumberInput
                {...field}
                decimals={decimals}
                placeholder={placeholder}
                disabled={disabled}
                className={[
                  "h-11 w-full rounded-l-xl rounded-r-none border-r-0 bg-white",
                  "border-slate-200 focus:border-slate-900 focus:ring-0",
                  "text-slate-900 align-middle",
                  emphasize ? "font-medium text-sm" : "font-semibold",
                  disabled ? "bg-slate-50 text-slate-500" : "",
                  className ?? "",
                ].join(" ")}
              />
              <span
                className={[
                  "h-11 select-none whitespace-nowrap rounded-r-xl border border-l-0 border-slate-200  ",
                  "bg-slate-50 px-3  ",
                  disabled ? "text-slate-400 " : "",
                  emphasize
                    ? "font-medium text-xs text-slate-600 "
                    : "font-semibold",
                ].join(" ")}
              >
                {suffix}
              </span>
            </div>
          </FormControl>

          {/* keep FormMessage to align RHF errors if you prefer default rendering */}
          <FormMessage className="hidden" />
        </FormItem>
      )}
    />
  );
}

export function Step2Details({ form, mode }: Step2Props) {
  const listingType = form.watch("listing_type");
  const isReadOnly =
    mode === ("view" as any) ||
    mode === ("readonly" as any) ||
    mode === ("read" as any);

  const showSale = listingType === "SALE" || listingType === "SALE_AND_RENT";
  const showRent = listingType === "RENT" || listingType === "SALE_AND_RENT";

  // State for showing discount fields
  const [showSaleDiscount, setShowSaleDiscount] = React.useState(false);
  const [showRentDiscount, setShowRentDiscount] = React.useState(false);

  // Auto-open discount fields ONLY if there's an actual discount
  const saleOriginal = form.watch("original_price");
  const rentOriginal = form.watch("original_rental_price");
  const salePrice = form.watch("price");
  const rentPrice = form.watch("rental_price");

  React.useEffect(() => {
    // เปิดเฉพาะเมื่อมี original_price และ มากกว่า price (มีส่วนลดจริง)
    if (saleOriginal && salePrice && saleOriginal > salePrice) {
      setShowSaleDiscount(true);
    }
  }, [saleOriginal, salePrice]);

  React.useEffect(() => {
    // เปิดเฉพาะเมื่อมี original_rental_price และ มากกว่า rental_price (มีส่วนลดจริง)
    if (rentOriginal && rentPrice && rentOriginal > rentPrice) {
      setShowRentDiscount(true);
    }
  }, [rentOriginal, rentPrice]);

  // สำหรับสรุปส่วนลด

  const saleDiscount =
    saleOriginal && salePrice && saleOriginal > salePrice
      ? {
          amount: saleOriginal - salePrice,
          percent: Math.round(
            ((saleOriginal - salePrice) / saleOriginal) * 100
          ),
        }
      : null;

  const rentDiscount =
    rentOriginal && rentPrice && rentOriginal > rentPrice
      ? {
          amount: rentOriginal - rentPrice,
          percent: Math.round(
            ((rentOriginal - rentPrice) / rentOriginal) * 100
          ),
        }
      : null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-6 duration-500 grid ">
      {/* ===== PRICE & CONDITIONS ===== */}
      <Card className="border-slate-200/70 bg-white/80 backdrop-blur ">
        <CardHeader className="space-y-4">
          <SectionHeader
            icon={Banknote}
            title="ราคาและเงื่อนไข"
            desc="กรอกให้ครบเพื่อให้ระบบจัดอันดับและแสดงดีลได้แม่นยำ"
            tone="blue"
            right={
              rentDiscount ? (
                <Badge className="gap-2 rounded-full bg-orange-600 text-white hover:bg-orange-600">
                  <TrendingDown className="h-4 w-4" />
                  ลดค่าเช่า {rentDiscount.percent}% (ประหยัด ฿
                  {rentDiscount.amount.toLocaleString("th-TH")}/ด.)
                </Badge>
              ) : saleDiscount ? (
                <Badge className="gap-2 rounded-full bg-rose-600 text-white hover:bg-rose-600">
                  <TrendingDown className="h-4 w-4" />
                  ลดขาย {saleDiscount.percent}% (ประหยัด ฿
                  {saleDiscount.amount.toLocaleString("th-TH")})
                </Badge>
              ) : (
                <Badge variant="secondary" className="rounded-full">
                  <Info className="mr-1 h-3.5 w-3.5" />
                  ใส่ “ราคาเต็ม” เพื่อโชว์ส่วนลด
                </Badge>
              )
            }
          />
          <Separator className="bg-slate-200/70" />
        </CardHeader>

        <CardContent>
          <div className="space-y-8">
            {/* ================= SALE ZONE ================= */}
            {showSale && (
              <div className="space-y-4">
                {showSale && showRent && (
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="h-6 w-1 bg-rose-500 rounded-full" />
                    <h4 className="text-sm font-bold text-slate-800">
                      ข้อมูลการขาย (For Sale)
                    </h4>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-6">
                  {/* Warning: Invalid Discount */}
                  {showSaleDiscount &&
                    saleOriginal &&
                    salePrice &&
                    saleOriginal <= salePrice && (
                      <>
                        <div className="col-span-full rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                          <div className="flex items-start gap-2 text-amber-800">
                            <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-bold">⚠️ ราคาไม่ถูกต้อง</p>
                              <p className="text-xs mt-1">
                                <span className="font-semibold">ราคาเต็ม</span>{" "}
                                ต้อง
                                <span className="font-bold underline">
                                  มากกว่า
                                </span>
                                <span className="font-semibold">
                                  ราคาหลังลด
                                </span>{" "}
                                เพื่อให้เกิดส่วนลด
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                  {/* Step 1: ราคาเดิม (Original) */}
                  <div className="lg:col-span-3">
                    <UnitNumberField
                      label="ราคาตั้งขาย (เต็ม)"
                      name="original_price"
                      control={form.control}
                      placeholder="0"
                      suffix="฿"
                      disabled={isReadOnly}
                      emphasize
                      description="📌 กรอกอันนี้ก่อน - ราคาเดิมที่ยังไม่ลด"
                    />
                  </div>

                  {/* Step 2: Toggle หรือ ราคาลด */}
                  <div className="lg:col-span-3">
                    {!showSaleDiscount ? (
                      <div className="flex items-end h-full pt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowSaleDiscount(true)}
                          disabled={isReadOnly}
                          className="h-11 w-full gap-2 border-dashed border-2 border-blue-300 bg-blue-50/50 hover:bg-blue-100 text-blue-700 font-bold"
                        >
                          <TrendingDown className="h-4 w-4" />
                          มีราคาลด? คลิกเพื่อกรอก
                        </Button>
                      </div>
                    ) : (
                      <UnitNumberField
                        label="ราคาตั้งขาย (หลังลด)"
                        name="price"
                        control={form.control}
                        placeholder="ระบุราคาที่ต้องการขาย"
                        suffix="฿"
                        disabled={isReadOnly}
                        emphasize
                        description="ราคาขายปัจจุบันที่แสดงหน้าเว็บ"
                        labelHint={
                          <button
                            type="button"
                            onClick={() => {
                              setShowSaleDiscount(false);
                              // ลบค่า price ออกจาก database (เซตเป็น null)
                              form.setValue("price", null);
                            }}
                            className="text-[10px] text-slate-400 hover:text-red-600 underline"
                          >
                            ยกเลิก
                          </button>
                        }
                      />
                    )}
                  </div>

                  {/* Maintenance fee */}
                  <div className="lg:col-span-3">
                    <UnitNumberField
                      label="ค่าส่วนกลาง"
                      name="maintenance_fee"
                      control={form.control}
                      placeholder="0"
                      suffix="฿ / ปี"
                      disabled={isReadOnly}
                      description="ช่วยให้ลูกค้าประเมินค่าใช้จ่ายรวมได้ง่ายขึ้น"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Separator if both active */}
            {showSale && showRent && <Separator className="bg-slate-200" />}

            {/* ================= RENT ZONE ================= */}
            {showRent && (
              <div className="space-y-4">
                {showSale && showRent && (
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="h-6 w-1 bg-orange-500 rounded-full" />
                    <h4 className="text-sm font-bold text-slate-800">
                      ข้อมูลการเช่า (For Rent)
                    </h4>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-6">
                  {/* Warning: Invalid Rent Discount */}
                  {showRentDiscount &&
                    rentOriginal &&
                    rentPrice &&
                    rentOriginal <= rentPrice && (
                      <div className="col-span-full rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                        <div className="flex items-start gap-2 text-amber-800">
                          <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-bold">⚠️ ค่าเช่าไม่ถูกต้อง</p>
                            <p className="text-xs mt-1">
                              <span className="font-semibold">ค่าเช่าเต็ม</span>{" "}
                              ต้อง
                              <span className="font-bold underline">
                                มากกว่า
                              </span>
                              <span className="font-semibold">
                                ค่าเช่าหลังลด
                              </span>{" "}
                              เพื่อให้เกิดส่วนลด
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Step 1: ค่าเช่าเดิม (Original) */}
                  <div className="lg:col-span-3">
                    <UnitNumberField
                      label="ค่าเช่าต่อเดือน (เต็ม)"
                      name="original_rental_price"
                      control={form.control}
                      placeholder="ระบุราคาที่ต้องการเช่า"
                      suffix="฿ / ด."
                      disabled={isReadOnly}
                      emphasize
                      description="📌 กรอกอันนี้ก่อน - ค่าเช่าเดิมที่ยังไม่ลด"
                    />
                  </div>

                  {/* Step 2: Toggle หรือ ค่าเช่าลด */}
                  <div className="lg:col-span-3">
                    {!showRentDiscount ? (
                      <div className="flex items-end h-full pt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowRentDiscount(true)}
                          disabled={isReadOnly}
                          className="h-11 w-full gap-2 border-dashed border-2 border-orange-300 bg-orange-50/50 hover:bg-orange-100 text-orange-700 font-bold"
                        >
                          <TrendingDown className="h-4 w-4" />
                          มีค่าเช่าลด? คลิกเพื่อกรอก
                        </Button>
                      </div>
                    ) : (
                      <UnitNumberField
                        label="ค่าเช่าต่อเดือน (หลังลด)"
                        name="rental_price"
                        control={form.control}
                        placeholder="ระบุราคาที่ต้องการเช่า"
                        suffix="฿ / ด."
                        disabled={isReadOnly}
                        emphasize
                        description="ค่าเช่าปัจจุบันที่แสดงหน้าเว็บ"
                        labelHint={
                          <button
                            type="button"
                            onClick={() => {
                              setShowRentDiscount(false);
                              // ลบค่า rental_price ออกจาก database (เซตเป็น undefined)
                              form.setValue("rental_price", null);
                            }}
                            className="text-[10px] text-slate-400 hover:text-red-600 underline"
                          >
                            ยกเลิก
                          </button>
                        }
                      />
                    )}
                  </div>

                  {/* Min Contract - แสดงเฉพาะ RENT / SALE_AND_RENT */}
                  <div className="lg:col-span-3">
                    <UnitNumberField
                      label="สัญญาขั้นต่ำ"
                      name="min_contract_months"
                      control={form.control}
                      placeholder="12"
                      suffix="เดือน"
                      disabled={isReadOnly}
                      description="เช่น 12 เดือน (1 ปี) ช่วยกรองลูกค้าเช่าระยะยาว"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Micro UX: guidance */}
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span className="font-semibold">ทิป:</span> ถ้าทรัพย์ “ลดแรง”
            ให้กรอก ราคาเต็มด้วย ระบบจะดันความเด่นในหน้า Hot Deals/Price Drop
            ได้ดีขึ้น
          </div>
        </CardContent>
      </Card>

      {/* ===== SPECS ===== */}
      <Card className="border-slate-200/70 bg-white">
        <CardHeader className="space-y-4">
          <SectionHeader
            icon={LayoutGrid}
            title="สเปกและสัดส่วน"
            desc="ตัวเลขที่ลูกค้าถามบ่อยที่สุด"
            tone="purple"
          />
          <Separator className="bg-slate-200/70" />
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { name: "bedrooms", label: "ห้องนอน", emoji: "🛏️" },
              { name: "bathrooms", label: "ห้องน้ำ", emoji: "🚿" },
              { name: "parking_slots", label: "ที่จอดรถ", emoji: "🚗" },
              { name: "floor", label: "ชั้นที่", emoji: "🏢" },
            ].map((item) => (
              <FormField
                key={item.name}
                control={form.control}
                name={item.name as any}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-600">
                      {item.emoji} {item.label}
                    </FormLabel>
                    <FormControl>
                      <NumberInput
                        {...field}
                        placeholder="0"
                        disabled={isReadOnly}
                        className={[
                          "h-11 rounded-2xl border-slate-200 bg-white text-center",
                          "font-bold text-slate-900",
                          "focus:border-slate-900 focus:ring-0",
                          isReadOnly ? "bg-slate-50 text-slate-500" : "",
                          fieldState.error ? "border-rose-400" : "",
                        ].join(" ")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===== SIZE & AREA ===== */}
      <Card className="border-slate-200/70 bg-white">
        <CardHeader className="space-y-4">
          <SectionHeader
            icon={Maximize2}
            title="ขนาดและทำเล"
            desc="ช่วยให้ค้นหา/กรองทรัพย์ได้แม่น"
            tone="emerald"
          />
          <Separator className="bg-slate-200/70" />
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <UnitNumberField
              label="พื้นที่ใช้สอย"
              name="size_sqm"
              control={form.control}
              placeholder="0"
              suffix="ตร.ม."
              disabled={isReadOnly}
              emphasize
            />

            <UnitNumberField
              label="ขนาดที่ดิน"
              name="land_size_sqwah"
              control={form.control}
              placeholder="0"
              suffix="ตร.ว."
              disabled={isReadOnly}
              emphasize
            />

            <FormField
              control={form.control}
              name="zoning"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700">
                    ผังสี / Zoning
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isReadOnly}
                      value={field.value ?? ""}
                      placeholder="เช่น สีส้ม ย.5-10"
                      className="h-11 rounded-2xl border-slate-200 bg-white focus:border-slate-900 focus:ring-0"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-slate-500">
                    ใส่ถ้ามี จะช่วยงานประเมิน/ลงทุนและลูกค้าองค์กร
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* ===== DESCRIPTION + SPECIAL ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-slate-200/70 bg-white">
          <CardHeader className="space-y-3">
            <SectionHeader
              icon={FileText}
              title="รายละเอียด"
              desc="เขียนให้ขายง่าย: จุดเด่น, ใกล้อะไร, เฟอร์นิเจอร์, เงื่อนไข"
            />
            <Separator className="bg-slate-200/70" />
          </CardHeader>

          <CardContent>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={isReadOnly}
                      rows={7}
                      className="resize-none rounded-2xl border-slate-200 bg-slate-50/40 p-4 leading-relaxed transition focus:bg-white focus:border-slate-900 focus:ring-0"
                      placeholder={`ตัวอย่าง:\n• จุดเด่น: รีโนเวทใหม่ / วิวโล่ง / ใกล้ BTS\n• เฟอร์นิเจอร์/เครื่องใช้ไฟฟ้า: ...\n• เงื่อนไข: ...`}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-slate-500">
                    แนะนำใส่ “สิ่งที่ทำให้ต่างจากทรัพย์อื่น” 3–5 ข้อ
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 bg-white">
          <CardHeader className="space-y-3">
            <SectionHeader
              icon={PawPrint}
              title="คุณสมบัติพิเศษ"
              desc="ช่วยกรองลูกค้าได้เร็ว"
              right={
                <Badge variant="secondary" className="rounded-full">
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  Highlight
                </Badge>
              }
            />
            <Separator className="bg-slate-200/70" />
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Verified Toggle */}
            <FormField
              control={form.control}
              name="verified"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 transition hover:bg-blue-50/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <FormLabel className="text-sm font-bold text-blue-900 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Verified Listing
                      </FormLabel>
                      <p className="text-xs text-blue-800/70">
                        เปิดเมื่อตรวจสอบเอกสารสิทธิ์/ทรัพย์จริงแล้ว
                        (เพิ่มความน่าเชื่อถือ)
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isReadOnly}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            {/* Pet Friendly Toggle */}
            <FormField
              control={form.control}
              name="is_pet_friendly"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 transition hover:bg-orange-50/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <FormLabel className="text-sm font-bold text-orange-900">
                        🐶 Pet Friendly
                      </FormLabel>
                      <p className="text-xs text-orange-800/70">
                        เปิดไว้เมื่อโครงการ/เจ้าของอนุญาตเลี้ยงสัตว์
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isReadOnly}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>

      {/* ===== COMMISSION (INTERNAL) ===== */}
      <Card className="border-blue-200/60 bg-gradient-to-b from-blue-50/70 to-white">
        <CardHeader className="space-y-4">
          <SectionHeader
            icon={Percent}
            title="คอมมิชชั่น (Internal Only)"
            desc="ข้อมูลหลังบ้าน ใช้คำนวณผลตอบแทน/ปิดดีล"
            tone="blue"
            right={
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-[10px] font-bold text-blue-600 shadow-sm">
                <Lock className="h-3.5 w-3.5" />
                STAFF ONLY
              </span>
            }
          />
          <Separator className="bg-blue-200/60" />
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Commission Sale */}
          {showSale && (
            <FormField
              control={form.control}
              name="commission_sale_percentage"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-sm font-semibold text-blue-800">
                    คอมมิชชั่นขาย (%)
                  </FormLabel>

                  <FormControl>
                    <div className="flex items-center">
                      <NumberInput
                        {...field}
                        value={field.value ?? undefined} // ✅ กัน null
                        onChange={(v) => field.onChange(v)} // ✅ ให้ NumberInput ส่ง number|undefined
                        decimals={2}
                        placeholder="3"
                        disabled={isReadOnly}
                        className="h-11 w-full rounded-l-xl rounded-r-none border-r-0 border-blue-200 bg-white font-bold focus:border-slate-900 focus:ring-0"
                      />
                      <span className="h-11 rounded-r-xl border border-l-0 border-blue-200 bg-blue-100 px-3 text-sm font-bold text-blue-700">
                        %
                      </span>
                    </div>
                  </FormControl>

                  <div className="grid grid-cols-3 gap-2">
                    {[3, 4, 5].map((val) => {
                      const active = Number(field.value) === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => field.onChange(val)}
                          className={[
                            "h-10 rounded-xl border text-xs font-bold transition",
                            active
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-blue-100 bg-white text-blue-600 hover:bg-blue-50",
                            isReadOnly ? "opacity-60" : "",
                          ].join(" ")}
                        >
                          {val}%
                        </button>
                      );
                    })}
                  </div>

                  <FormDescription className="text-xs text-blue-700/70">
                    เลือก preset เพื่อกรอกเร็ว ลดการพิมพ์
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Commission Rent */}
          {showRent && (
            <FormField
              control={form.control}
              name="commission_rent_months"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-sm font-semibold text-blue-800">
                    คอมมิชชั่นเช่า (เดือน)
                  </FormLabel>

                  <FormControl>
                    <div className="flex items-center">
                      <NumberInput
                        {...field}
                        value={field.value ?? undefined} // ✅ กัน null
                        onChange={(v) => field.onChange(v)} // ✅ ให้ NumberInput ส่ง number|undefined
                        decimals={1}
                        placeholder="1"
                        disabled={isReadOnly}
                        className="h-11 w-full rounded-l-xl rounded-r-none border-r-0 border-blue-200 bg-white font-bold focus:border-slate-900 focus:ring-0"
                      />
                      <span className="h-11 rounded-r-xl border border-l-0 border-blue-200 bg-blue-100 px-3 text-sm font-bold text-blue-700">
                        ด.
                      </span>
                    </div>
                  </FormControl>

                  <div className="grid grid-cols-3 gap-2">
                    {[0.5, 1, 1.5].map((val) => {
                      const active = Number(field.value) === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => field.onChange(val)}
                          className={[
                            "h-10 rounded-xl border text-xs font-bold transition",
                            active
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-blue-100 bg-white text-blue-600 hover:bg-blue-50",
                            isReadOnly ? "opacity-60" : "",
                          ].join(" ")}
                        >
                          {val} เดือน
                        </button>
                      );
                    })}
                  </div>

                  <FormDescription className="text-xs text-blue-700/70">
                    ค่านิยมทั่วไป: 1 เดือน (ขึ้นกับตลาด/ทำเล)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
