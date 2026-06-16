"use client";

import { FaTrainSubway, FaAirbnb } from "react-icons/fa6";
import { MdOutlinePets, MdWork } from "react-icons/md";
import { RiArmchairFill } from "react-icons/ri";
import { GiEarthAmerica } from "react-icons/gi";
import { FaFire } from "react-icons/fa6";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface QuickFeatureFiltersProps {
  nearTrain: boolean;
  setNearTrain: (v: boolean) => void;
  petFriendly: boolean;
  setPetFriendly: (v: boolean) => void;
  fullyFurnished: boolean;
  setFullyFurnished: (v: boolean) => void;
  isForeigner: boolean;
  setIsForeigner: (v: boolean) => void;
  companyRegistered: boolean;
  setCompanyRegistered: (v: boolean) => void;
  isHotDeal: boolean;
  setIsHotDeal: (v: boolean) => void;
  allowAirbnb: boolean;
  setAllowAirbnb: (v: boolean) => void;
  availableQuickFilters: Record<string, number>;
  t: (key: string) => string;
}

export function QuickFeatureFilters({
  nearTrain,
  setNearTrain,
  petFriendly,
  setPetFriendly,
  fullyFurnished,
  setFullyFurnished,
  isForeigner,
  setIsForeigner,
  companyRegistered,
  setCompanyRegistered,
  isHotDeal,
  setIsHotDeal,
  allowAirbnb,
  setAllowAirbnb,
  availableQuickFilters,
  t,
}: QuickFeatureFiltersProps) {
  const features = [
    { key: "nearTrain", state: nearTrain, setState: setNearTrain, icon: FaTrainSubway, label: "near_train", color: "blue" },
    { key: "petFriendly", state: petFriendly, setState: setPetFriendly, icon: MdOutlinePets, label: "pet_allowed", color: "orange" },
    { key: "fullyFurnished", state: fullyFurnished, setState: setFullyFurnished, icon: RiArmchairFill, label: "fully_furnished", color: "emerald" },
    { key: "isForeigner", state: isForeigner, setState: setIsForeigner, icon: GiEarthAmerica, label: "foreigner", color: "purple" },
    { key: "companyRegistered", state: companyRegistered, setState: setCompanyRegistered, icon: MdWork, label: "company_registered", color: "indigo" },
    { key: "isHotDeal", state: isHotDeal, setState: setIsHotDeal, icon: FaFire, label: "hot_deal", color: "rose" },
    { key: "allowAirbnb", state: allowAirbnb, setState: setAllowAirbnb, icon: FaAirbnb, label: "allow_airbnb", color: "pink" },
  ];

  const colorMap: Record<string, { activeBg: string; activeBorder: string; activeShadow: string; hoverBorder: string; hoverText: string; iconStateColor: string; tooltipActive: string; tooltipInactive: string }> = {
    blue: {
      activeBg: "bg-blue-600",
      activeBorder: "border-blue-600",
      activeShadow: "shadow-blue-500/20",
      hoverBorder: "hover:border-blue-200",
      hoverText: "hover:text-blue-600",
      iconStateColor: "text-blue-500",
      tooltipActive: "bg-blue-600 border-blue-600 text-white",
      tooltipInactive: "bg-blue-50 border-blue-200 text-blue-700",
    },
    orange: {
      activeBg: "bg-orange-600",
      activeBorder: "border-orange-600",
      activeShadow: "shadow-orange-500/20",
      hoverBorder: "hover:border-orange-200",
      hoverText: "hover:text-orange-600",
      iconStateColor: "text-orange-500",
      tooltipActive: "bg-orange-600 border-orange-600 text-white",
      tooltipInactive: "bg-orange-50 border-orange-200 text-orange-700",
    },
    emerald: {
      activeBg: "bg-emerald-600",
      activeBorder: "border-emerald-600",
      activeShadow: "shadow-emerald-500/20",
      hoverBorder: "hover:border-emerald-200",
      hoverText: "hover:text-emerald-600",
      iconStateColor: "text-emerald-500",
      tooltipActive: "bg-emerald-600 border-emerald-600 text-white",
      tooltipInactive: "bg-emerald-50 border-emerald-200 text-emerald-700",
    },
    purple: {
      activeBg: "bg-purple-600",
      activeBorder: "border-purple-600",
      activeShadow: "shadow-purple-500/20",
      hoverBorder: "hover:border-purple-200",
      hoverText: "hover:text-purple-600",
      iconStateColor: "text-purple-500",
      tooltipActive: "bg-purple-600 border-purple-600 text-white",
      tooltipInactive: "bg-purple-50 border-purple-200 text-purple-700",
    },
    indigo: {
      activeBg: "bg-indigo-600",
      activeBorder: "border-indigo-600",
      activeShadow: "shadow-indigo-500/20",
      hoverBorder: "hover:border-indigo-200",
      hoverText: "hover:text-indigo-600",
      iconStateColor: "text-indigo-500",
      tooltipActive: "bg-indigo-600 border-indigo-600 text-white",
      tooltipInactive: "bg-indigo-50 border-indigo-200 text-indigo-700",
    },
    rose: {
      activeBg: "bg-rose-600",
      activeBorder: "border-rose-600",
      activeShadow: "shadow-rose-500/20",
      hoverBorder: "hover:border-rose-200",
      hoverText: "hover:text-rose-600",
      iconStateColor: "text-rose-500",
      tooltipActive: "bg-rose-600 border-rose-600 text-white",
      tooltipInactive: "bg-rose-50 border-rose-200 text-rose-700",
    },
    pink: {
      activeBg: "bg-[#FF5A5F]",
      activeBorder: "border-[#FF5A5F]",
      activeShadow: "shadow-pink-500/20",
      hoverBorder: "hover:border-pink-200",
      hoverText: "hover:text-[#FF5A5F]",
      iconStateColor: "text-[#FF5A5F]",
      tooltipActive: "bg-[#FF5A5F] border-[#FF5A5F] text-white",
      tooltipInactive: "bg-pink-50 border-pink-200 text-pink-700",
    },
  };

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider delayDuration={100}>
        {features.map((f) => {
          const count = availableQuickFilters?.[f.key] || 0;
          const isDisabled = !f.state && count === 0;
          const colors = colorMap[f.color] || colorMap.blue;
 
          return (
            <Tooltip key={f.label}>
              <TooltipTrigger asChild>
                <button
                  disabled={isDisabled}
                  onClick={() => f.setState(!f.state)}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all duration-200 font-medium text-sm relative",
                    f.state
                      ? `${colors.activeBg} ${colors.activeBorder} text-white shadow-md ${colors.activeShadow}`
                      : isDisabled
                      ? "bg-slate-50 border-slate-100 text-slate-200 cursor-not-allowed"
                      : `bg-white border-slate-100 text-slate-400 ${colors.hoverBorder} ${colors.hoverText}`
                  )}
                >
                  <f.icon 
                    className={cn(
                      "transition-transform",
                      f.label === "near_train" ? "h-4 w-4" : 
                      f.label === "hot_deal" ? "h-4 w-4" :
                      f.label === "fully_furnished" ? "h-5 w-5" :
                      "h-[18px] w-[18px]",
                      f.state ? "text-white" : isDisabled ? "text-slate-200" : colors.iconStateColor
                    )} 
                  />
                  {!isDisabled && count > 0 && !f.state && (
                    <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-emerald-500 text-white px-1 py-0.5 rounded-full shadow-sm">
                      {count}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent
                className={f.state 
                  ? colors.tooltipActive 
                  : colors.tooltipInactive}
              >
                {t(`search.${f.label}`)} {count > 0 ? `(${count})` : ""}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}
