"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MdMapsHomeWork } from "react-icons/md";
import { PropertyCard, PropertyCardProps } from "./PropertyCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { 
  PropertyType 
} from "@/features/properties/types";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { updateAIScore } from "@/lib/analytics-utils";

interface SimilarPropertiesClientProps {
  properties: PropertyCardProps[];
  propertyType: PropertyType;
  compareData?: {
    price: number | null;
    size: number | null;
    date: string | null;
  };
}

export function SimilarPropertiesClient({
  properties,
  propertyType,
  compareData,
}: SimilarPropertiesClientProps) {
  const { t } = useLanguage();

  return (
    <section className="py-8 md:py-12 border-t border-slate-100">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-lg md:text-xl border-l-4 border-blue-600 bg-linear-to-r from-blue-50 to-white px-4 py-3 rounded-r-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <MdMapsHomeWork className="w-5 h-5 text-blue-600" />{" "}
            {t("similar_properties.title")}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {t("similar_properties.subtitle")}
          </p>
        </div>
        <Link
          href={`/properties?type=${propertyType}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 group self-start md:self-auto"
        >
          {t("similar_properties.view_all")}{" "}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2  lg:grid-cols-4 gap-4 md:gap-6">
        {properties.map((property) => {
          return (
            <div 
              key={property.id} 
              className="min-w-0 "
              onClick={() => {
                try {
                  pushToDataLayer(GTM_EVENTS.CLICK_SIMILAR_PROPERTY, {
                    item_id: property.id,
                    item_name: property.title,
                  });
                  updateAIScore(15);
                } catch (e) {}
              }}
            >
              <PropertyCard
                property={property}
                compareWith={compareData}
                footerVariant="minimal"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
