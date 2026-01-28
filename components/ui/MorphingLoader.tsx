"use client";

import { useEffect, useState } from "react";
import {
  Home,
  Building,
  Building2,
  Warehouse,
  MapPin,
  Key,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MorphingLoader({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);

  const icons = [
    { icon: Home, color: "text-blue-500" },
    { icon: Building, color: "text-indigo-500" },
    { icon: Key, color: "text-violet-500" },
    { icon: MapPin, color: "text-emerald-500" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % icons.length);
    }, 300);
    return () => clearInterval(interval);
  }, [icons.length]);

  const CurrentIcon = icons[index].icon;
  const currentColor = icons[index].color;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[400px] w-full",
        className,
      )}
    >
      <div className="relative flex items-center justify-center h-24 w-24">
        {/* Pulsing Rings */}
        <div className="absolute inset-0 rounded-full border-4 border-slate-100 opacity-20 animate-ping" />
        <div className="absolute inset-0 rounded-full border-4 border-slate-100" />

        {/* Gradient Background */}
        <div className="absolute inset-2 rounded-full bg-linear-to-tr from-slate-50 to-white shadow-sm flex items-center justify-center overflow-hidden">
          <CurrentIcon
            className={cn(
              "h-10 w-10 transition-all duration-500 transform",
              currentColor,
              "animate-in zoom-in-50 fade-in-0 slide-in-from-bottom-2",
            )}
            key={index} // Force re-render for animation
          />
        </div>
      </div>

      <div className="mt-8 text-center space-y-2">
        <h3 className="text-lg font-semibold text-slate-900 animate-pulse">
          กำลังค้นหาบ้านในฝัน...
        </h3>
        <p className="text-slate-400 text-sm">
          PropertyHub - แหล่งรวมอสังหาฯ คุณภาพ
        </p>
      </div>
    </div>
  );
}
