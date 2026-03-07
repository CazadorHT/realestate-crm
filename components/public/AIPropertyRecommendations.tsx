"use client";

import { useEffect, useState } from "react";
import { getPreferredCategory } from "@/lib/analytics-utils";
import { PropertyCard } from "@/components/public/PropertyCard";
import { Sparkles } from "lucide-react";

export function AIPropertyRecommendations() {
  const [recommended, setRecommended] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      const category = getPreferredCategory();
      if (!category) {
        setLoading(false);
        return;
      }

      try {
        // Fetch recommendations via a proxy or server action
        // For simplicity, we'll use a dynamic import of a server action if possible, 
        // or just fetch from an API route if we had one.
        // Let's assume we have a server action for this.
        const { getRecommendedPropertiesAction } = await import("@/features/properties/actions");
        const data = await getRecommendedPropertiesAction(category);
        setRecommended(data);
      } catch (error) {
        console.error("Failed to fetch AI recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading || recommended.length === 0) return null;

  return (
    <section className="py-12 bg-indigo-50/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Recommended for You</h2>
            <p className="text-slate-500">ทรัพย์ที่ AI คัดสรรมาให้ตามความสนใจของคุณ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommended.map((property) => (
            <PropertyCard 
              key={property.id} 
              property={{
                ...property,
                image_url: property.cover_image
              }} 
            />
          ))}
        </div>
      </div>
    </section>
  );
}
