"use client";

import * as React from "react";
import { 
  TrainFront, Landmark, Plus, Trash2, Edit2, Search, Loader2, Sparkles, AlertCircle, CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  getAllMasterDataAction, upsertMasterDataAction, deleteMasterDataAction 
} from "@/features/properties/actions/fetch-master-data";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n/language-context";

interface MasterDataItem {
  id?: string;
  type: string; // TRANSIT_TYPE | NEARBY_PLACE_CATEGORY
  code: string;
  label: { th: string; en: string; cn: string; ru: string };
  metadata?: { color?: string; [key: string]: any };
  sort_order: number;
  is_active: boolean;
}

export default function MasterDataAdminPage() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [activeTab, setActiveTab] = React.useState<"TRANSIT_TYPE" | "NEARBY_PLACE_CATEGORY">("TRANSIT_TYPE");
  const [items, setItems] = React.useState<MasterDataItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<"add" | "edit">("add");
  const [currentItem, setCurrentItem] = React.useState<MasterDataItem>({
    type: "TRANSIT_TYPE",
    code: "",
    label: { th: "", en: "", cn: "", ru: "" },
    metadata: { color: "#3b82f6" },
    sort_order: 0,
    is_active: true,
  });
  const [isSaving, setIsSaving] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllMasterDataAction(activeTab);
      setItems(data as MasterDataItem[]);
    } catch {
      toast.error(isEn ? "Failed to load master data" : "ไม่สามารถโหลดข้อมูล Master Data ได้");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, isEn]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAddModal = () => {
    setModalMode("add");
    setCurrentItem({
      type: activeTab,
      code: "",
      label: { th: "", en: "", cn: "", ru: "" },
      metadata: { color: activeTab === "TRANSIT_TYPE" ? "#3b82f6" : "#10b981" },
      sort_order: items.length * 10,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: MasterDataItem) => {
    setModalMode("edit");
    setCurrentItem({
      ...item,
      label: item.label || { th: item.code, en: item.code, cn: item.code, ru: item.code },
      metadata: item.metadata || { color: activeTab === "TRANSIT_TYPE" ? "#3b82f6" : "#10b981" },
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem.code || !currentItem.label.th) {
      toast.error(isEn ? "Please specify Code and Thai name" : "กรุณากรอกรหัสและชื่อภาษาไทย");
      return;
    }

    setIsSaving(true);
    try {
      const res = await upsertMasterDataAction({
        type: currentItem.type,
        code: currentItem.code,
        label: currentItem.label,
        metadata: currentItem.metadata,
        sort_order: currentItem.sort_order,
        is_active: currentItem.is_active,
      });

      if (res.success) {
        toast.success(res.message || (isEn ? "Saved successfully" : "บันทึกสำเร็จ"));
        setIsModalOpen(false);
        loadData();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error(isEn ? "Failed to save master data" : "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (type: string, code: string) => {
    if (!confirm(isEn ? `Are you sure you want to delete ${code}?` : `คุณต้องการลบ ${code} ใช่หรือไม่?`)) return;

    try {
      const res = await deleteMasterDataAction(type, code);
      if (res.success) {
        toast.success(res.message || (isEn ? "Deleted successfully" : "ลบสำเร็จ"));
        loadData();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error(isEn ? "Failed to delete item" : "เกิดข้อผิดพลาดในการลบ");
    }
  };

  const toggleActive = async (item: MasterDataItem, nextActive: boolean) => {
    try {
      const res = await upsertMasterDataAction({
        type: item.type,
        code: item.code,
        label: item.label,
        metadata: item.metadata,
        sort_order: item.sort_order,
        is_active: nextActive,
      });
      if (res.success) {
        toast.success(isEn 
          ? `Updated ${item.code} status to ${nextActive ? "Active" : "Inactive"}` 
          : `เปลี่ยนสถานะ ${item.code} เป็น ${nextActive ? "เปิดใช้งาน" : "ปิด"} เรียบร้อย`);
        setItems(items.map((i) => i.code === item.code ? { ...i, is_active: nextActive } : i));
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error(isEn ? "Failed to update status" : "ไม่สามารถอัปเดตสถานะได้");
    }
  };

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.code.toLowerCase().includes(q) ||
      item.label.th.toLowerCase().includes(q) ||
      item.label.en?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-16">
      {/* Premium Header */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" /> V3 Enterprise Config
            </div>
            <h1 className="text-3xl font-semibold tracking-tight bg-linear-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
              {isEn ? "Master Data & Transit Categories" : "จัดการข้อมูลการเดินทางและสถานที่"}
            </h1>
            <p className="text-sm text-indigo-200/80 max-w-xl font-medium">
              {isEn 
                ? "Configure transit lines, transport modes, and nearby place categories for listing and search filters." 
                : "เพิ่ม ลด และปรับแต่งหมวดหมู่สายรถไฟฟ้า การเดินทาง และสถานที่ใกล้เคียงสำหรับฟอร์มประกาศอสังหาริมทรัพย์"}
            </p>
          </div>

          <Button
            type="button"
            onClick={handleOpenAddModal}
            className="h-12 px-6 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-105 flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            {isEn ? "Add New Entry" : "เพิ่มรายการใหม่"}
          </Button>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto p-1 bg-slate-100 rounded-xl border border-slate-200/60 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab("TRANSIT_TYPE")}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-semibold transition-all duration-300 shrink-0 cursor-pointer",
              activeTab === "TRANSIT_TYPE"
                ? "bg-white text-indigo-600 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <TrainFront className="h-4 w-4" />
            {isEn ? "🚝 Transit Lines & Transport" : "🚝 สายรถไฟฟ้าและการเดินทาง"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("NEARBY_PLACE_CATEGORY")}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-semibold transition-all duration-300 shrink-0 cursor-pointer",
              activeTab === "NEARBY_PLACE_CATEGORY"
                ? "bg-white text-emerald-600 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <Landmark className="h-4 w-4" />
            {isEn ? "🏥 Nearby Place Categories" : "🏥 หมวดหมู่สถานที่ใกล้เคียง"}
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isEn ? "Search code or label..." : "ค้นหารหัสอ้างอิง หรือชื่อรายการภาษาไทย/อังกฤษ..."}
            className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium focus:bg-white transition-all w-full"
          />
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm font-semibold text-slate-600">
            {isEn ? "Loading Master Data..." : "กำลังโหลดข้อมูล Master Data..."}
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
          <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-1">
            {isEn ? "No records found" : "ไม่พบข้อมูลรายการในระบบ"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mb-6">
            {isEn
              ? `No ${activeTab === "TRANSIT_TYPE" ? "transit lines" : "nearby place categories"} found matching your search.`
              : `ยังไม่มีข้อมูล ${activeTab === "TRANSIT_TYPE" ? "สายรถไฟฟ้า/การเดินทาง" : "หมวดหมู่สถานที่ใกล้เคียง"} ในฐานข้อมูล หรือไม่พบผลลัพธ์การค้นหา`}
          </p>
          <Button
            type="button"
            onClick={handleOpenAddModal}
            className="h-10 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-semibold px-6 border border-indigo-200 cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isEn ? "Add First Entry" : "เพิ่มข้อมูลแรกทันที"}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.code}
              className={cn(
                "bg-white rounded-2xl p-6 border transition-all duration-300 flex flex-col justify-between gap-6 group shadow-xs hover:shadow-md",
                item.is_active ? "border-slate-100 hover:border-indigo-200" : "border-slate-200 bg-slate-50/50 opacity-70"
              )}
            >
              <div className="space-y-4">
                {/* Card Header */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 border border-slate-200/50 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: item.metadata?.color || "#cbd5e1" }}
                    >
                      {activeTab === "TRANSIT_TYPE" ? <TrainFront className="h-5 w-5" /> : <Landmark className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {isEn ? (item.label.en || item.label.th) : item.label.th}
                      </h4>
                      <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {item.code}
                      </span>
                    </div>
                  </div>

                  <Switch
                    checked={item.is_active}
                    onCheckedChange={(checked) => toggleActive(item, checked)}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>

                {/* Multilingual Preview */}
                <div className="bg-slate-50 p-3.5 rounded-xl space-y-1.5 border border-slate-100 text-xs font-medium">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[10px] font-semibold text-slate-400 w-8">TH</span>
                    <span className="truncate flex-1 text-right">{item.label.th || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[10px] font-semibold text-slate-400 w-8">EN</span>
                    <span className="truncate flex-1 text-right">{item.label.en || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[10px] font-semibold text-slate-400 w-8">CN</span>
                    <span className="truncate flex-1 text-right">{item.label.cn || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[10px] font-semibold text-slate-400 w-8">RU</span>
                    <span className="truncate flex-1 text-right">{item.label.ru || "-"}</span>
                  </div>
                </div>

                {/* Metadata Color Badge */}
                {item.metadata?.color && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span>{isEn ? "Line / Category Color:" : "รหัสสีประจำสาย:"}</span>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200">
                      <div className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: item.metadata.color }} />
                      <span className="font-mono text-[10px] uppercase">{item.metadata.color}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenEditModal(item)}
                  className="flex-1 h-10 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold border-slate-200 hover:border-indigo-200 hover:text-indigo-600 transition-all cursor-pointer"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  {isEn ? "Edit" : "แก้ไข"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleDelete(item.type, item.code)}
                  className="h-10 w-10 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl cursor-pointer"
                  title={isEn ? "Delete" : "ลบ"}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl bg-white rounded-3xl p-6 sm:p-8 border-slate-100 shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              {modalMode === "add" ? <Plus className="h-5 w-5 text-indigo-600" /> : <Edit2 className="h-5 w-5 text-indigo-600" />}
              {modalMode === "add" 
                ? (isEn ? "Add Master Data Entry" : "เพิ่มข้อมูลการเดินทางและสถานที่ใหม่") 
                : (isEn ? `Edit Master Data [${currentItem.code}]` : `แก้ไขข้อมูลการเดินทางและสถานที่ [${currentItem.code}]`)}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              {isEn
                ? "Entries will automatically sync with property forms and search filters."
                : "ข้อมูลที่บันทึกจะอัปเดตไปยังตัวเลือกในหน้าฟอร์มสร้างประกาศและระบบค้นหาโดยอัตโนมัติ"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">
                  {isEn ? "Reference Code" : "รหัสอ้างอิง"} <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={currentItem.code}
                  disabled={modalMode === "edit"}
                  onChange={(e) => setCurrentItem({ ...currentItem, code: e.target.value.toUpperCase() })}
                  placeholder={isEn ? "e.g. BTS_SUKHUMVIT or SCHOOL" : "เช่น BTS_SUKHUMVIT หรือ SCHOOL"}
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-semibold uppercase focus:bg-white"
                />
                <span className="text-[10px] text-slate-400">
                  {isEn ? "Uppercase English letters, no spaces" : "ใช้ภาษาอังกฤษตัวพิมพ์ใหญ่ ไม่มีเว้นวรรค"}
                </span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">
                  {isEn ? "Color Badge" : "รหัสสีประจำรายการ"}
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={currentItem.metadata?.color || "#3b82f6"}
                    onChange={(e) => setCurrentItem({
                      ...currentItem,
                      metadata: { ...currentItem.metadata, color: e.target.value }
                    })}
                    className="w-14 h-11 p-1 rounded-xl bg-slate-50 border-slate-200 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={currentItem.metadata?.color || "#3b82f6"}
                    onChange={(e) => setCurrentItem({
                      ...currentItem,
                      metadata: { ...currentItem.metadata, color: e.target.value }
                    })}
                    placeholder="#3B82F6"
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-mono font-semibold uppercase focus:bg-white flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <Label className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                {isEn ? "Multilingual Display Names" : "ชื่อแสดงผลหลายภาษา"}
              </Label>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500 w-16">
                    {isEn ? "Thai *" : "ภาษาไทย *"}
                  </span>
                  <Input
                    value={currentItem.label.th}
                    onChange={(e) => setCurrentItem({ ...currentItem, label: { ...currentItem.label, th: e.target.value } })}
                    placeholder={isEn ? "e.g. รถไฟฟ้าสายสีเขียว (สุขุมวิท)" : "เช่น รถไฟฟ้าสายสีเขียว (สุขุมวิท)"}
                    className="h-10 rounded-xl bg-white border-slate-200 text-xs font-semibold focus:bg-white flex-1"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500 w-16">English</span>
                  <Input
                    value={currentItem.label.en}
                    onChange={(e) => setCurrentItem({ ...currentItem, label: { ...currentItem.label, en: e.target.value } })}
                    placeholder="e.g. BTS Green Line (Sukhumvit)"
                    className="h-10 rounded-xl bg-white border-slate-200 text-xs font-medium focus:bg-white flex-1"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500 w-16">中文</span>
                  <Input
                    value={currentItem.label.cn}
                    onChange={(e) => setCurrentItem({ ...currentItem, label: { ...currentItem.label, cn: e.target.value } })}
                    placeholder="e.g. 曼谷轻轨绿线 (素坤逸线)"
                    className="h-10 rounded-xl bg-white border-slate-200 text-xs font-medium focus:bg-white flex-1"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500 w-16">Русский</span>
                  <Input
                    value={currentItem.label.ru}
                    onChange={(e) => setCurrentItem({ ...currentItem, label: { ...currentItem.label, ru: e.target.value } })}
                    placeholder="e.g. Зеленая линия BTS (Сукхумвит)"
                    className="h-10 rounded-xl bg-white border-slate-200 text-xs font-medium focus:bg-white flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">
                  {isEn ? "Sort Order" : "ลำดับการแสดงผล"}
                </Label>
                <Input
                  type="number"
                  value={currentItem.sort_order}
                  onChange={(e) => setCurrentItem({ ...currentItem, sort_order: parseInt(e.target.value) || 0 })}
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-semibold focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 mt-6 sm:mt-0 sm:self-end h-11">
                <Label className="text-xs font-semibold text-slate-700 cursor-pointer" htmlFor="modal-active">
                  {isEn ? "Active Status" : "สถานะการเปิดใช้งาน"}
                </Label>
                <Switch
                  id="modal-active"
                  checked={currentItem.is_active}
                  onCheckedChange={(checked) => setCurrentItem({ ...currentItem, is_active: checked })}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-11 rounded-xl font-semibold border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {isEn ? "Cancel" : "ยกเลิก"}
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                {isSaving 
                  ? (isEn ? "Saving..." : "กำลังบันทึก...") 
                  : (isEn ? "Save Master Data" : "บันทึกข้อมูล")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

