"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  upsertMasterDataAction,
  generateAIStationDataAction
} from "@/features/properties/actions/fetch-master-data";
import { LOGO_PATHS } from "@/components/public/near-station/helpers/station-selector-helpers";

interface StationItem {
  id?: string;
  type: string;
  code: string;
  label: { th: string; en: string; cn?: string; ru?: string };
  metadata?: {
    transit_type?: string;
    line_name?: string;
    line_color?: string;
    slug?: string;
    seo_title?: string;
    seo_description?: string;
    description?: { th?: string; en?: string; cn?: string; ru?: string };
    latitude?: number;
    longitude?: number;
    google_maps_link?: string;
    [key: string]: any;
  };
  sort_order: number;
  is_active: boolean;
}

interface StationEditDialogProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  station: StationItem | null;
  onSaveSuccess: () => void;
}

function parseCoordinatesFromGoogleMaps(url: string): { lat: number; lng: number } | null {
  if (!url) return null;
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }
  const qMatch = url.match(/[?&](?:q|query)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  }
  const pathMatch = url.match(/\/(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (pathMatch) {
    return { lat: parseFloat(pathMatch[1]), lng: parseFloat(pathMatch[2]) };
  }
  return null;
}

export function StationEditDialog({
  isOpen,
  onClose,
  station,
  onSaveSuccess,
}: StationEditDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [isAiGenerating, setIsAiGenerating] = React.useState(false);
  const [isFormDirty, setIsFormDirty] = React.useState(false);

  // Form states
  const [formSlug, setFormSlug] = React.useState("");
  const [formGoogleMapsLink, setFormGoogleMapsLink] = React.useState("");
  const [formSeoTitle, setFormSeoTitle] = React.useState("");
  const [formSeoDesc, setFormSeoDesc] = React.useState("");
  const [formDescTh, setFormDescTh] = React.useState("");
  const [formDescEn, setFormDescEn] = React.useState("");
  const [formDescCn, setFormDescCn] = React.useState("");
  const [formDescRu, setFormDescRu] = React.useState("");
  const [formLat, setFormLat] = React.useState("");
  const [formLng, setFormLng] = React.useState("");

  // Sync form states when station changes
  React.useEffect(() => {
    if (isOpen && station) {
      const meta = station.metadata || {};
      setFormSlug(meta.slug || station.code.toLowerCase().replace(/_/g, "-"));
      setFormGoogleMapsLink(meta.google_maps_link || "");
      setFormSeoTitle(meta.seo_title || "");
      setFormSeoDesc(meta.seo_description || "");
      setFormDescTh(meta.description?.th || "");
      setFormDescEn(meta.description?.en || "");
      setFormDescCn(meta.description?.cn || "");
      setFormDescRu(meta.description?.ru || "");
      setFormLat(meta.latitude?.toString() || "");
      setFormLng(meta.longitude?.toString() || "");
      setIsFormDirty(false);
    }
  }, [isOpen, station]);

  const handleGoogleMapsLinkChange = (url: string) => {
    setFormGoogleMapsLink(url);
    setIsFormDirty(true);
    const coords = parseCoordinatesFromGoogleMaps(url);
    if (coords) {
      setFormLat(coords.lat.toString());
      setFormLng(coords.lng.toString());
      toast.success(`ถอดรหัสพิกัดสำเร็จ: ${coords.lat}, ${coords.lng} 📍`);
    }
  };

  const handleAiGenerate = async () => {
    if (!station) return;
    setIsAiGenerating(true);
    const toastId = toast.loading("🤖 Gemini กำลังสร้างข้อมูลและคำอธิบายทำเลแบบเจาะลึก 4 ภาษา...");
    try {
      const res = await generateAIStationDataAction(
        station.label.th,
        station.label.en,
        station.metadata?.transit_type || "BTS"
      );

      if (res.success && res.data) {
        const d = res.data;
        if (d.seoTitle) setFormSeoTitle(d.seoTitle);
        if (d.seoDescription) setFormSeoDesc(d.seoDescription);
        if (d.descriptionTh) setFormDescTh(d.descriptionTh);
        if (d.descriptionEn) setFormDescEn(d.descriptionEn);
        if (d.descriptionCn) setFormDescCn(d.descriptionCn);
        if (d.descriptionRu) setFormDescRu(d.descriptionRu);
        setIsFormDirty(true);
        toast.success("AI เจนคำอธิบายทำเลสำเร็จ! ✨", { id: toastId });
      } else {
        throw new Error(res.message || "ล้มเหลวในการเจนข้อมูล");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("AI เกิดความผิดพลาด: " + (err.message || ""), { id: toastId });
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!station) return;

    if (!formSlug.trim()) {
      toast.error("กรุณาระบุ URL Slug");
      return;
    }

    setIsSaving(true);
    try {
      const existingMeta = station.metadata || {};
      const updatedMetadata = {
        ...existingMeta,
        slug: formSlug.trim().toLowerCase(),
        google_maps_link: formGoogleMapsLink.trim(),
        seo_title: formSeoTitle.trim(),
        seo_description: formSeoDesc.trim(),
        description: {
          th: formDescTh.trim() || undefined,
          en: formDescEn.trim() || undefined,
          cn: formDescCn.trim() || undefined,
          ru: formDescRu.trim() || undefined,
        },
        latitude: formLat.trim() ? Number(formLat) : undefined,
        longitude: formLng.trim() ? Number(formLng) : undefined,
      };

      const res = await upsertMasterDataAction({
        type: "TRANSIT_STATION",
        code: station.code,
        label: station.label as any,
        metadata: updatedMetadata,
        sort_order: station.sort_order,
        is_active: station.is_active,
      });

      if (res.success) {
        toast.success("บันทึกข้อมูล SEO สถานีสำเร็จ ✨");
        setIsFormDirty(false);
        onSaveSuccess();
        onClose(false);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  if (!station) return null;

  const transitType = station.metadata?.transit_type || "BTS";
  const logoPath = LOGO_PATHS[transitType];

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={(open) => {
        onClose(open);
      }}
      confirmOnClose={isFormDirty}
      title={
        <div className="flex items-center gap-2.5 text-slate-900">
          {logoPath ? (
            <img src={logoPath} alt={transitType} className="h-6 w-auto object-contain shrink-0" />
          ) : (
            <span 
              className="w-4 h-4 rounded-full shrink-0" 
              style={{ backgroundColor: station.metadata?.line_color || "#3b82f6" }}
            />
          )}
          <span>ตั้งค่า SEO หน้าสถานี: {station.label.th} ({station.code})</span>
        </div>
      }
      description={`จัดการ URL Slug, Google Maps Link, Meta Tags และ คำอธิบายทำเลบนหน้า Landing Page ของสถานี ${station.label.th}`}
      className="sm:max-w-2xl"
      footer={
        <div className="flex justify-between items-center gap-3 w-full px-6 sm:px-0">
          <Button
            type="button"
            variant="outline"
            disabled={isAiGenerating || isSaving}
            onClick={handleAiGenerate}
            className="h-10.5 rounded-xl border-indigo-200 bg-indigo-50/50 text-indigo-700 font-bold hover:bg-indigo-50 hover:text-indigo-800 transition-all duration-200 cursor-pointer flex items-center gap-1.5"
          >
            {isAiGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin text-indigo-650" />
            ) : (
              <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
            )}
            <span>AI ช่วยเจนข้อมูล</span>
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose(false)}
              disabled={isSaving}
              className="h-10.5 rounded-xl border-slate-200 text-slate-650 cursor-pointer"
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving || isAiGenerating}
              className="h-10.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/20 cursor-pointer flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  บันทึกการตั้งค่า
                </>
              )}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-5 p-6 max-h-[60vh] overflow-y-auto">
        <div className="space-y-2">
          <Label htmlFor="slug" className="text-sm font-bold text-slate-700">URL Slug (ต่อจาก /near-station/)</Label>
          <Input
            id="slug"
            value={formSlug}
            onChange={(e) => { setFormSlug(e.target.value); setIsFormDirty(true); }}
            placeholder="เช่น bts-asok"
            className="h-10.5 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
          />
          <p className="text-xs text-slate-400 font-medium">เฉพาะภาษาอังกฤษ ตัวเลข และเครื่องหมายลบ (-) เท่านั้น</p>
        </div>

        {/* Google Maps URL Link (Main Coord control) */}
        <div className="space-y-2">
          <Label htmlFor="maps_link" className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-rose-500" />
            <span>Google Maps Link (สำหรับถอดพิกัดอัตโนมัติ)</span>
          </Label>
          <Input
            id="maps_link"
            value={formGoogleMapsLink}
            onChange={(e) => handleGoogleMapsLinkChange(e.target.value)}
            placeholder="เช่น https://maps.app.goo.gl/..."
            className="h-10.5 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
          />
        </div>

        {/* Read-only coordinates (lat / lng) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude" className="text-xs font-semibold text-slate-500">พิกัด Latitude (ถอดจากลิงก์แผนที่)</Label>
            <Input
              id="latitude"
              value={formLat}
              readOnly
              placeholder="-"
              className="h-10.5 rounded-xl bg-slate-50 border-slate-200 text-slate-500 font-mono text-xs cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude" className="text-xs font-semibold text-slate-500">พิกัด Longitude (ถอดจากลิงก์แผนที่)</Label>
            <Input
              id="longitude"
              value={formLng}
              readOnly
              placeholder="-"
              className="h-10.5 rounded-xl bg-slate-50 border-slate-200 text-slate-500 font-mono text-xs cursor-not-allowed"
            />
          </div>
        </div>

        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Meta Tags (สำหรับ Search Engine)</h3>
          
          <div className="space-y-2">
            <Label htmlFor="seoTitle" className="text-sm font-bold text-slate-700">SEO Title (หัวข้อเว็บ)</Label>
            <Input
              id="seoTitle"
              value={formSeoTitle}
              onChange={(e) => { setFormSeoTitle(e.target.value); setIsFormDirty(true); }}
              placeholder="เช่น คอนโดใกล้ BTS อโศก | ชื่อแบรนด์"
              className="h-10.5 bg-white rounded-xl border-slate-200 focus-visible:ring-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seoDesc" className="text-sm font-bold text-slate-700">SEO Meta Description (คำอธิบายเว็บใน Google)</Label>
            <Textarea
              id="seoDesc"
              value={formSeoDesc}
              onChange={(e) => { setFormSeoDesc(e.target.value); setIsFormDirty(true); }}
              placeholder="เช่น ค้นหาคอนโด บ้านเดี่ยว ทาวน์โฮม ขายและให้เช่า ใกล้สถานี BTS อโศก..."
              rows={3}
              className="bg-white rounded-xl border-slate-200 focus-visible:ring-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold text-slate-700">คำอธิบายทำเลบนหน้าเว็บ (Description Content)</Label>
          <Tabs defaultValue="th" className="w-full">
            <TabsList className="grid grid-cols-4 rounded-xl h-10.5 p-1 bg-slate-100 border border-slate-200/50">
              <TabsTrigger value="th" className="rounded-lg font-semibold text-xs animate-none">ไทย</TabsTrigger>
              <TabsTrigger value="en" className="rounded-lg font-semibold text-xs animate-none">อังกฤษ</TabsTrigger>
              <TabsTrigger value="cn" className="rounded-lg font-semibold text-xs animate-none">จีน</TabsTrigger>
              <TabsTrigger value="ru" className="rounded-lg font-semibold text-xs animate-none">รัสเซีย</TabsTrigger>
            </TabsList>
            <div className="mt-3">
              <TabsContent value="th">
                <Textarea
                  value={formDescTh}
                  onChange={(e) => { setFormDescTh(e.target.value); setIsFormDirty(true); }}
                  placeholder="ใส่รายละเอียดคำบรรยายทำเลรอบสถานีภาษาไทย (รองรับ HTML แท็ก)..."
                  rows={5}
                  className="rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                />
              </TabsContent>
              <TabsContent value="en">
                <Textarea
                  value={formDescEn}
                  onChange={(e) => { setFormDescEn(e.target.value); setIsFormDirty(true); }}
                  placeholder="ใส่รายละเอียดคำบรรยายทำเลรอบสถานีภาษาอังกฤษ (รองรับ HTML แท็ก)..."
                  rows={5}
                  className="rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                />
              </TabsContent>
              <TabsContent value="cn">
                <Textarea
                  value={formDescCn}
                  onChange={(e) => { setFormDescCn(e.target.value); setIsFormDirty(true); }}
                  placeholder="ใส่รายละเอียดคำบรรยายทำเลรอบสถานีภาษาจีน (รองรับ HTML แท็ก)..."
                  rows={5}
                  className="rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                />
              </TabsContent>
              <TabsContent value="ru">
                <Textarea
                  value={formDescRu}
                  onChange={(e) => { setFormDescRu(e.target.value); setIsFormDirty(true); }}
                  placeholder="ใส่รายละเอียดคำบรรยายทำเลรอบสถานีภาษารัสเซีย (รองรับ HTML แท็ก)..."
                  rows={5}
                  className="rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
