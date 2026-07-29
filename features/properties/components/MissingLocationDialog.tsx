"use client";

import * as React from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Plus, MapPinned, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export type PopularAreaItem =
  | string
  | {
      id?: string;
      name_th: string;
      name_en?: string | null;
      name_cn?: string | null;
      name_ru?: string | null;
      province?: string | null;
    };

interface MissingLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  popularAreas: PopularAreaItem[];
  province?: string;
  onSelectAreaAndSubmit: (areaName: string) => void;
  onCreateAreaAndSubmit: (areaData: {
    name: string;
    name_en?: string;
    name_cn?: string;
    name_ru?: string;
  }) => Promise<boolean>;
  onSkipAndSubmit: () => void;
}

export function MissingLocationDialog({
  open,
  onOpenChange,
  popularAreas,
  province,
  onSelectAreaAndSubmit,
  onCreateAreaAndSubmit,
  onSkipAndSubmit,
}: MissingLocationDialogProps) {
  const [selectedArea, setSelectedArea] = React.useState<string>("");
  const [activeTab, setActiveTab] = React.useState<"select" | "create">("select");
  
  // New area form state
  const [newAreaTh, setNewAreaTh] = React.useState("");
  const [newAreaEn, setNewAreaEn] = React.useState("");
  const [newAreaCn, setNewAreaCn] = React.useState("");
  const [newAreaRu, setNewAreaRu] = React.useState("");
  const [isSubmittingNewArea, setIsSubmittingNewArea] = React.useState(false);

  // Reset local state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedArea("");
      setActiveTab("select");
      setNewAreaTh("");
      setNewAreaEn("");
      setNewAreaCn("");
      setNewAreaRu("");
    }
  }, [open]);

  const popularAreaList = React.useMemo(() => {
    return (popularAreas || []).map((item) =>
      typeof item === "string" ? { name_th: item } : item
    );
  }, [popularAreas]);

  // Filter popular areas by selected province if available
  const filteredAreas = React.useMemo(() => {
    if (!province) return popularAreaList;
    const matched = popularAreaList.filter(
      (a) => !a.province || a.province === province
    );
    return matched.length > 0 ? matched : popularAreaList;
  }, [popularAreaList, province]);

  const handleConfirmSelect = () => {
    if (!selectedArea) {
      toast.error("กรุณาเลือกทำเล/ย่านที่ต้องการก่อนครับ");
      return;
    }
    onSelectAreaAndSubmit(selectedArea);
  };

  const handleCreateArea = async () => {
    if (!newAreaTh.trim()) {
      toast.error("กรุณาระบุชื่อทำเล (ภาษาไทย)");
      return;
    }
    setIsSubmittingNewArea(true);
    try {
      const success = await onCreateAreaAndSubmit({
        name: newAreaTh.trim(),
        name_en: newAreaEn.trim() || undefined,
        name_cn: newAreaCn.trim() || undefined,
        name_ru: newAreaRu.trim() || undefined,
      });
      if (success) {
        // Submit triggered inside callback
      }
    } finally {
      setIsSubmittingNewArea(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-2.5 text-amber-600 font-bold text-lg">
          <div className="p-2 rounded-full bg-amber-100/80 text-amber-600">
            <MapPinned className="h-5 w-5" />
          </div>
          ยังไม่ได้เลือก "ทำเล/ย่าน"
        </div>
      }
      description={
        province
          ? `ระบบพบว่าคุณยังไม่ได้เลือกทำเลสำหรับจังหวัด "${province}"`
          : "การเลือกทำเลจะช่วยให้ค้นหาทรัพย์ได้ง่ายขึ้น และช่วยเพิ่มโอกาสในการติดอันดับผลการค้นหา"
      }
      className="max-w-md"
    >
      <div className="py-2 space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="select" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
              <MapPin className="h-3.5 w-3.5" />
              เลือกจากทำเลที่มีอยู่
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium">
              <Plus className="h-3.5 w-3.5" />
              สร้างทำเลใหม่
            </TabsTrigger>
          </TabsList>

          {/* Select Existing Tab */}
          <TabsContent value="select" className="space-y-4 mt-0">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                เลือกทำเลยอดนิยม {province ? `(${province})` : ""}
              </label>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger className="w-full h-11 rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="-- กรุณาเลือกทำเล/ย่าน --" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredAreas.map((area, idx) => (
                    <SelectItem key={area.id || idx} value={area.name_th}>
                      {area.name_th}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleConfirmSelect}
              disabled={!selectedArea}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
            >
              เลือกทำเลนี้และบันทึกทรัพย์
            </Button>
          </TabsContent>

          {/* Create New Tab */}
          <TabsContent value="create" className="space-y-3.5 mt-0">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                ชื่อทำเล/ย่าน (ภาษาไทย) <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="เช่น พระราม 9, ทองหล่อ, นิมมาน"
                value={newAreaTh}
                onChange={(e) => setNewAreaTh(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500">English</label>
                <Input
                  placeholder="e.g. Rama 9"
                  value={newAreaEn}
                  onChange={(e) => setNewAreaEn(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500">中文</label>
                <Input
                  placeholder="例如 帕拉9"
                  value={newAreaCn}
                  onChange={(e) => setNewAreaCn(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500">Русский</label>
                <Input
                  placeholder="Рама 9"
                  value={newAreaRu}
                  onChange={(e) => setNewAreaRu(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                />
              </div>
            </div>

            <Button
              onClick={handleCreateArea}
              disabled={isSubmittingNewArea || !newAreaTh.trim()}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs mt-2"
            >
              {isSubmittingNewArea ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังเพิ่มทำเลใหม่...
                </>
              ) : (
                "เพิ่มทำเลใหม่และบันทึกทรัพย์"
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Footer / Skip option */}
        <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
          <span className="text-slate-400">หากไม่ต้องการระบุทำเล</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSkipAndSubmit}
            className="text-slate-500 hover:text-slate-700 underline text-xs h-8 px-2"
          >
            ข้ามและบันทึกทรัพย์เลย
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
