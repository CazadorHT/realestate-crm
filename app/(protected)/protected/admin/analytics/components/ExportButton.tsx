"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { PropertyAnalytics, AreaAnalytics } from "@/features/dashboard/queries";
import { toast } from "sonner";
import { listingTypeLabel, propertyTypeLabel, ListingType, PropertyType } from "@/features/properties/labels";
import { useLanguage } from "@/lib/i18n/language-context";
import { getDistrictName, getProvinceName } from "@/lib/utils/provinces";

interface ExportButtonProps {
  topProperties: PropertyAnalytics[];
  topAreas: AreaAnalytics[];
  totalViews: number;
}

export function ExportButton({ topProperties, topAreas, totalViews }: ExportButtonProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // 1. Prepare Property Data
      const propertyData = topProperties.map((p, index) => {
        const displayTitle = (isEn && p.title_en) ? p.title_en : p.title;
        return {
          [isEn ? "No." : "ลำดับ"]: index + 1,
          [isEn ? "Property Title" : "ชื่อทรัพย์สิน"]: displayTitle,
          "ID": p.id.slice(0, 8),
          [isEn ? "Deal Type" : "ประเภทดีล"]: listingTypeLabel(p.listing_type as ListingType, isEn ? "en" : "th"),
          [isEn ? "Property Type" : "ประเภททรัพย์"]: p.property_type ? propertyTypeLabel(p.property_type as PropertyType, isEn ? "en" : "th") : "-",
          [isEn ? "Sale Price" : "ราคาขาย"]: p.price?.toLocaleString() || "-",
          [isEn ? "Rent Price" : "ราคาเช่า"]: p.rental_price?.toLocaleString() || "-",
          [isEn ? "Views" : "ยอดเข้าชม"]: p.view_count,
          [isEn ? "Link" : "ลิงก์"]: `${window.location.origin}/protected/properties/${p.id}`
        };
      });

      // 2. Prepare Area Data
      const areaData = topAreas.map((a, index) => {
        const displayArea = isEn 
          ? (getDistrictName(a.name, "en") || getProvinceName(a.name, "en") || a.name)
          : a.name;
        return {
          [isEn ? "No." : "ลำดับ"]: index + 1,
          [isEn ? "Area/Location" : "ชื่อย่าน/พื้นที่"]: displayArea,
          [isEn ? "Views" : "ยอดเข้าชม"]: a.view_count,
          [isEn ? "Leads Count" : "จำนวน Leads ที่สนใจ"]: a.leads_count,
          "Market Interest Share": `${Math.round((a.view_count / (totalViews || 1)) * 100)}%`
        };
      });

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
      const dateStr = new Date().toLocaleDateString(isEn ? "en-US" : "th-TH").replace(/\//g, "-");
      XLSX.writeFile(wb, `Analytics-Report-${dateStr}.xlsx`);
      
      toast.success(isEn ? "Export completed successfully" : "ส่งออกข้อมูลสำเร็จแล้ว", {
        description: isEn ? "Excel file is ready and downloading." : "เตรียมไฟล์ Excel พร้อมให้คุณดาวน์โหลด",
      });
    } catch {
      toast.error(isEn ? "Failed to export analytics data" : "เกิดข้อผิดพลาดในการส่งออกข้อมูล");
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
      <span className="hidden md:block">{isEn ? "Export Excel" : "ส่งออก Excel"}</span>
    </Button>
  );
}

