"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { searchPropertiesAction } from "@/features/smart-match/actions";
import {
  getSmartMatchConfig,
  type BudgetRange,
  type PropertyTypeOption,
  type SmartMatchSettings,
  type OfficeSizeOption,
} from "@/features/smart-match/config-actions";
import {
  checkOfficeSizeAvailability,
  checkBudgetAvailability,
  checkLocationAvailability,
  checkPurposeAvailability,
  checkPropertyTypeAvailability,
  checkTransitAvailability,
} from "@/features/smart-match/inventory-actions";
import {
  PropertyMatch,
  SearchPurpose,
  PropertyType,
} from "@/features/smart-match/types";
import {
  DEFAULT_BUY_RANGES,
  DEFAULT_RENT_RANGES,
  DEFAULT_SETTINGS,
} from "@/components/public/smart-match/constants";

export type QuizStep = 1 | 1.5 | 1.7 | 2 | 2.5 | 3 | 4 | 9;

export function useSmartMatchWizard() {
  let languageContext;
  try {
    languageContext = useLanguage();
  } catch (e) {
    // Fallback for SSR or if used outside provider (though it should be inside)
    languageContext = {
      t: (k: string) => k,
      language: "th" as const,
      setLanguage: () => {},
    };
  }
  const { t } = languageContext;

  const [step, setStep] = useState<QuizStep>(1);
  const [purpose, setPurpose] = useState<SearchPurpose>("BUY");
  const [selectedBudget, setSelectedBudget] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const [propertyType, setPropertyType] = useState<PropertyType | null>(null);
  const [officeSize, setOfficeSize] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const [area, setArea] = useState("");
  const [nearTransit, setNearTransit] = useState<boolean | null>(null);
  const [matches, setMatches] = useState<PropertyMatch[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [isOfficeMode, setIsOfficeMode] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);

  // Initial data from constants (Source of Truth)
  const [buyBudgetRanges, setBuyBudgetRanges] =
    useState<BudgetRange[]>(DEFAULT_BUY_RANGES);
  const [rentBudgetRanges, setRentBudgetRanges] =
    useState<BudgetRange[]>(DEFAULT_RENT_RANGES);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeOption[]>([]);
  const [officeSizes, setOfficeSizes] = useState<OfficeSizeOption[]>([]);
  const [settings, setSettings] =
    useState<SmartMatchSettings>(DEFAULT_SETTINGS);
  const [popularAreas, setPopularAreas] = useState<
    { name: string; name_en?: string | null; name_cn?: string | null }[]
  >([]);
  const [availableLocations, setAvailableLocations] = useState<
    { name: string; name_en?: string | null; name_cn?: string | null }[]
  >([]);
  const [availablePropertyTypes, setAvailablePropertyTypes] = useState<
    string[]
  >([]);
  const [availableSizes, setAvailableSizes] = useState<Record<string, number>>(
    {},
  );
  const [availableBudgetIds, setAvailableBudgetIds] = useState<string[]>([]);
  const [availableTransitOptions, setAvailableTransitOptions] = useState<
    string[]
  >([]);
  const [availablePurposes, setAvailablePurposes] = useState<string[]>([]);

  // Load property type availability based on purpose
  useEffect(() => {
    if (step === 1.5) {
      setIsInventoryLoading(true);
      checkPropertyTypeAvailability(purpose as "RENT" | "BUY")
        .then(setAvailablePropertyTypes)
        .catch(console.error)
        .finally(() => setIsInventoryLoading(false));
    }
  }, [step, purpose]);

  // Load transit availability when entering transit step (2.5)
  useEffect(() => {
    if (step === 2.5) {
      setIsInventoryLoading(true);
      checkTransitAvailability(purpose as "RENT" | "BUY", {
        propertyType: propertyType || undefined,
        officeSize: officeSize || undefined,
        budget: selectedBudget || undefined,
      })
        .then(setAvailableTransitOptions)
        .catch(console.error)
        .finally(() => setIsInventoryLoading(false));
    }
  }, [step, purpose, propertyType, officeSize, selectedBudget]);

  // Load inventory for office sizes
  useEffect(() => {
    if (isOfficeMode && step === 1.7) {
      setIsInventoryLoading(true);
      checkOfficeSizeAvailability(purpose as "RENT" | "BUY")
        .then((res) => {
          const map: Record<string, number> = {};
          res.forEach((r) => (map[r.size] = r.count));
          setAvailableSizes(map);
        })
        .catch(console.error)
        .finally(() => setIsInventoryLoading(false));
    }
  }, [isOfficeMode, step, purpose]);

  // Load inventory for budgets
  useEffect(() => {
    if (step === 2) {
      setIsInventoryLoading(true);
      const ranges = purpose === "RENT" ? rentBudgetRanges : buyBudgetRanges;
      const budgetOptions =
        ranges.length > 0
          ? ranges
          : purpose === "RENT"
            ? DEFAULT_RENT_RANGES
            : DEFAULT_BUY_RANGES;

      checkBudgetAvailability(purpose as "RENT" | "BUY", {
        propertyType: propertyType || undefined,
        officeSize: officeSize || undefined,
        budgetRanges: budgetOptions.map((r: any) => ({
          id: r.id,
          min: r.min_value,
          max: r.max_value,
        })),
      })
        .then(setAvailableBudgetIds)
        .catch(console.error)
        .finally(() => setIsInventoryLoading(false));
    }
  }, [
    step,
    purpose,
    propertyType,
    officeSize,
    rentBudgetRanges,
    buyBudgetRanges,
  ]);

  // Load inventory for locations
  useEffect(() => {
    if (step === 3 || step === 2.5) {
      setIsInventoryLoading(true);
      checkLocationAvailability(purpose as "RENT" | "BUY", {
        propertyType: propertyType || undefined,
        officeSize: officeSize || undefined,
        budget: selectedBudget || undefined,
        nearTransit: nearTransit === null ? undefined : nearTransit,
      })
        .then((result) => {
          // Map strings back to objects
          const areaObjects = result.map((name) => {
            const existing = popularAreas.find((a) => a.name === name);
            return existing || { name, name_en: name, name_cn: name };
          });
          setAvailableLocations(areaObjects);
        })
        .catch(console.error)
        .finally(() => setIsInventoryLoading(false));
    }
  }, [
    step,
    purpose,
    propertyType,
    officeSize,
    selectedBudget,
    nearTransit,
    popularAreas,
  ]);

  // Load config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await getSmartMatchConfig();

        // If DB has custom ranges, we use them, but we prioritize the new default values
        // for standard IDs (rent_1, buy_1, etc.) as requested by user
        if (config.buyBudgetRanges.length > 0) {
          setBuyBudgetRanges((prev) => {
            const dbMap = new Map(config.buyBudgetRanges.map((r) => [r.id, r]));
            return prev.map((p) => {
              const dbItem = dbMap.get(p.id);
              if (dbItem) {
                // Keep default label/min/max but use DB's sort/active status
                return {
                  ...p,
                  sort_order: dbItem.sort_order,
                  is_active: dbItem.is_active,
                };
              }
              return p;
            });
          });
        }

        if (config.rentBudgetRanges.length > 0) {
          setRentBudgetRanges((prev) => {
            const dbMap = new Map(
              config.rentBudgetRanges.map((r) => [r.id, r]),
            );
            return prev.map((p) => {
              const dbItem = dbMap.get(p.id);
              if (dbItem) {
                return {
                  ...p,
                  sort_order: dbItem.sort_order,
                  is_active: dbItem.is_active,
                };
              }
              return p;
            });
          });
        }

        setPropertyTypes(config.propertyTypes);
        setOfficeSizes(config.officeSizes || []);
        setSettings(config.settings);
      } catch (e) {
        console.error("Failed to load SmartMatch config:", e);
      } finally {
        setConfigLoading(false);
      }
    }
    loadConfig();
  }, []);

  // Initial Load for step 1 purpose availability
  useEffect(() => {
    if (step === 1) {
      setIsInventoryLoading(true);
      checkPurposeAvailability()
        .then(setAvailablePurposes)
        .catch(console.error)
        .finally(() => setIsInventoryLoading(false));
    }
  }, [step]);

  // Load Popular Areas
  useEffect(() => {
    async function loadAreas() {
      try {
        const { getPopularAreasAction } =
          await import("@/features/properties/actions");
        const data = await getPopularAreasAction();
        if (data.length > 0) {
          setPopularAreas(data as any);
        } else {
          setPopularAreas([
            { name: "อ่อนนุช", name_en: "On Nut", name_cn: "On Nut" },
            { name: "บางนา", name_en: "Bang Na", name_cn: "Bang Na" },
            { name: "ลาดพร้าว", name_en: "Lat Phrao", name_cn: "Lat Phrao" },
            { name: "พระราม 9", name_en: "Rama 9", name_cn: "Rama 9" },
          ]);
        }
      } catch (e) {
        setPopularAreas([
          { name: "อ่อนนุช", name_en: "On Nut", name_cn: "On Nut" },
          { name: "บางนา", name_en: "Bang Na", name_cn: "Bang Na" },
          { name: "ลาดพร้าว", name_en: "Lat Phrao", name_cn: "Lat Phrao" },
          { name: "พระราม 9", name_en: "Rama 9", name_cn: "Rama 9" },
        ]);
      }
    }
    loadAreas();
  }, []);

  const handleBack = () => {
    if (step === 1.5) setStep(1);
    else if (step === 2) setStep(1.5);
    else if (step === 2.5) setStep(2);
    else if (step === 3)
      settings.transit_question_enabled ? setStep(2.5) : setStep(2);
    else if (step === 1.7) setStep(1);
  };

  const currentStepIndex =
    step === 1
      ? 0
      : step === 1.5 || step === 1.7
        ? 1
        : step === 2
          ? 2
          : step === 2.5
            ? 3
            : step === 3
              ? 4
              : 5;
  const totalSteps = isOfficeMode
    ? 4
    : settings.transit_question_enabled
      ? 5
      : 4;

  const handleSearch = async () => {
    setStep(4);
    const min = selectedBudget?.min || 0;
    const max = selectedBudget?.max || 1000000000;

    try {
      const results = await searchPropertiesAction({
        purpose,
        budgetMin: min,
        budgetMax: max,
        area,
        nearTransit: nearTransit === null ? undefined : nearTransit,
        propertyType:
          propertyType || (isOfficeMode ? "OFFICE_BUILDING" : undefined),
        language: languageContext.language,
      });

      setSessionId(results.sessionId || "");
      setMatches(results.matches);

      setTimeout(() => setStep(9), 1500);
    } catch (error) {
      toast.error(t("smart_match.search_error"));
      setStep(1);
    }
  };

  const reset = () => {
    setStep(1);
    setMatches([]);
    setOfficeSize(null);
    setSelectedBudget(null);
    setPropertyType(null);
    setIsOfficeMode(false);
  };

  return {
    step,
    setStep,
    purpose,
    setPurpose,
    selectedBudget,
    setSelectedBudget,
    area,
    setArea,
    sessionId,
    matches,
    popularAreas,
    nearTransit,
    setNearTransit,
    propertyType,
    setPropertyType,
    isOfficeMode,
    setIsOfficeMode,
    officeSize,
    setOfficeSize,
    configLoading,
    buyBudgetRanges,
    rentBudgetRanges,
    propertyTypes,
    officeSizes,
    settings,
    availablePurposes,
    availablePropertyTypes,
    availableSizes,
    availableBudgetIds,
    availableTransitOptions,
    availableLocations,
    handleBack,
    handleSearch,
    reset,
    currentStepIndex,
    totalSteps,
    isInventoryLoading,
  };
}
