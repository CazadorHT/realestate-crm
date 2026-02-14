"use client";
import * as React from "react";
import { UseFormReturn } from "react-hook-form";
import { type PropertyFormValues } from "@/features/properties/schema";
import {
  Facebook,
  Instagram,
  Globe,
  ExternalLink,
  Share2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Step7SyndicationProps {
  form: UseFormReturn<PropertyFormValues>;
  mode: "create" | "edit";
}

export function Step7Syndication({ form, mode }: Step7SyndicationProps) {
  const propertyId = form.getValues().id || "new";

  const platforms = [
    {
      id: "facebook",
      name: "Facebook Marketplace",
      description: "ส่งข้อมูลไปยัง Facebook Marketplace และ Catalog ของเพจ",
      icon: Facebook,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      setupUrl: "https://business.facebook.com/commerce",
    },
    {
      id: "instagram",
      name: "Instagram Feed",
      description: "เตรียมข้อมูลสำหรับโพสต์ไปยัง Instagram Business Profile",
      icon: Instagram,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      setupUrl: "https://business.facebook.com/commerce",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-start gap-4 shadow-xs">
        <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600 shrink-0">
          <Share2 className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-blue-800">
            Social Media Listing (Facebook & Instagram)
          </h3>
          <p className="text-sm text-blue-700/80 leading-relaxed">
            คุณสามารถจัดการการส่งข้อมูลทรัพย์ไปยัง Facebook Marketplace และ
            Instagram ได้จากที่นี่ ระบบจะสร้าง **Real Estate Catalog Feed**
            เพื่อให้ Meta ดึงข้อมูลไปแสดงผลอัตโนมัติครับ
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <div
              key={platform.id}
              className="group bg-white border border-slate-200 p-6 rounded-2xl hover:border-blue-200 transition-all shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center border border-slate-100 shadow-xs shrink-0",
                      platform.bgColor,
                      platform.color,
                    )}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-lg">
                      {platform.name}
                    </h4>
                    <p className="text-sm text-slate-500 max-w-md">
                      {platform.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="flex flex-col items-end gap-1">
                    <Label
                      htmlFor={`sync-${platform.id}`}
                      className="text-xs font-bold text-slate-400 uppercase tracking-wider"
                    >
                      {mode === "create"
                        ? "บันทึกก่อนเปิดใช้งาน"
                        : "เปิดใช้งาน Feed"}
                    </Label>
                    <Switch
                      id={`sync-${platform.id}`}
                      className="data-[state=checked]:bg-blue-600"
                      disabled={mode === "create"}
                      defaultChecked={mode === "edit"}
                    />
                  </div>
                </div>
              </div>

              {mode === "edit" && (
                <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <Info className="h-4 w-4 text-blue-500" />
                    <span>พร้อมเชื่อมข้อมูลผ่าน Meta Catalog</span>
                  </div>
                  <a
                    href={platform.setupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 font-bold hover:underline"
                  >
                    ตั้งค่าใน Meta Commerce{" "}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
        <h5 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-slate-400" />
          Catalog Feed URL สำหรับ Meta
        </h5>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-white p-3 rounded-xl border border-slate-200 text-xs text-blue-600 font-mono break-all line-clamp-1">
            {`${typeof window !== "undefined" ? window.location.origin : ""}/api/syndication/feed/meta`}
          </code>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl"
            onClick={() => {
              const url = `${window.location.origin}/api/syndication/feed/meta`;
              navigator.clipboard.writeText(url);
              alert("คัดลอก Link เรียบร้อย");
            }}
          >
            คัดลอก
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-500 leading-relaxed">
          💡 นำ Link นี้ไปใส่ใน **Meta Commerce Manager &gt; Data Sources**
          เพื่อให้ Facebook และ Instagram ดึงข้อมูลทรัพย์ไปลง Marketplace
          อัตโนมัติครับ
        </p>
      </div>

      {mode === "create" && (
        <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <p className="text-slate-500 text-sm">
            💡 คุณจะสามารถจัดการการส่งข้อมูล (Syndication)
            ได้หลังจากบันทึกข้อมูลทรัพย์เรียบร้อยแล้วครับ
          </p>
        </div>
      )}
    </div>
  );
}

// Simple fallback Button if not imported
function Button({ children, variant, size, className, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-all text-sm",
        variant === "outline"
          ? "border border-slate-200 hover:bg-slate-50"
          : "bg-blue-600 text-white hover:bg-blue-700",
        className,
      )}
    >
      {children}
    </button>
  );
}
