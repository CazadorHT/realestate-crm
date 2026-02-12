"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  Box,
  Shield,
  Sparkles,
  Armchair,
  Utensils,
  Bath,
  Trees,
  Wifi,
  Dumbbell,
  MapPin,
  MoreHorizontal,
  Baby, // Kids
  ConciergeBell, // Services
} from "lucide-react";
import { FeaturesManagementDialog } from "@/features/amenities/components/FeaturesManagementDialog";
import { PropertyFormValues } from "../../schema";
import { DynamicIcon } from "@/components/dynamic-icon";
import { cn } from "@/lib/utils";

type Feature = {
  id: string;
  name: string;
  icon_key: string;
  category: string | null;
};

const CATEGORY_ICONS: Record<string, any> = {
  "ความปลอดภัย (Security)": Shield,
  "ความสะดวกสบาย (Comfort)": Armchair,
  "ครัว (Kitchen)": Utensils,
  "ห้องน้ำ (Bathroom)": Bath,
  "ภายนอก (Exterior)": Trees,
  "เทคโนโลยี (Tech)": Wifi,
  "สันทนาการ (Recreation)": Dumbbell,
  "สถานที่ใกล้เคียง (Nearby)": MapPin,
  "ทั่วไป (General)": Box,
  "อื่นๆ (Other)": MoreHorizontal,
  "สำหรับเด็ก (Kids)": Baby,
  "บริการ (Services)": ConciergeBell,
};

const CATEGORY_MAPPING: Record<string, string> = {
  EXTERIOR: "ภายนอก (Exterior)",
  INTERIOR: "ภายใน (Interior)",
  FACILITIES: "ความสะดวกสบาย (Comfort)",
  COMFORT: "ความสะดวกสบาย (Comfort)",
  GENERAL: "ทั่วไป (General)",
  SECURITY: "ความปลอดภัย (Security)",
  KITCHEN: "ครัว (Kitchen)",
  BATHROOM: "ห้องน้ำ (Bathroom)",
  TECH: "เทคโนโลยี (Tech)",
  TECHNOLOGY: "เทคโนโลยี (Tech)",
  RECREATION: "สันทนาการ (Recreation)",
  NEARBY: "สถานที่ใกล้เคียง (Nearby)",
  OTHER: "อื่นๆ (Other)",
  KIDS: "สำหรับเด็ก (Kids)",
  SERVICES: "บริการ (Services)",
};

export const Step5Features = React.memo(Step5FeaturesComponent);
function Step5FeaturesComponent() {
  const { watch, setValue } = useFormContext<PropertyFormValues>();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  // Load existing selections
  const selectedFeatureIds = watch("feature_ids") || [];

  useEffect(() => {
    async function loadFeatures() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("features")
          .select("*")
          .order("category", { ascending: true })
          .order("name", { ascending: true });

        if (error) throw error;
        setFeatures(data || []);
      } catch (err) {
        console.error("Error loading features:", err);
      } finally {
        setLoading(false);
      }
    }

    loadFeatures();
  }, []); // Initial load

  const reloadFeatures = async () => {
    // Manually reload features called by Dialog callback
    // Don't set loading(true) here to avoid unmounting the Dialog
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("features")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setFeatures(data || []);
    } catch (err) {
      console.error("Error reloading features:", err);
    }
  };

  const toggleFeature = (featureId: string) => {
    const current = new Set(selectedFeatureIds);
    if (current.has(featureId)) {
      current.delete(featureId);
    } else {
      current.add(featureId);
    }
    setValue("feature_ids", Array.from(current), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Group by category
  const groupedFeatures = features.reduce(
    (acc, feature) => {
      // Normalize category key
      const rawCat = feature.category || "General";
      const upperCat = rawCat.toUpperCase();
      // Try to find a mapped Thai Name, otherwise use raw
      const cat = CATEGORY_MAPPING[upperCat] || rawCat;

      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(feature);
      return acc;
    },
    {} as Record<string, Feature[]>,
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="bg-blue-50/50 p-4 sm:p-5 rounded-2xl border border-blue-100 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-blue-900 leading-tight">
                สิ่งอำนวยความสะดวก
              </h3>
              <p className="text-[10px] sm:text-xs text-blue-700/70 font-medium">
                เลือกสิ่งอำนวยความสะดวกที่ทรัพย์สินนี้มี
              </p>
            </div>
          </div>
          <div className="w-full sm:w-auto self-end sm:self-center">
            <FeaturesManagementDialog onUpdate={reloadFeatures} />
          </div>
        </div>
      </div>

      {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => {
        const CategoryIcon = CATEGORY_ICONS[category] || Box;
        return (
          <div key={category} className="space-y-3 sm:space-y-4">
            <h4 className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2 sm:pb-3">
              <CategoryIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
              {category}
              <span className="ml-auto text-[9px] font-normal text-slate-400 lowercase">
                {categoryFeatures.length} items
              </span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 sm:gap-4">
              {categoryFeatures.map((feature) => {
                const isSelected = selectedFeatureIds.includes(feature.id);

                return (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => toggleFeature(feature.id)}
                    className={cn(
                      "relative flex flex-row lg:flex-col items-center gap-2.5 sm:gap-3 p-2.5 sm:p-4 rounded-xl border text-left lg:text-center transition-all duration-200 group",
                      isSelected
                        ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-sm"
                        : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md hover:bg-slate-50/50",
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 sm:p-2.5 rounded-lg transition-colors shrink-0",
                        isSelected
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-emerald-500",
                      )}
                    >
                      <DynamicIcon
                        name={feature.icon_key}
                        className="w-4 h-4 sm:w-5 sm:h-5"
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[11px] sm:text-xs font-semibold line-clamp-2 transition-colors",
                        isSelected
                          ? "text-emerald-900"
                          : "text-slate-600 group-hover:text-slate-900",
                      )}
                    >
                      {feature.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-in zoom-in" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {features.length === 0 && (
        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
          <Box className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>ไม่พบรายการในระบบ</p>
        </div>
      )}
    </div>
  );
}
