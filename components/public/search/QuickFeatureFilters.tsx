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
  ];

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider delayDuration={100}>
        {features.map((f) => {
          const count = availableQuickFilters?.[f.key] || 0;
          const isDisabled = !f.state && count === 0;

          return (
            <Tooltip key={f.label}>
              <TooltipTrigger asChild>
                <button
                  disabled={isDisabled}
                  onClick={() => !isDisabled && f.setState(!f.state)}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all duration-200 font-medium text-sm relative",
                    f.state
                      ? `bg-${f.color}-600 border-${f.color}-600 text-white shadow-md shadow-${f.color}-500/20`
                      : isDisabled
                        ? "bg-slate-50 border-transparent text-slate-200 cursor-not-allowed opacity-50"
                        : `bg-white border-slate-100 text-slate-400 hover:border-${f.color}-200 hover:text-${f.color}-600`
                  )}
                >
                  <f.icon 
                    className={cn(
                      "transition-transform",
                      f.label === "near_train" ? "h-4 w-4" : 
                      f.label === "hot_deal" ? "h-4 w-4" :
                      f.label === "fully_furnished" ? "h-5 w-5" :
                      "h-[18px] w-[18px]",
                      f.state ? "text-white" : isDisabled ? "text-slate-200" : `text-${f.color}-500`
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
                  ? `bg-${f.color}-600 border-${f.color}-600 text-white` 
                  : `bg-${f.color}-50 border-${f.color}-200 text-${f.color}-700`}
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
