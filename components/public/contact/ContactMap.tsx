"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function ContactMap() {
  const { t } = useLanguage();
  return (
    <div>
      <Card className="overflow-hidden border-slate-100 bg-white shadow-lg shadow-slate-100/50 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 group">
        <CardContent className="p-0">
          <div className="bg-slate-50 h-[300px] flex items-center justify-center relative overflow-hidden">
            {/* Decorative background for placeholder */}
            <div className="absolute inset-0 bg-linear-to-br from-blue-50/50 to-transparent pointer-events-none" />

            <div className="text-center text-slate-500 relative z-10 transition-transform duration-500 group-hover:scale-105">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm transition-colors group-hover:bg-blue-100">
                <MapPin className="h-8 w-8 text-blue-500" />
              </div>
              <p className="font-semibold text-slate-800">
                {t("property_map.title")}
              </p>
              <p className="text-xs mt-1 text-slate-400 px-6">
                {t("property_map.open_google_maps")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
