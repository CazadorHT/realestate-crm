"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { useSmartMatchWizard } from "@/features/smart-match/hooks/useSmartMatchWizard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { type PropertyType } from "@/features/smart-match/types";

// Layout & UI Components
import { WizardHeader } from "./smart-match/layout/WizardHeader";
import { WizardFooter } from "./smart-match/layout/WizardFooter";
import { QuizQuestion } from "./smart-match/QuizQuestion";
import { LoadingState } from "./smart-match/LoadingState";
import { OfficeSizeStep } from "./smart-match/OfficeSizeStep";
import { ResultsContainer } from "./smart-match/ResultsContainer";

// Constants
import {
  DEFAULT_RENT_RANGES,
  DEFAULT_BUY_RANGES,
  DEFAULT_PROPERTY_TYPES,
} from "./smart-match/constants";

export function SmartMatchWizard() {
  const { t, language } = useLanguage();
  const {
    step,
    setStep,
    purpose,
    setPurpose,
    setSelectedBudget,
    setArea,
    sessionId,
    matches,
    popularAreas,
    setNearTransit,
    propertyType,
    setPropertyType,
    isOfficeMode,
    setIsOfficeMode,
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
  } = useSmartMatchWizard();

  // Helpers derived from state
  const currentBudgetRanges =
    purpose === "RENT"
      ? rentBudgetRanges.length > 0
        ? rentBudgetRanges
        : DEFAULT_RENT_RANGES
      : buyBudgetRanges.length > 0
        ? buyBudgetRanges
        : DEFAULT_BUY_RANGES;

  // Combine DB types with default constants to ensure all types appear
  // We prioritize DB types to respect their settings (is_active, sort_order)
  const combinedPropertyTypes = React.useMemo(() => {
    if (isOfficeMode) return [];

    // Create a map of DB types by value
    const dbMap = new Map(propertyTypes.map((t) => [t.value, t]));

    // Start with all defaults
    const combined = DEFAULT_PROPERTY_TYPES.map((def) => {
      const dbMatch = dbMap.get(def.value);
      if (dbMatch) {
        return {
          ...def,
          ...dbMatch,
          // Ensure we use the localized labels from translations if possible
          // but fallback to DB label if specifically set there
        };
      }
      return {
        ...def,
        id: def.value,
        is_active: true,
        sort_order: 999,
      };
    });

    return combined;
  }, [propertyTypes, isOfficeMode]);

  const currentPropertyTypes = isOfficeMode
    ? [
        {
          label: `🏢 ${t("home.property_types.office")}`,
          value: "OFFICE_BUILDING",
        },
      ]
    : combinedPropertyTypes;

  if (configLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 md:p-8 border border-slate-100 h-[450px] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-sm text-slate-500">{t("smart_match.loading")}</p>
      </div>
    );
  }

  const purposeOptions = [
    { label: t("smart_match.purpose_rent"), value: "RENT" },
    { label: t("smart_match.purpose_office"), value: "OFFICE" },
    { label: t("smart_match.purpose_buy"), value: "BUY" },
    { label: t("smart_match.purpose_invest"), value: "INVEST" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 md:p-8 border border-slate-100 h-[450px] flex flex-col ">
      {step < 9 ? (
        <>
          <WizardHeader
            step={step}
            totalSteps={totalSteps}
            currentStepIndex={currentStepIndex}
            onBack={handleBack}
          />

          <div className="relative flex-1 flex flex-col pt-5 min-h-0 ">
            {step === 1 && (
              <QuizQuestion
                title={t("smart_match.purpose_q")}
                options={purposeOptions.map((o) => o.label)}
                availableOptions={purposeOptions
                  .filter((o) => {
                    if (o.value === "OFFICE")
                      return (
                        availablePropertyTypes.includes("OFFICE_BUILDING") ||
                        availablePurposes.includes("RENT")
                      );
                    // Fallback: if purpose is available
                    return (
                      availablePurposes.length === 0 ||
                      availablePurposes.includes(o.value)
                    );
                  })
                  .map((o) => o.label)}
                onSelect={(val) => {
                  const selected = purposeOptions.find((o) => o.label === val);
                  if (selected?.value === "OFFICE") {
                    setPurpose("RENT");
                    setIsOfficeMode(true);
                    setPropertyType("OFFICE_BUILDING");
                    setStep(1.7);
                  } else {
                    setPurpose((selected?.value as any) || "BUY");
                    setIsOfficeMode(false);
                    setStep(1.5);
                  }
                }}
              />
            )}

            {step === 1.5 && (
              <QuizQuestion
                title={t("smart_match.type_q")}
                options={currentPropertyTypes
                  .filter((t) =>
                    !isOfficeMode ? t.value !== "OFFICE_BUILDING" : true,
                  )
                  .map((pt) => {
                    const key = `property_types.${pt.value.toLowerCase()}`;
                    const res = t(key);
                    return res === key ? pt.label : res;
                  })}
                availableOptions={
                  availablePropertyTypes.length > 0
                    ? currentPropertyTypes
                        .filter((t) =>
                          !isOfficeMode ? t.value !== "OFFICE_BUILDING" : true,
                        )
                        .filter((t) => availablePropertyTypes.includes(t.value))
                        .map((pt) => {
                          const key = `property_types.${pt.value.toLowerCase()}`;
                          const res = t(key);
                          return res === key ? pt.label : res;
                        })
                    : undefined
                }
                onSelect={(val) => {
                  const selectedType = currentPropertyTypes.find((pt) => {
                    const key = `property_types.${pt.value.toLowerCase()}`;
                    const res = t(key);
                    return (res === key ? pt.label : res) === val;
                  });
                  setPropertyType(
                    (selectedType?.value as PropertyType) || "OTHER",
                  );
                  setStep(2);
                }}
              />
            )}

            {step === 1.7 && isOfficeMode && (
              <OfficeSizeStep
                officeSizes={officeSizes}
                availableSizes={availableSizes}
                onSelect={(min, max) => {
                  setOfficeSize({ min, max });
                  setStep(2);
                }}
              />
            )}

            {step === 2 && (
              <QuizQuestion
                title={
                  purpose === "RENT"
                    ? t("smart_match.budget_rent_q")
                    : t("smart_match.budget_buy_q")
                }
                options={currentBudgetRanges.map((r) => {
                  const key = `smart_match.budget_labels.${r.id}`;
                  const res = t(key);
                  return res === key ? r.label : res;
                })}
                availableOptions={
                  availableBudgetIds.length > 0
                    ? currentBudgetRanges
                        .filter((r) => availableBudgetIds.includes(r.id))
                        .map((r) => {
                          const key = `smart_match.budget_labels.${r.id}`;
                          const res = t(key);
                          return res === key ? r.label : res;
                        })
                    : undefined
                }
                onSelect={(val) => {
                  const selected = currentBudgetRanges.find((r) => {
                    const key = `smart_match.budget_labels.${r.id}`;
                    const res = t(key);
                    return (res === key ? r.label : res) === val;
                  });
                  if (selected)
                    setSelectedBudget({
                      min: selected.min_value,
                      max: selected.max_value,
                    });
                  settings.transit_question_enabled ? setStep(2.5) : setStep(3);
                }}
              />
            )}

            {step === 2.5 && settings.transit_question_enabled && (
              <QuizQuestion
                title={t("smart_match.transit_q")}
                options={[
                  t("smart_match.transit_yes"),
                  t("smart_match.transit_no"),
                ]}
                availableOptions={[
                  availableTransitOptions.includes("NEAR_TRANSIT")
                    ? t("smart_match.transit_yes")
                    : "",
                  availableTransitOptions.includes("ANY_LOCATION")
                    ? t("smart_match.transit_no")
                    : "",
                ].filter(Boolean)}
                onSelect={(val) => {
                  setNearTransit(val === t("smart_match.transit_yes"));
                  setStep(3);
                }}
              />
            )}

            {step === 3 && (
              <QuizQuestion
                title={t("smart_match.area_q")}
                options={popularAreas.map((a) => {
                  const lang = language;
                  return (
                    (lang === "en"
                      ? a.name_en
                      : lang === "cn"
                        ? a.name_cn
                        : null) || a.name
                  );
                })}
                availableOptions={availableLocations.map((a) => {
                  const lang = language;
                  return (
                    (lang === "en"
                      ? a.name_en
                      : lang === "cn"
                        ? a.name_cn
                        : null) || a.name
                  );
                })}
                onSelect={(val) => {
                  const selected = popularAreas.find((a) => {
                    const lang = language;
                    const localized =
                      (lang === "en"
                        ? a.name_en
                        : lang === "cn"
                          ? a.name_cn
                          : null) || a.name;
                    return localized === val;
                  });
                  setArea(selected?.name || val);
                  handleSearch();
                }}
              />
            )}

            {step === 4 && (
              <LoadingState loadingText={t("smart_match.loading_analyzing")} />
            )}
          </div>

          <WizardFooter pdpaText={t("smart_match.pdpa_text")} />
        </>
      ) : (
        <ResultsContainer
          matches={matches}
          sessionId={sessionId}
          purpose={purpose}
          onReset={reset}
        />
      )}
    </div>
  );
}
