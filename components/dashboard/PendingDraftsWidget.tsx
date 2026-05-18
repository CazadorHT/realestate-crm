"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileEdit, ArrowRight, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DraftItem {
  id: string;
  title: string;
  propertyType: string;
  lastModified: string;
  completionRate: number; // 0 - 100
  missingFields: string[]; // e.g. ["รูปภาพห้อง", "ราคาขาย"]
}

// Mock/Initial data for the Proactive Nudging Widget (Phase 2 Gamification)
const MOCK_DRAFTS: DraftItem[] = [
  {
    id: "draft-1",
    title: "คอนโด XT ห้วยขวาง (ห้องมุมวิวเมือง)",
    propertyType: "CONDO",
    lastModified: "10 นาทีที่แล้ว",
    completionRate: 60,
    missingFields: ["รูปภาพห้อง", "ราคาขาย"],
  },
  {
    id: "draft-2",
    title: "บ้านเดี่ยว นันทวัน พระราม 9-ศรีนครินทร์",
    propertyType: "HOUSE",
    lastModified: "2 ชั่วโมงที่แล้ว",
    completionRate: 85,
    missingFields: ["พิกัดแผนที่"],
  },
];

export function PendingDraftsWidget() {
  const router = useRouter();
  const [drafts, setDrafts] = React.useState<DraftItem[]>(MOCK_DRAFTS);

  if (drafts.length === 0) {
    return null; // Hide widget if no pending drafts
  }

  return (
    <div className="bg-linear-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/60 rounded-3xl p-6 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-md shadow-amber-200">
            <FileEdit className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              งานที่ค้างอยู่ (Pending Drafts)
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {drafts.length} รายการ
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              ลงประกาศที่ค้างอยู่ให้เสร็จ เพื่อเพิ่มโอกาสปิดการขายของคุณ! 🚀
            </p>
          </div>
        </div>
      </div>

      {/* Draft Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {drafts.map((draft) => {
          const blocks = 5;
          const filledBlocks = Math.round((draft.completionRate / 100) * blocks);

          return (
            <div
              key={draft.id}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-4 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                    {draft.propertyType}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <Clock className="h-3 w-3" /> {draft.lastModified}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-800 group-hover:text-amber-600 transition-colors line-clamp-1 mb-3">
                  {draft.title}
                </h4>

                {/* Gamification Progress Bar */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>ความสมบูรณ์ของข้อมูล</span>
                    <span className="text-amber-600">{draft.completionRate}%</span>
                  </div>
                  <div className="flex gap-1 h-2 w-full">
                    {Array.from({ length: blocks }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-full flex-1 rounded-full transition-colors duration-500",
                          i < filledBlocks
                            ? "bg-amber-500 shadow-xs shadow-amber-200"
                            : "bg-slate-100",
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Missing Fields Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-amber-500" /> ขาดข้อมูล:
                  </span>
                  {draft.missingFields.map((field, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-md border border-red-100"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <Button
                type="button"
                onClick={() => router.push(`/protected/properties/new`)}
                className="w-full h-10 rounded-xl bg-slate-900 hover:bg-amber-500 text-white font-bold shadow-sm transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-md"
              >
                ทำต่อให้เสร็จ (Continue)
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
