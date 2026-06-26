"use client";

import * as React from "react";
import { 
  Train, Search, Edit2, Loader2, CheckCircle2, AlertCircle, X, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  getAllMasterDataAction, 
  upsertMasterDataAction 
} from "@/features/properties/actions/fetch-master-data";

interface StationItem {
  id?: string;
  type: string; // TRANSIT_STATION
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
    [key: string]: any;
  };
  sort_order: number;
  is_active: boolean;
}

const LINE_LABELS: Record<string, string> = {
  BTS: "BTS Skytrain",
  MRT: "MRT Blue Line",
  MRT_PURPLE: "MRT Purple Line",
  MRT_YELLOW: "MRT Yellow Line",
  MRT_PINK: "MRT Pink Line",
  ARL: "Airport Rail Link",
  SRT_RED: "SRT Red Line",
  GOLD: "Gold Line",
  BRT: "BRT",
};

const LINE_COLORS: Record<string, string> = {
  BTS: "#7BC542",
  MRT: "#1E3A8A",
  MRT_PURPLE: "#7C3AED",
  MRT_YELLOW: "#F59E0B",
  MRT_PINK: "#EC4899",
  ARL: "#DC2626",
  SRT_RED: "#EF4444",
  GOLD: "#D97706",
  BRT: "#059669",
};

