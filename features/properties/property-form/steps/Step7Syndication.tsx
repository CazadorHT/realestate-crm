"use client";
import * as React from "react";
import { useFormContext } from "react-hook-form";
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
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { toast } from "sonner";

interface Step7SyndicationProps {
  mode: "create" | "edit";
}

export function Step7Syndication({ mode }: Step7SyndicationProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const form = useFormContext<PropertyFormValues>();
  const propertyId = form.getValues().id || "new";

  const listingType = form.watch("listing_type");
  const salePrice = form.watch("original_price") || form.watch("price");
  const rentPrice = form.watch("original_rental_price") || form.watch("rental_price");
  const isDual = listingType === "SALE_AND_RENT" || (Boolean(salePrice && salePrice > 0) && Boolean(rentPrice && rentPrice > 0));

  const platforms = [
    {
      id: "facebook",
      name: "Facebook Marketplace",
      description: isEn
        ? "Syndicate listings to Facebook Marketplace and your Page Catalog"
        : "ส่งข้อมูลไปยัง Facebook Marketplace และ Catalog ของเพจ",
      icon: Facebook,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      setupUrl: "https://business.facebook.com/commerce",
    },
    {
      id: "instagram",
      name: "Instagram Feed",
      description: isEn
        ? "Prepare listing data for Instagram Business Profile posts"
        : "เตรียมข้อมูลสำหรับโพสต์ไปยัง Instagram Business Profile",
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
            {isEn ? "Social Media Listing (Facebook & Instagram)" : "Social Media Listing (Facebook & Instagram)"}
          </h3>
          <p className="text-sm text-blue-700/80 leading-relaxed">
            {isEn
              ? "Manage property syndication to Facebook Marketplace and Instagram. The system creates a Real Estate Catalog Feed for automated Meta sync."
              : "คุณสามารถจัดการการส่งข้อมูลทรัพย์ไปยัง Facebook Marketplace และ Instagram ได้จากที่นี่ ระบบจะสร้าง Real Estate Catalog Feed เพื่อให้ Meta ดึงข้อมูลไปแสดงผลอัตโนมัติครับ"}
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
                        ? (isEn ? "Save before enabling" : "บันทึกก่อนเปิดใช้งาน")
                        : (isEn ? "Enable Feed" : "เปิดใช้งาน Feed")}
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
                    <span>{isEn ? "Ready to sync via Meta Catalog" : "พร้อมเชื่อมข้อมูลผ่าน Meta Catalog"}</span>
                  </div>
                  <a
                    href={platform.setupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 font-bold hover:underline"
                  >
                    {isEn ? "Setup in Meta Commerce" : "ตั้งค่าใน Meta Commerce"}{" "}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Target Listing Type for Meta Catalog (ป้องกันสินค้าซ้ำ และจัดสรรงบยิงแอด) */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-base">
                {isEn ? "Target Listing Type for Meta Catalog" : "เลือกประเภทประกาศที่ส่งเข้า Meta Catalog"}
              </h4>
              {isDual && (
                <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 font-semibold px-2 py-0.5 rounded-full">
                  {isEn ? "Dual Listing (Sale & Rent)" : "ทรัพย์มีทั้งขายและเช่า"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isEn
                ? "Choose whether to syndicate both, or send only Sale or Rent. The system maintains stable IDs (e.g. ID-sale / ID-rent) to prevent duplicate items."
                : "เลือกว่าจะส่งทั้ง 2 รายการ หรือส่งเฉพาะขาย หรือเฉพาะเช่า ระบบใช้ Unique Key แยก ID ชัดเจนเพื่อป้องกันการส่งสินค้าซ้ำเข้า Facebook Catalog"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {[
            {
              id: "ALL",
              title: isEn ? "Both (Sale & Rent)" : "ทั้งขายและเช่า (ส่ง 2 รายการ)",
              desc: isEn
                ? "Syndicates both IDs (id-sale & id-rent) to Meta Catalog"
                : "ส่งทั้งประกาศขายและเช่าเข้า Catalog โดยแยก ID ไม่ทับกัน",
              badgeColor: "bg-slate-100 text-slate-700",
            },
            {
              id: "SALE",
              title: isEn ? "Sale Only" : "เฉพาะขาย (Sale Only)",
              desc: isEn
                ? "Syndicates only sale price (id-sale). Optimizes ad spend."
                : "ส่งเฉพาะราคาขาย เหมาะกับการยิงโฆษณา ไม่เปลืองงบกับทรัพย์เช่า",
              badgeColor: "bg-blue-100 text-blue-700",
            },
            {
              id: "RENT",
              title: isEn ? "Rent Only" : "เฉพาะเช่า (Rent Only)",
              desc: isEn
                ? "Syndicates only rental price (id-rent)."
                : "ส่งเฉพาะราคาค่าเช่า สำหรับเจาะกลุ่มผู้เช่าโดยตรง",
              badgeColor: "bg-emerald-100 text-emerald-700",
            },
          ].map((item) => {
            const isSelected = (form.watch("catalog_target_listing_type") || "ALL") === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  form.setValue("catalog_target_listing_type", item.id as any, { shouldDirty: true });
                  toast.success(
                    isEn
                      ? `Catalog mode set to: ${item.title}`
                      : `ตั้งค่าประเภทใน Catalog เป็น: ${item.title}`
                  );
                }}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2",
                  isSelected
                    ? "border-blue-600 bg-blue-50/60 shadow-xs ring-1 ring-blue-600"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{item.title}</span>
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center",
                      isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"
                    )}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
        <h5 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-slate-400" />
          <span>{isEn ? "Catalog Feed URL for Meta" : "Catalog Feed URL สำหรับ Meta"}</span>
        </h5>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-white p-3 rounded-xl border border-slate-200 text-xs text-blue-600 font-mono break-all line-clamp-1">
            {`${typeof window !== "undefined" ? window.location.origin : ""}/api/syndication/feed/meta`}
          </code>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl cursor-pointer"
            onClick={() => {
              const url = `${window.location.origin}/api/syndication/feed/meta`;
              navigator.clipboard.writeText(url);
              toast.success(isEn ? "Feed URL copied to clipboard!" : "คัดลอก Link เรียบร้อย");
            }}
          >
            {isEn ? "Copy" : "คัดลอก"}
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-500 leading-relaxed">
          {isEn
            ? "💡 Paste this link into Meta Commerce Manager > Data Sources to automatically syndicate listings to Facebook & Instagram Marketplace."
            : "💡 นำ Link นี้ไปใส่ใน Meta Commerce Manager > Data Sources เพื่อให้ Facebook และ Instagram ดึงข้อมูลทรัพย์ไปลง Marketplace อัตโนมัติครับ"}
        </p>
      </div>

      {mode === "create" && (
        <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <p className="text-slate-500 text-sm">
            {isEn
              ? "💡 Syndication features will be available after saving the listing."
              : "💡 คุณจะสามารถจัดการการส่งข้อมูล (Syndication) ได้หลังจากบันทึกข้อมูลทรัพย์เรียบร้อยแล้วครับ"}
          </p>
        </div>
      )}
    </div>
  );
}
