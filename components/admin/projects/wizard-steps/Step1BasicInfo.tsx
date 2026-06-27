"use client";

import * as React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Step1BasicInfoProps {
  nameTh: string;
  setNameTh: (val: string) => void;
  nameEn: string;
  setNameEn: (val: string) => void;
  slug: string;
  setSlug: (val: string) => void;
  developer: string;
  setDeveloper: (val: string) => void;
  propertyType: string;
  setPropertyType: (val: string) => void;
  yearCompleted: string;
  setYearCompleted: (val: string) => void;
  totalUnits: string;
  setTotalUnits: (val: string) => void;
  imageUrl: string;
  setImageUrl: (val: string) => void;
  isAiGenerating: boolean;
  onAiAutoFill: () => void;
  setIsFormDirty: (val: boolean) => void;
}

export function Step1BasicInfo({
  nameTh,
  setNameTh,
  nameEn,
  setNameEn,
  slug,
  setSlug,
  developer,
  setDeveloper,
  propertyType,
  setPropertyType,
  yearCompleted,
  setYearCompleted,
  totalUnits,
  setTotalUnits,
  imageUrl,
  setImageUrl,
  isAiGenerating,
  onAiAutoFill,
  setIsFormDirty,
}: Step1BasicInfoProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100/70 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-sm font-bold text-indigo-950 block">AI ค้นหาและกรอกข้อมูลโครงการด่วน</span>
            <span className="text-[11px] text-indigo-700/80 block">ระบุชื่อโครงการภาษาอังกฤษหรือไทย แล้วกดปุ่มเพื่อให้ AI กรอกข้อมูล 5 ขั้นตอนให้อัตโนมัติ</span>
          </div>
        </div>
        <Button
          type="button"
          onClick={onAiAutoFill}
          disabled={isAiGenerating}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 h-9.5 rounded-xl transition-all duration-200 cursor-pointer shadow-xs shrink-0 flex items-center justify-center gap-1.5"
        >
          {isAiGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              กำลังค้นหา...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              ให้ AI ค้นและกรอกข้อมูล
            </>
          )}
        </Button>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1">ข้อมูลทั่วไปโครงการ</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nameTh" className="text-sm font-bold text-slate-700">ชื่อโครงการ (ภาษาไทย) *</Label>
            <Input
              id="nameTh"
              value={nameTh}
              onChange={(e) => { setNameTh(e.target.value); setIsFormDirty(true); }}
              placeholder="เช่น เดอะ ไลน์ สุขุมวิท 71"
              className="h-10.5 rounded-xl border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nameEn" className="text-sm font-bold text-slate-700">ชื่อโครงการ (ภาษาอังกฤษ) *</Label>
            <Input
              id="nameEn"
              value={nameEn}
              onChange={(e) => { setNameEn(e.target.value); setIsFormDirty(true); }}
              placeholder="เช่น The Line Sukhumvit 71"
              className="h-10.5 rounded-xl border-slate-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-sm font-bold text-slate-700">URL Slug *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setIsFormDirty(true); }}
              placeholder="เช่น the-line-sukhumvit-71"
              className="h-10.5 rounded-xl border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="developer" className="text-sm font-bold text-slate-700">ผู้พัฒนาโครงการ (Developer)</Label>
            <Input
              id="developer"
              value={developer}
              onChange={(e) => { setDeveloper(e.target.value); setIsFormDirty(true); }}
              placeholder="เช่น แสนสิริ (Sansiri)"
              className="h-10.5 rounded-xl border-slate-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-bold text-slate-700">ประเภทโครงการ</Label>
            <Select value={propertyType} onValueChange={(val) => { setPropertyType(val); setIsFormDirty(true); }}>
              <SelectTrigger className="h-10.5 rounded-xl border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">คอนโดมิเนียม (Condo)</SelectItem>
                <SelectItem value="2">บ้านเดี่ยว (House)</SelectItem>
                <SelectItem value="3">ทาวน์โฮม (Townhome)</SelectItem>
                <SelectItem value="8">วิลล่า (Villa)</SelectItem>
                <SelectItem value="9">พูลวิลล่า (Pool Villa)</SelectItem>
                <SelectItem value="7">อาคารสำนักงาน (Office Building)</SelectItem>
                <SelectItem value="4">ที่ดิน (Land)</SelectItem>
                <SelectItem value="6">โกดัง / โรงงาน (Warehouse)</SelectItem>
                <SelectItem value="5">อาคารพาณิชย์ (Commercial)</SelectItem>
                <SelectItem value="10">อื่นๆ (Other)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearCompleted" className="text-sm font-bold text-slate-700">ปีที่สร้างเสร็จ (พ.ศ. / ค.ศ.)</Label>
            <Input
              id="yearCompleted"
              value={yearCompleted}
              onChange={(e) => { setYearCompleted(e.target.value); setIsFormDirty(true); }}
              placeholder="เช่น 2018"
              type="number"
              className="h-10.5 rounded-xl border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalUnits" className="text-sm font-bold text-slate-700">จำนวนยูนิตทั้งหมด</Label>
            <Input
              id="totalUnits"
              value={totalUnits}
              onChange={(e) => { setTotalUnits(e.target.value); setIsFormDirty(true); }}
              placeholder="เช่น 291"
              type="number"
              className="h-10.5 rounded-xl border-slate-200"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl" className="text-sm font-bold text-slate-700">รูปภาพหน้าปกโครงการ (Image URL)</Label>
          <Input
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => { setImageUrl(e.target.value); setIsFormDirty(true); }}
            placeholder="https://example.com/project-image.jpg"
            className="h-10.5 rounded-xl border-slate-200"
          />
        </div>
      </div>
    </div>
  );
}
