import React, { useState } from "react";
import { Info, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { SMART_TAGS } from "../constants";

export function SmartTagsCheatSheet() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-8 relative group transition-all duration-300">
      <div className="absolute inset-0 bg-linear-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl blur-xl" />
      <div className="relative p-5 bg-white border border-blue-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Sparkles className="h-24 w-24 text-blue-600" />
        </div>

        <div className="flex items-start gap-4">
          <div className="hidden sm:flex p-2.5 bg-blue-50 rounded-xl shrink-0">
            <Info className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-3 flex-1">
            <div 
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setIsOpen(!isOpen)}
            >
              <h4 className="text-[14px] font-semibold text-slate-800 flex items-center gap-2">
                💡 Smart Tags: ดึงข้อมูลทรัพย์สินมาใส่ในข้อความอัตโนมัติ
              </h4>
              <div className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>

            {isOpen && (
              <div className="animate-in fade-in duration-200">
                <p className="text-[13px] text-slate-500 leading-relaxed mt-1">
                  เมื่อลูกค้าคอมเมนต์ใต้โพสต์ที่แชร์จากระบบ
                  ระบบจะส่งอัลบั้มรูปภาพพร้อมข้อความที่คุณตั้งค่าไว้
                  โดยคุณสามารถใช้ Tag เหล่านี้ได้เลย:
                </p>
                <div className="max-h-[160px] overflow-y-auto pr-2 custom-scrollbar mt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pb-2">
                    {SMART_TAGS.map((item) => (
                      <div
                        key={item.tag}
                        className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg text-xs group/tag cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all active:scale-95"
                        onClick={() => {
                          navigator.clipboard.writeText(item.tag);
                          toast.success(`คัดลอก ${item.tag} แล้ว`, {
                            description: "วางในกล่องข้อความได้เลยครับ",
                            duration: 2000,
                          });
                        }}
                      >
                        <code className="text-blue-600 font-bold group-hover/tag:text-blue-700 transition-colors">
                          {item.tag}
                        </code>
                        <span className="text-slate-400 group-hover/tag:text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis ml-2">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
