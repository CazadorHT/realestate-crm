"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Home, Key, Send } from "lucide-react";
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

export function DepositPropertySection() {
  const [isSuccess, setIsSuccess] = useState(false);
  // ... rest of component

  return (
    <section
      id="deposit-section"
      className="py-24 bg-slate-900 relative overflow-hidden"
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="container px-4 mx-auto relative z-10 text-white">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-300 backdrop-blur-sm mx-auto lg:mx-0">
              <Key className="mr-2 h-4 w-4" />
              สำหรับเจ้าของทรัพย์ (Owners)
            </div>

            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              มีทรัพย์ว่าง อยากปล่อยเช่า หรือขาย?
            </h2>
            <p className="text-xl text-slate-300">
              ฝากทรัพย์กับเราวันนี้ ฟรี! ไม่มีค่าใช้จ่ายเบื้องต้น
              เรามีฐานลูกค้าและทีมการตลาดพร้อมดูแลให้ทรัพย์ของคุณปล่อยออกได้เร็วที่สุด
            </p>
            <div className="pt-4 flex flex-col gap-4 text-slate-300/80">
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                  1
                </div>
                <span>กรอกข้อมูลทรัพย์เบื้องต้น</span>
              </div>
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                  2
                </div>
                <span>เจ้าหน้าที่ติดต่อกลับเพื่อยืนยัน</span>
              </div>
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                  3
                </div>
                <span>ทำการตลาดหาลูกค้าให้ทันที</span>
              </div>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl text-slate-900">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900">
                ฝากข้อมูลทรัพย์สิน
              </h3>
              <p className="text-slate-500 text-sm">
                กรอกข้อมูลให้ครบถ้วน เจ้าหน้าที่จะติดต่อกลับโดยเร็ว
              </p>
            </div>

            {isSuccess ? (
              <div className="text-center py-12 space-y-4 animate-in fade-in zoom-in">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Home className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-green-700">
                  ขอบคุณสำหรับข้อมูล
                </h3>
                <p className="text-slate-600">
                  ทางทีมงานได้รับข้อมูลทรัพย์ของท่านแล้ว <br />
                  เจ้าหน้าที่จะรีบติดต่อกลับไปครับ
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsSuccess(false)}
                  className="mt-4"
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
              <FormLabel>
                ชื่อ-นามสกุล/ชื่อเล่น <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="เช่น คุณสมชาย (เจ้าของ)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="08x-xxx-xxxx" {...field} />
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
                <FormLabel>Line ID (ถ้ามี)</FormLabel>
                <FormControl>
                  <Input placeholder="" {...field} />
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
              <FormLabel>
                ประเภททรัพย์ <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CONDO">คอนโด (Condo)</SelectItem>
                  <SelectItem value="HOUSE">บ้านเดี่ยว (House)</SelectItem>
                  <SelectItem value="TOWNHOME">ทาวน์โฮม (Townhome)</SelectItem>
                  <SelectItem value="LAND">ที่ดิน (Land)</SelectItem>
                  <SelectItem value="COMMERCIAL">อาคารพาณิชย์</SelectItem>
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
              <FormLabel>ทำเล / ชื่อโครงการ / รายละเอียดเพิ่มเติม</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="เช่น ต้องการขายคอนโด Rhythm รัชดา 1 ห้องนอน.."
                  className="resize-none h-24"
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
            className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
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
