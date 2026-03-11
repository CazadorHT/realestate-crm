"use client";

import { FaTrainSubway } from "react-icons/fa6";
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
  t,
}: QuickFeatureFiltersProps) {
  const features = [
    { state: nearTrain, setState: setNearTrain, icon: FaTrainSubway, label: "near_train", color: "blue" },
    { state: petFriendly, setState: setPetFriendly, icon: MdOutlinePets, label: "pet_allowed", color: "orange" },
    { state: fullyFurnished, setState: setFullyFurnished, icon: RiArmchairFill, label: "fully_furnished", color: "emerald" },
    { state: isForeigner, setState: setIsForeigner, icon: GiEarthAmerica, label: "foreigner", color: "purple" },
    { state: companyRegistered, setState: setCompanyRegistered, icon: MdWork, label: "company_registered", color: "indigo" },
    { state: isHotDeal, setState: setIsHotDeal, icon: FaFire, label: "hot_deal", color: "rose" },
  ];

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider delayDuration={100}>
        {features.map((f) => (
          <Tooltip key={f.label}>
            <TooltipTrigger asChild>
              <button
                onClick={() => f.setState(!f.state)}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all duration-200 font-medium text-sm",
                  f.state
                    ? `bg-${f.color}-600 border-${f.color}-600 text-white shadow-md shadow-${f.color}-500/20`
                    : `bg-white border-slate-100 text-slate-400 hover:border-${f.color}-200 hover:text-${f.color}-600`
                )}
              >
                <f.icon 
                  className={cn(
                    "transition-transform",
                    f.label === "near_train" ? "h-5 w-5" : 
                    f.label === "hot_deal" ? "h-[22px] w-[22px]" :
                    f.label === "fully_furnished" ? "h-6 w-6" :
                    "h-[22px] w-[22px]"
                  )} 
                />
              </button>
            </TooltipTrigger>
            <TooltipContent
              className={f.state 
                ? `bg-${f.color}-600 border-${f.color}-600 text-white` 
                : `bg-${f.color}-50 border-${f.color}-200 text-${f.color}-700`}
            >
              {t(`search.${f.label}`)}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
