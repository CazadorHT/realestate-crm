"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface Step4DescriptionProps {
  descTh: string;
  setDescTh: (val: string) => void;
  descEn: string;
  setDescEn: (val: string) => void;
  descCn: string;
  setDescCn: (val: string) => void;
  descRu: string;
  setDescRu: (val: string) => void;
  setIsFormDirty: (val: boolean) => void;
}

export function Step4Description({
  descTh,
  setDescTh,
  descEn,
  setDescEn,
  descCn,
  setDescCn,
  descRu,
  setDescRu,
  setIsFormDirty,
}: Step4DescriptionProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1">คำบรรยายรายละเอียดโครงการ</h4>
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
                value={descTh}
                onChange={(e) => { setDescTh(e.target.value); setIsFormDirty(true); }}
                placeholder="รายละเอียดคำบรรยายจุดขายและการเดินทางรอบโครงการ (รองรับ HTML)..."
                rows={8}
                className="rounded-xl border-slate-200"
              />
            </TabsContent>
            <TabsContent value="en">
              <Textarea
                value={descEn}
                onChange={(e) => { setDescEn(e.target.value); setIsFormDirty(true); }}
                placeholder="Project description, selling points, and location details in English (HTML supported)..."
                rows={8}
                className="rounded-xl border-slate-200"
              />
            </TabsContent>
            <TabsContent value="cn">
              <Textarea
                value={descCn}
                onChange={(e) => { setDescCn(e.target.value); setIsFormDirty(true); }}
                placeholder="项目的中文详细介绍、卖点及周边交通情况（支持 HTML 格式）..."
                rows={8}
                className="rounded-xl border-slate-200"
              />
            </TabsContent>
            <TabsContent value="ru">
              <Textarea
                value={descRu}
                onChange={(e) => { setDescRu(e.target.value); setIsFormDirty(true); }}
                placeholder="Описание проекта, преимущества и транспортная доступность на русском языке (поддерживается HTML)..."
                rows={8}
                className="rounded-xl border-slate-200"
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
