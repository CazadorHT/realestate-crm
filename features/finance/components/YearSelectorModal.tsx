"use client";

import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Check, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

interface YearSelectorModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
  availableYears: number[];
}

interface YearGridProps {
  availableYears: number[];
  selectedYear: number;
  handleYearSelect: (year: number) => void;
  currentYear: number;
  isEn: boolean;
}

const YearGrid = ({
  availableYears,
  selectedYear,
  handleYearSelect,
  currentYear,
  isEn
}: YearGridProps) => (
  <ScrollArea className="h-[300px] sm:h-[400px] p-4">
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {availableYears.length > 0 ? (
        availableYears.map((y) => (
          <Button
            key={y}
            variant={selectedYear === y ? "default" : "outline"}
            onClick={() => handleYearSelect(y)}
            className={cn(
              "h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group relative overflow-hidden cursor-pointer",
              selectedYear === y 
                ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 border-none" 
                : "border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30"
            )}
          >
            {!isEn && (
              <span className={cn(
                "text-xs font-semibold uppercase tracking-tighter opacity-60",
                selectedYear === y ? "text-indigo-100" : "text-slate-400"
              )}>
                พ.ศ. {y + 543}
              </span>
            )}
            <span className={cn(
              "text-lg font-semibold tracking-tight",
              selectedYear === y ? "text-white" : "text-slate-900"
            )}>
              {y}
            </span>
            {selectedYear === y && (
              <div className="absolute top-1 right-1">
                 <Check className="w-3 h-3 text-white/50" />
              </div>
            )}
            {y === currentYear && (
              <div className="absolute top-1 left-2">
                 <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold uppercase">{isEn ? "Current" : "ปีปัจจุบัน"}</span>
              </div>
            )}
          </Button>
        ))
      ) : (
        <div className="col-span-full py-20 text-center space-y-3">
           <Clock className="w-10 h-10 text-slate-200 mx-auto" />
           <p className="text-sm font-semibold text-slate-400">
             {isEn ? "No financial year data found" : "ยังไม่พบข้อมูลปีการเงินย้อนหลัง"}
           </p>
        </div>
      )}
    </div>
  </ScrollArea>
);

export function YearSelectorModal({
  isOpen,
  onOpenChange,
  selectedYear,
  onYearChange,
  availableYears
}: YearSelectorModalProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const isMobile = useIsMobile();

  const handleYearSelect = (year: number) => {
    onYearChange(year);
    onOpenChange(false);
  };

  const currentYear = new Date().getFullYear();

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-white/90 backdrop-blur-xl border-none">
          <DrawerHeader>
            <DrawerTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2 justify-center">
              <Calendar className="w-5 h-5 text-indigo-600" />
              {isEn ? "Select Fiscal Year" : "เลือกปีงบประมาณ"}
            </DrawerTitle>
            <DrawerDescription className="text-center font-medium">
              {isEn ? "Showing years with recorded financial and commission data" : "แสดงเฉพาะปีที่ระบบตรวจพบข้อมูลการเงินและคอมมิชชัน"}
            </DrawerDescription>
          </DrawerHeader>
          <YearGrid
            availableYears={availableYears}
            selectedYear={selectedYear}
            handleYearSelect={handleYearSelect}
            currentYear={currentYear}
            isEn={isEn}
          />
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="ghost" className="rounded-xl h-12 font-semibold text-slate-500 cursor-pointer">
                {isEn ? "Cancel" : "ยกเลิก"}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white/90 backdrop-blur-xl border-none shadow-2xl rounded-[2.5rem]">
        <div className="bg-indigo-600 p-8 text-white relative">
           <div className="absolute right-0 top-0 p-10 opacity-10">
              <Calendar className="w-24 h-24 rotate-12" />
           </div>
           <DialogHeader>
             <DialogTitle className="text-2xl font-semibold">
               {isEn ? "Select Fiscal Year" : "เลือกปีงบประมาณองค์กร"}
             </DialogTitle>
             <DialogDescription className="text-indigo-100 font-medium opacity-80">
               {isEn ? "Access historical financial analytics and executive reports" : "เข้าถึงข้อมูลย้อนหลังทุกมิติสำหรับระดับบัญชีและบริหาร"}
             </DialogDescription>
           </DialogHeader>
        </div>
        <div className="p-2">
           <YearGrid
             availableYears={availableYears}
             selectedYear={selectedYear}
             handleYearSelect={handleYearSelect}
             currentYear={currentYear}
             isEn={isEn}
           />
        </div>
        <DialogFooter className="p-8 pt-0">
           <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-semibold text-slate-400 cursor-pointer">
             {isEn ? "Close" : "ปิดหน้าต่าง"}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

