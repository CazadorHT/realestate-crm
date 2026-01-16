"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Home, Key, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDepositLeadAction } from "@/features/public/actions";
import { depositLeadSchema } from "@/features/public/schema";
import { DepositLeadInput } from "@/features/public/types";
import { SectionBackground } from "./SectionBackground";

export function DepositPropertySection() {
  const [isSuccess, setIsSuccess] = useState(false);

  // Schema.org Service for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "ฝากขาย ฝากเช่า บ้าน คอนโด สำนักงานออฟฟิศ",
    description:
      "บริการฝากขาย ฝากเช่า บ้าน คอนโด สำนักงานออฟฟิศ ฟรี ไม่มีค่าใช้จ่ายเบื้องต้น มีทีมการตลาดพร้อมดูแล",
    provider: {
      "@type": "RealEstateAgent",
      name: "Your Real Estate Company",
    },
    areaServed: "Thailand",
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: "https://your-domain.com/#deposit-section",
    },
  };

  return (
    <section
      id="deposit-section"
      className="py-12 md:py-16 lg:py-24 px-4 md:px-6 lg:px-8 bg-white relative overflow-hidden z-0"
    >
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Background Decor */}
      <SectionBackground pattern="blobs" intensity="medium" />

      <div className="max-w-screen-xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12 items-center">
          {/* Left Content */}
          <div
            className="space-y-4 md:space-y-6 text-center lg:text-left"
            data-aos="fade-right"
          >
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-bold text-blue-700 backdrop-blur-sm mx-auto lg:mx-0 shadow-sm">
              <Key className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
              บริการฝากทรัพย์สิน
            </div>

            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold tracking-tight leading-tight">
              <span className="text-slate-900">ฝากขาย ฝากเช่า</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                บ้าน คอนโด ออฟฟิศ
              </span>
            </h2>

            <p className="text-base md:text-lg lg:text-xl text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-900">
                ฟรี! ไม่มีค่าใช้จ่ายเบื้องต้น
              </span>
              <br />
              เรามีฐานลูกค้าและทีมการตลาดพร้อมดูแลให้ทรัพย์ของคุณปล่อยออกได้เร็วที่สุด
            </p>

            <div className="pt-3 md:pt-4 space-y-3 md:space-y-4">
              {[
                { step: 1, text: "กรอกข้อมูลทรัพย์เบื้องต้น" },
                { step: 2, text: "เจ้าหน้าที่ติดต่อกลับเพื่อยืนยัน" },
                { step: 3, text: "ทำการตลาดหาลูกค้าให้ทันที" },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-center gap-2 md:gap-3 justify-center lg:justify-start group"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm md:text-base font-bold shadow-md group-hover:scale-110 transition-transform">
                    {item.step}
                  </div>
                  <span className="text-sm md:text-base text-slate-700 font-medium">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 md:gap-4 justify-center lg:justify-start pt-3 md:pt-4">
              <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-slate-50 rounded-lg md:rounded-xl border border-slate-200">
                <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600" />
                <span className="text-xs md:text-sm font-medium text-slate-700">
                  ฟรี ไม่มีค่าใช้จ่าย
                </span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-slate-50 rounded-lg md:rounded-xl border border-slate-200">
                <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600" />
                <span className="text-xs md:text-sm font-medium text-slate-700">
                  ทีมมืออาชีพ
                </span>
              </div>
            </div>
          </div>

          {/* Right Form Card */}
          <div
            className="bg-white rounded-xl md:rounded-2xl p-5 md:p-6 lg:p-8 shadow-xl md:shadow-2xl border border-slate-200 relative overflow-hidden"
            data-aos="fade-left"
          >
            {/* Card gradient decoration */}
            <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50 -z-10"></div>

            <div className="mb-4 md:mb-6 relative z-10">
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-1.5 md:mb-2">
                ฝากข้อมูลทรัพย์สิน
              </h3>
              <p className="text-slate-500 text-xs md:text-sm">
                กรอกข้อมูลให้ครบถ้วน เจ้าหน้าที่จะติดต่อกลับโดยเร็ว
              </p>
            </div>

            {isSuccess ? (
              <div className="text-center py-12 space-y-4 animate-in fade-in zoom-in">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Home className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                  ขอบคุณสำหรับข้อมูล
                </h3>
                <p className="text-slate-600">
                  ทางทีมงานได้รับข้อมูลทรัพย์ของท่านแล้ว <br />
                  <span className="font-semibold text-slate-900">
                    เจ้าหน้าที่จะรีบติดต่อกลับไปครับ
                  </span>
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsSuccess(false)}
                  className="mt-4 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  ส่งข้อมูลเพิ่มเติม
                </Button>
              </div>
            ) : (
              <DepositForm onSuccess={() => setIsSuccess(true)} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function DepositForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<DepositLeadInput>({
    resolver: zodResolver(depositLeadSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      lineId: "",
      details: "",
      propertyType: undefined,
    },
  });

  async function onSubmit(values: DepositLeadInput) {
    setIsLoading(true);
    try {
      const res = await createDepositLeadAction(values);
      if (res.success) {
        toast.success(
          "บันทึกข้อมูลเรียบร้อย เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด"
        );
        form.reset();
        onSuccess();
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-semibold">
                ชื่อ-นามสกุล/ชื่อเล่น <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="เช่น คุณสมชาย (เจ้าของ)"
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-semibold">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="08x-xxx-xxxx"
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lineId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-semibold">
                  Line ID (ถ้ามี)
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="ID ของคุณ"
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="propertyType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-semibold">
                ประเภททรัพย์ <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="เลือกประเภททรัพย์สิน" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CONDO">🏢 คอนโด</SelectItem>
                  <SelectItem value="HOUSE">🏠 บ้านเดี่ยว</SelectItem>
                  <SelectItem value="TOWNHOME">🏘️ ทาวน์โฮม</SelectItem>
                  <SelectItem value="LAND">🌳 ที่ดิน</SelectItem>
                  <SelectItem value="COMMERCIAL">
                    🏢 อาคารพาณิชย์/สำนักงาน
                  </SelectItem>
                  <SelectItem value="FACTORY">🏭 โรงงาน/โกดัง</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-semibold">
                ทำเล / ชื่อโครงการ / รายละเอียดเพิ่มเติม
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="เช่น ต้องการฝากขายคอนโด Rhythm รัชดา 1 ห้องนอน ติด BTS รัชดา..."
                  className="resize-none h-24 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-5 md:py-6 text-base md:text-lg shadow-lg hover:shadow-xl transition-all"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Send className="mr-2 h-5 w-5" />
            )}
            ส่งข้อมูลฝากทรัพย์
          </Button>
        </div>
      </form>
    </Form>
  );
}
