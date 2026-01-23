import { Check, Star } from "lucide-react";

interface KeySellingPointsProps {
  points?: string[];
  listingType: "SALE" | "RENT" | "SALE_AND_RENT";
}

export function KeySellingPoints({
  points = [],
  listingType,
}: KeySellingPointsProps) {
  // Default points if none provided (Fallbacks for now)
  const defaultPoints = [
    "ทำเลศักยภาพ เดินทางสะดวก",
    "ตกแต่งครบ พร้อมเข้าอยู่",
    "เหมาะสำหรับทุกคนในครอบครัว",
  ];

  const displayPoints = points.length > 0 ? points : defaultPoints;

  return (
    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 my-4">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
        <h3 className="font-semibold text-slate-800">จุดเด่นทรัพย์นี้</h3>
      </div>
      <div className="flex flex-col sm:flex-row flex-wrap gap-x-6 gap-y-2">
        {displayPoints.map((point, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-slate-700 text-sm"
          >
            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>{point}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
