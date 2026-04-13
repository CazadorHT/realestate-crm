"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { PropertyAnalytics, AreaAnalytics } from "@/features/dashboard/queries";
import { toast } from "sonner";
import { LISTING_TYPE_LABELS } from "@/features/properties/labels";

interface ExportButtonProps {
  topProperties: PropertyAnalytics[];
  topAreas: AreaAnalytics[];
  totalViews: number;
}

export function ExportButton({ topProperties, topAreas, totalViews }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // 1. Prepare Property Data
      const propertyData = topProperties.map((p, index) => ({
         "ลำดับ": index + 1,
         "ชื่อทรัพย์สิน": p.title,
         "ID": p.id.slice(0, 8),
         "ประเภทดีล": LISTING_TYPE_LABELS[p.listing_type as keyof typeof LISTING_TYPE_LABELS] || p.listing_type,
         "ประเภททรัพย์": p.property_type || "-",
         "ราคาขาย": p.price?.toLocaleString() || "-",
         "ราคาเช่า": p.rental_price?.toLocaleString() || "-",
         "ยอดเข้าชม (Views)": p.view_count,
         "ลิงก์": `${window.location.origin}/protected/properties/${p.id}`
      }));

      // 2. Prepare Area Data
      const areaData = topAreas.map((a, index) => ({
         "ลำดับ": index + 1,
         "ชื่อย่าน/พื้นที่": a.name,
         "ยอดเข้าชม (Views)": a.view_count,
         "จำนวน Leads ที่สนใจ": a.leads_count,
         "Market Interest Share": `${Math.round((a.view_count / (totalViews || 1)) * 100)}%`
      }));

      // 3. Create Workbook
      const wb = XLSX.utils.book_new();
      
      // 4. Create Sheets
      const wsProperties = XLSX.utils.json_to_sheet(propertyData);
      const wsAreas = XLSX.utils.json_to_sheet(areaData);

      // 5. Add Formatting (Basic Column Widths)
      const wscolsProps = [
        { wch: 5 }, { wch: 40 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 50 }
      ];
      wsProperties["!cols"] = wscolsProps;

      const wscolsAreas = [
        { wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 20 }
      ];
      wsAreas["!cols"] = wscolsAreas;

      // 6. Append Sheets
      XLSX.utils.book_append_sheet(wb, wsProperties, "Top Properties");
      XLSX.utils.book_append_sheet(wb, wsAreas, "Area Analysis");

      // 7. Write and Download
      const dateStr = new Date().toLocaleDateString("th-TH").replace(/\//g, "-");
      XLSX.writeFile(wb, `V-Link-Analytics-${dateStr}.xlsx`);
      
      toast.success("ส่งออกข้อมูลสำเร็จแล้ว", {
        description: "เตรียมไฟล์ Excel พร้อมให้คุณดาวน์โหลด",
      });
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center justify-center gap-2 w-full md:w-auto bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all font-medium py-1.5 h-12 rounded-xl shadow-sm"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      ) : (
        <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
      )}
      <span className="hidden md:block">ส่งออก Excel</span>
    </Button>
  );
}
