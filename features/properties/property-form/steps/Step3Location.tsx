"use client";

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { PropertyFormValues } from "../../schema";
import type { Step3Props } from "../types";
import {
  AddressSection,
  TransitSection,
  NearbyPlacesSection,
} from "../components/step3-parts";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  suggestNearbyPlacesAndTransitAction,
  getExistingProjectLocationAction,
} from "../actions/ai-actions";

/**
 * Step 3: Location
 * Address fields and transit information
 * Refactored into separate components for easier debugging
 */
export function Step3Location({ mode }: Step3Props) {
  const form = useFormContext<PropertyFormValues>();
  const [isSearching, setIsSearching] = useState(false);

  // Auto-fetch saved project transport & nearby places if empty (only when a verified projectId exists, e.g. on edit mode or project selection)
  useEffect(() => {
    const projectId = form.getValues("project_id");
    const transits = form.getValues("nearby_transits") || [];
    const places = form.getValues("nearby_places") || [];

    if (projectId && transits.length === 0 && places.length === 0) {
      getExistingProjectLocationAction({
        projectId,
      }).then((res) => {
        if (res.success && res.data) {
          const { transits: fetchedTransits = [], places: fetchedPlaces = [] } = res.data;
          if (fetchedTransits.length > 0 || fetchedPlaces.length > 0) {
            form.setValue("nearby_transits", fetchedTransits, { shouldDirty: true, shouldTouch: true });
            form.setValue("nearby_places", fetchedPlaces, { shouldDirty: true, shouldTouch: true });
            toast.success("ดึงข้อมูลการเดินทางและสถานที่ใกล้เคียงจากโครงการเดิมสำเร็จ ✨");
          }
        }
      });
    }
  }, [form]);

  const handleAISearch = async () => {
    const address = form.getValues("address_line1");
    const province = form.getValues("province");
    const district = form.getValues("district");
    const subdistrict = form.getValues("subdistrict");
    const title = form.getValues("title");
    const googleMapsLink = form.getValues("google_maps_link");
    const projectId = form.getValues("project_id");

    if ((!province || !district) && !googleMapsLink) {
      toast.error("กรุณากรอกข้อมูลจังหวัดและอำเภอ/เขต หรือใส่ลิงก์ Google Maps ก่อนใช้ AI ค้นหาครับ");
      return;
    }

    setIsSearching(true);
    try {
      const res = await suggestNearbyPlacesAndTransitAction({
        title,
        addressLine1: address || undefined,
        province,
        district,
        subdistrict: subdistrict || undefined,
        googleMapsLink: googleMapsLink || undefined,
        projectId: projectId || undefined,
      });

      if (res.success && res.data) {
        const { transits = [], places = [] } = res.data;
        
        // Populate form
        form.setValue("nearby_transits", transits, { shouldDirty: true, shouldTouch: true });
        form.setValue("nearby_places", places, { shouldDirty: true, shouldTouch: true });
        
        if ((res as any).cached) {
          toast.success("ดึงข้อมูลการเดินทางและสถานที่ใกล้เคียงจากโครงการที่มีอยู่แล้วเรียบร้อย ✨");
        } else {
          toast.success("AI ค้นหาและกรอกข้อมูลการเดินทางและสถานที่ใกล้เคียงเรียบร้อยแล้ว ✨");
        }
      } else {
        toast.error((res as any).error || "เกิดข้อผิดพลาดในการค้นหา");
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      {/* Address Section */}
      <AddressSection />

      {/* AI Fill Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/30 to-blue-50/50 border border-blue-100/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-600 shrink-0">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">ค้นหาทำเล & การเดินทางอัตโนมัติด้วย AI</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
              ระบบจะใช้ชื่อโครงการ/ที่อยู่ จังหวัด และเขต เพื่อค้นหาสถานีรถไฟฟ้า (BTS/MRT) และสถานที่ใกล้เคียงที่แท้จริงให้โดยอัตโนมัติ
            </p>
          </div>
        </div>
        <Button
          type="button"
          disabled={isSearching}
          onClick={handleAISearch}
          className="w-full sm:w-auto h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-xl shrink-0 transition-all active:scale-[0.98] shadow-sm shadow-blue-200"
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              กำลังค้นหา...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              ค้นหาและกรอกข้อมูลด้วย AI
            </>
          )}
        </Button>
      </div>

      {/* Transportation & Nearby Places Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TransitSection />
        <NearbyPlacesSection />
      </div>
    </div>
  );
}