export default function TransitStationsAdminPage() {
  const [isFormDirty, setIsFormDirty] = React.useState(false);
  const [stations, setStations] = React.useState<StationItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [lineFilter, setLineFilter] = React.useState<string>("ALL");

  // Modal / Edit state
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [currentStation, setCurrentStation] = React.useState<StationItem | null>(null);

  // Form fields
  const [formSlug, setFormSlug] = React.useState("");
  const [formSeoTitle, setFormSeoTitle] = React.useState("");
  const [formSeoDesc, setFormSeoDesc] = React.useState("");
  const [formDescTh, setFormDescTh] = React.useState("");
  const [formDescEn, setFormDescEn] = React.useState("");
  const [formDescCn, setFormDescCn] = React.useState("");
  const [formDescRu, setFormDescRu] = React.useState("");
  const [formLat, setFormLat] = React.useState("");
  const [formLng, setFormLng] = React.useState("");

  const loadStations = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllMasterDataAction("TRANSIT_STATION");
      setStations(data as StationItem[]);
    } catch (err) {
      toast.error("ไม่สามารถโหลดข้อมูลสถานีได้");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadStations();
  }, [loadStations]);

  const handleOpenEdit = (station: StationItem) => {
    setCurrentStation(station);
    const meta = station.metadata || {};
    
    setFormSlug(meta.slug || station.code.toLowerCase().replace(/_/g, "-"));
    setFormSeoTitle(meta.seo_title || "");
    setFormSeoDesc(meta.seo_description || "");
    setFormDescTh(meta.description?.th || "");
    setFormDescEn(meta.description?.en || "");
    setFormDescCn(meta.description?.cn || "");
    setFormDescRu(meta.description?.ru || "");
    setFormLat(meta.latitude?.toString() || "");
    setFormLng(meta.longitude?.toString() || "");
    
    setIsFormDirty(false);
    setIsEditOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsEditOpen(open);
    if (!open) {
      setIsFormDirty(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentStation) return;

    if (!formSlug.trim()) {
      toast.error("กรุณาระบุ URL Slug");
      return;
    }

    setIsSaving(true);
    try {
      const existingMeta = currentStation.metadata || {};
      const updatedMetadata = {
        ...existingMeta,
        slug: formSlug.trim().toLowerCase(),
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
        code: currentStation.code,
        label: currentStation.label as any,
        metadata: updatedMetadata,
        sort_order: currentStation.sort_order,
        is_active: currentStation.is_active,
      });

      if (res.success) {
        toast.success("บันทึกข้อมูล SEO สถานีสำเร็จ ✨");
        setIsFormDirty(false);
        setIsEditOpen(false);
        loadStations();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStations = stations.filter((station) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      station.code.toLowerCase().includes(q) ||
      station.label.th.toLowerCase().includes(q) ||
      station.label.en.toLowerCase().includes(q);

    const transitType = station.metadata?.transit_type || "OTHER";
    const matchesLine = lineFilter === "ALL" || transitType === lineFilter;

    return matchesSearch && matchesLine;
  });

  const renderFormContent = () => (
    <div className="space-y-5 py-3">
      {/* Slug input */}
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

      {/* Latitude / Longitude */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="latitude" className="text-sm font-bold text-slate-700">พิกัด Latitude</Label>
          <Input
            id="latitude"
            value={formLat}
            onChange={(e) => { setFormLat(e.target.value); setIsFormDirty(true); }}
            placeholder="เช่น 13.7367"
            type="number"
            step="any"
            className="h-10.5 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="longitude" className="text-sm font-bold text-slate-700">พิกัด Longitude</Label>
          <Input
            id="longitude"
            value={formLng}
            onChange={(e) => { setFormLng(e.target.value); setIsFormDirty(true); }}
            placeholder="เช่น 100.5600"
            type="number"
            step="any"
            className="h-10.5 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
          />
        </div>
      </div>

      {/* Meta tags config */}
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

      {/* Page content descriptions */}
      <div className="space-y-2">
        <Label className="text-sm font-bold text-slate-700">คำอธิบายทำเลบนหน้าเว็บ (Description Content)</Label>
        <Tabs defaultValue="th" className="w-full">
          <TabsList className="grid grid-cols-4 rounded-xl h-10.5 p-1 bg-slate-100 border border-slate-200/50">
            <TabsTrigger value="th" className="rounded-lg font-semibold text-xs">ไทย</TabsTrigger>
            <TabsTrigger value="en" className="rounded-lg font-semibold text-xs">อังกฤษ</TabsTrigger>
            <TabsTrigger value="cn" className="rounded-lg font-semibold text-xs">จีน</TabsTrigger>
            <TabsTrigger value="ru" className="rounded-lg font-semibold text-xs">รัสเซีย</TabsTrigger>
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
                placeholder="ใส่รายละเอียดคำบรรยายทำเลรอบสถานีภาษาอังกฤษ..."
                rows={5}
                className="rounded-xl border-slate-200 focus-visible:ring-indigo-500"
              />
            </TabsContent>
            <TabsContent value="cn">
              <Textarea
                value={formDescCn}
                onChange={(e) => { setFormDescCn(e.target.value); setIsFormDirty(true); }}
                placeholder="ใส่รายละเอียดคำบรรยายทำเลรอบสถานีภาษาจีน..."
                rows={5}
                className="rounded-xl border-slate-200 focus-visible:ring-indigo-500"
              />
            </TabsContent>
            <TabsContent value="ru">
              <Textarea
                value={formDescRu}
                onChange={(e) => { setFormDescRu(e.target.value); setIsFormDirty(true); }}
                placeholder="ใส่รายละเอียดคำบรรยายทำเลรอบสถานีภาษารัสเซีย..."
                rows={5}
                className="rounded-xl border-slate-200 focus-visible:ring-indigo-500"
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-950 to-blue-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            จัดการ SEO สถานีรถไฟฟ้า
          </h1>
          <p className="text-sm text-indigo-200/80 max-w-xl font-medium">
            จัดการข้อมูลคำค้นหา คีย์เวิร์ด ชื่อหัวข้อ (SEO Title/Description) และรายละเอียดทำเลของสถานีรถไฟฟ้าสำหรับหน้าค้นหาหลัก
          </p>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
          <Input
            placeholder="ค้นหาตามรหัส หรือชื่อสถานี..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10.5 rounded-xl border-slate-200 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Label className="text-sm font-semibold text-slate-600 shrink-0">สายรถไฟฟ้า:</Label>
          <Select value={lineFilter} onValueChange={setLineFilter}>
            <SelectTrigger className="w-full sm:w-48 h-10.5 rounded-xl border-slate-200">
              <SelectValue placeholder="เลือกสายทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">ทุกสาย</SelectItem>
              {Object.entries(LINE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stations Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
            <span className="text-sm text-slate-500 font-medium animate-pulse">กำลังโหลดข้อมูลสถานี...</span>
          </div>
        ) : filteredStations.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700">ไม่พบสถานีตามเงื่อนไข</h3>
            <p className="text-sm text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือสายรถไฟฟ้าอื่น</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">สถานี (TH / EN)</th>
                  <th className="px-6 py-4">สายรถไฟฟ้า</th>
                  <th className="px-6 py-4">URL Slug</th>
                  <th className="px-6 py-4">สถานะ SEO</th>
                  <th className="px-6 py-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredStations.map((station) => {
                  const meta = station.metadata || {};
                  const transitType = meta.transit_type || "OTHER";
                  const lineColor = meta.line_color || LINE_COLORS[transitType] || "#6b7280";
                  const lineName = LINE_LABELS[transitType] || transitType;
                  
                  const hasSeoTitle = !!meta.seo_title;
                  const hasSeoDesc = !!meta.seo_description;
                  const hasDescription = !!meta.description?.th || !!meta.description?.en;
                  const slug = meta.slug || "-";

                  return (
                    <tr key={station.code} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-semibold text-slate-900 block">{station.label.th}</span>
                          <span className="text-xs text-slate-400 block">{station.label.en}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-3 h-3 rounded-full shrink-0" 
                            style={{ backgroundColor: lineColor }}
                          />
                          <span className="font-medium text-slate-600">{lineName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 font-mono">
                          {slug}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {hasSeoTitle ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Title
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-400 border border-slate-200">
                              No Title
                            </span>
                          )}
                          {hasSeoDesc ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Meta Desc
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-400 border border-slate-200">
                              No Meta Desc
                            </span>
                          )}
                          {hasDescription ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Content
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-400 border border-slate-200">
                              No Content
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(station)}
                            className="h-8.5 rounded-lg border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                            แก้ไข SEO
                          </Button>
                          {meta.slug && (
                            <a
                              href={`/near-station/${meta.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center h-8.5 w-8.5 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-slate-50 transition-colors"
                              title="เปิดดูหน้าร้านค้า"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Responsive Edit Drawer/Dialog */}
      <ResponsiveDialog
        open={isEditOpen}
        onOpenChange={handleOpenChange}
        confirmOnClose={isFormDirty}
        isLoading={isSaving}
        loadingText="กำลังบันทึกข้อมูล SEO..."
        title={
          <span className="flex items-center gap-2 text-slate-900">
            <Train className="h-5.5 w-5.5 text-indigo-600" />
            แก้ไข SEO สถานี: {currentStation?.label.th} {currentStation?.label.en ? `(${currentStation.label.en})` : ""}
          </span>
        }
        description="แก้ไข URL Slug, meta tags และเนื้อหาคำบรรยายทำเลรอบสถานีเพื่อใช้ในการดันอันดับบน Google"
        className="sm:max-w-2xl"
        footer={
          <div className="flex flex-col sm:flex-row justify-end gap-3 w-full px-6 sm:px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={isSaving}
              className="w-full sm:w-auto h-11 sm:h-10.5 rounded-xl font-bold border-slate-200 text-slate-600"
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="w-full sm:w-auto h-11 sm:h-10.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  บันทึกข้อมูล
                </>
              )}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-6 p-6">
          {renderFormContent()}
        </form>
      </ResponsiveDialog>
    </div>
  );
}
