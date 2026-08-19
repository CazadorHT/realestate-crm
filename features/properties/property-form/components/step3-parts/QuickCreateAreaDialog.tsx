"use client";

import * as React from "react";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Compass, MapPin, Loader2, Check, Globe } from "lucide-react";
import { toast } from "sonner";
import {
  translateAreaNameAction,
  savePopularAreaAction,
} from "@/features/properties/actions/popular-area-actions";

interface QuickCreateAreaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProvince?: string;
  defaultAreaName?: string;
  onAreaCreated?: (area: { th: string; en: string; cn: string; ru: string }) => void;
}

export function QuickCreateAreaDialog({
  open,
  onOpenChange,
  defaultProvince = "กรุงเทพมหานคร",
  defaultAreaName = "",
  onAreaCreated,
}: QuickCreateAreaDialogProps) {
  const [province, setProvince] = useState(defaultProvince);
  const [nameTh, setNameTh] = useState(defaultAreaName);
  const [nameEn, setNameEn] = useState("");
  const [nameCn, setNameCn] = useState("");
  const [nameRu, setNameRu] = useState("");

  const [isTranslating, setIsTranslating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync default values when opening
  React.useEffect(() => {
    if (open) {
      if (defaultProvince) setProvince(defaultProvince);
      if (defaultAreaName) {
        setNameTh(defaultAreaName);
        // Auto translate if Thai name is provided
        handleAutoTranslate(defaultAreaName);
      }
    }
  }, [open, defaultProvince, defaultAreaName]);

  const handleAutoTranslate = async (textToTranslate?: string) => {
    const text = textToTranslate || nameTh;
    if (!text || !text.trim()) {
      toast.error("กรุณากรอกชื่อทำเลภาษาไทยก่อนครับ");
      return;
    }

    setIsTranslating(true);
    try {
      const res = await translateAreaNameAction(text);
      if (res.en) setNameEn(res.en);
      if (res.cn) setNameCn(res.cn);
      if (res.ru) setNameRu(res.ru);
      toast.success("AI แปลภาษาทำเลครบทั้ง 4 ภาษาเรียบร้อยแล้ว ✨");
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการแปลภาษา");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = async () => {
    if (!nameTh || !nameTh.trim()) {
      toast.error("กรุณากรอกชื่อทำเลภาษาไทย");
      return;
    }
    if (!province) {
      toast.error("กรุณาระบุจังหวัด");
      return;
    }

    setIsSaving(true);
    try {
      const res = await savePopularAreaAction({
        province,
        nameTh: nameTh.trim(),
        nameEn: nameEn.trim() || nameTh.trim(),
        nameCn: nameCn.trim() || nameTh.trim(),
        nameRu: nameRu.trim() || nameTh.trim(),
      });

      if (res.success) {
        toast.success(`เพิ่ม "${nameTh}" เข้าสู่ย่านยอดนิยมเรียบร้อยแล้ว ✨`);
        if (onAreaCreated) {
          onAreaCreated({
            th: nameTh.trim(),
            en: nameEn.trim() || nameTh.trim(),
            cn: nameCn.trim() || nameTh.trim(),
            ru: nameRu.trim() || nameTh.trim(),
          });
        }
        onOpenChange(false);
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="เพิ่มย่านยอดนิยม / Add Popular Area"
      description="สร้างทำเลใหม่พร้อมคำแปล 4 ภาษา เพื่อให้แสดงผลบนหน้าแรกและค้นหาได้ทันที"
    >
      <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
        {/* Province Indicator */}
        <div className="flex items-center gap-2 p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 font-medium">
          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            จังหวัด: <strong className="font-bold text-blue-950">{province}</strong>
          </span>
        </div>

        {/* Thai Name */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>🇹🇭 ชื่อย่าน/ทำเล (ภาษาไทย)</span>
              <span className="text-red-500">*</span>
            </Label>
            <button
              type="button"
              onClick={() => handleAutoTranslate()}
              disabled={isTranslating || !nameTh.trim()}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isTranslating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isTranslating ? "AI กำลังแปล..." : "ให้ AI ช่วยแปล 4 ภาษา"}</span>
            </button>
          </div>
          <Input
            value={nameTh}
            onChange={(e) => setNameTh(e.target.value)}
            placeholder="เช่น บางละมุง, พัทยากลาง, หาดจอมเทียน, นิมมาน"
            className="h-10 rounded-xl text-xs bg-slate-50/50 focus:bg-white"
          />
        </div>

        {/* 3 Translation Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* English */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <span>🇺🇸 English (EN)</span>
            </Label>
            <Input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Bang Lamung"
              className="h-10 rounded-xl text-xs bg-slate-50/50 focus:bg-white"
            />
          </div>

          {/* Chinese */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <span>🇨🇳 中文 (CN)</span>
            </Label>
            <Input
              value={nameCn}
              onChange={(e) => setNameCn(e.target.value)}
              placeholder="例如 挽腊茫"
              className="h-10 rounded-xl text-xs bg-slate-50/50 focus:bg-white"
            />
          </div>

          {/* Russian */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <span>🇷🇺 Русский (RU)</span>
            </Label>
            <Input
              value={nameRu}
              onChange={(e) => setNameRu(e.target.value)}
              placeholder="например Бангламунг"
              className="h-10 rounded-xl text-xs bg-slate-50/50 focus:bg-white"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 px-4 rounded-xl text-xs font-semibold cursor-pointer"
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !nameTh.trim()}
            className="h-10 px-5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                <span>บันทึกเป็นย่านยอดนิยม</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
