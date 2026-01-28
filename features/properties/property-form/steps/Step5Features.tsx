"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Box } from "lucide-react";
import { ICON_MAP, DEFAULT_ICON } from "../../../amenities/icons";
import { FeaturesManagementDialog } from "@/features/amenities/components/FeaturesManagementDialog";
import { PropertyFormValues } from "../../schema";

type Feature = {
  id: string;
  name: string;
  icon_key: string;
  category: string | null;
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
    setLoading(true);
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
    } finally {
      setLoading(false);
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
      const cat = feature.category || "General";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(feature);
      return acc;
    },
    {} as Record<string, Feature[]>,
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-1">
              สิ่งอำนวยความสะดวก
            </h3>
            <p className="text-sm text-blue-700">
              เลือกสิ่งอำนวยความสะดวกที่ทรัพย์สินนี้มี
            </p>
          </div>
          <FeaturesManagementDialog onUpdate={reloadFeatures} />
        </div>
      </div>

      {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
        <div key={category} className="space-y-3">
          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">
            {category}
          </h4>
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {categoryFeatures.map((feature) => {
              const Icon = ICON_MAP[feature.icon_key] || DEFAULT_ICON;
              const isSelected = selectedFeatureIds.includes(feature.id);

              return (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => toggleFeature(feature.id)}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 group
                    ${
                      isSelected
                        ? "bg-linear-to-r from-blue-500 to-purple-600  text-white shadow-md transform scale-[1.02]"
                        : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                    }
                  `}
                >
                  <div
                    className={`
                    p-2 rounded-lg transition-colors
                    ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-blue-500"
                    }
                  `}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? "text-white" : "text-slate-700"
                    }`}
                  >
                    {feature.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {features.length === 0 && (
        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
          <Box className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>ไม่พบรายการในระบบ</p>
        </div>
      )}
    </div>
  );
}
