"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, CheckCircle2 } from "lucide-react";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSuccess(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSuccess(false);
      (e.target as HTMLFormElement).reset();
    }, 3000);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          ส่งข้อความสำเร็จ!
        </h3>
        <p className="text-slate-600">
          ขอบคุณที่ติดต่อเรา ทีมงานจะตอบกลับภายใน 24 ชั่วโมง
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="name">
            ชื่อ-นามสกุล <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="กรอกชื่อของคุณ"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">
            เบอร์โทรศัพท์ <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="0XX-XXX-XXXX"
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          อีเมล <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="your@email.com"
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">หัวข้อที่สนใจ</Label>
        <Select name="subject">
          <SelectTrigger className="h-11">
            <SelectValue placeholder="เลือกหัวข้อ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="buy">ซื้อบ้าน/คอนโด</SelectItem>
            <SelectItem value="sell">ขายบ้าน/คอนโด</SelectItem>
            <SelectItem value="rent">เช่า</SelectItem>
            <SelectItem value="invest">ลงทุน</SelectItem>
            <SelectItem value="other">อื่นๆ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">
          ข้อความ <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="message"
          name="message"
          required
          placeholder="กรุณาระบุรายละเอียดที่ต้องการปรึกษา..."
          rows={5}
          className="resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 text-base"
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            กำลังส่ง...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            ส่งข้อความ
          </>
        )}
      </Button>

      <p className="text-xs text-slate-500 text-center">
        โดยการส่งแบบฟอร์มนี้ คุณยอมรับ{" "}
        <a href="/privacy" className="text-blue-600 hover:underline">
          นโยบายความเป็นส่วนตัว
        </a>{" "}
        ของเรา
      </p>
    </form>
  );
}
