"use client";

import { Loader2 } from "lucide-react";
import { useSmartMatchWizard } from "@/features/smart-match/hooks/useSmartMatchWizard";
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

  const currentPropertyTypes = isOfficeMode
    ? [{ label: "🏢 สำนักงาน/ออฟฟิศ", value: "OFFICE_BUILDING" }]
    : propertyTypes.length > 0
      ? propertyTypes
      : DEFAULT_PROPERTY_TYPES;

  if (configLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 md:p-8 border border-slate-100 h-[450px] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-sm text-slate-500">กำลังโหลด...</p>
      </div>
    );
  }

  const purposeOptions = [
    { label: "🔑 เช่าบ้าน/คอนโด", value: "RENT" },
    { label: "🏢 หาพื้นที่ทำงาน", value: "OFFICE" },
    { label: "🏠 ซื้อบ้าน/คอนโด", value: "BUY" },
    { label: "📈 ลงทุนอสังหาฯ", value: "INVEST" },
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
                title={settings.wizard_title || "วันนี้คุณกำลังมองหา..."}
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
                  if (val.includes("พื้นที่ทำงาน")) {
                    setPurpose("RENT");
                    setIsOfficeMode(true);
                    setPropertyType("OFFICE_BUILDING");
                    setStep(1.7);
                  } else {
                    const selected = purposeOptions.find(
                      (o) => o.label === val,
                    );
                    setPurpose((selected?.value as any) || "BUY");
                    setIsOfficeMode(false);
                    setStep(1.5);
                  }
                }}
              />
            )}

            {step === 1.5 && (
              <QuizQuestion
                title="ที่พักอาศัยแบบไหนที่ตอบโจทย์คุณ?"
                options={currentPropertyTypes
                  .filter((t) =>
                    !isOfficeMode ? t.value !== "OFFICE_BUILDING" : true,
                  )
                  .map((t) => t.label)}
                availableOptions={
                  availablePropertyTypes.length > 0
                    ? currentPropertyTypes
                        .filter((t) =>
                          !isOfficeMode ? t.value !== "OFFICE_BUILDING" : true,
                        )
                        .filter((t) => availablePropertyTypes.includes(t.value))
                        .map((t) => t.label)
                    : undefined
                }
                onSelect={(val) => {
                  const selectedType = currentPropertyTypes.find(
                    (t) => t.label === val,
                  );
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
                    ? "งบเช่าต่อเดือนเท่าไหร่ ?"
                    : "งบประมาณประมาณเท่าไหร่ ?"
                }
                options={currentBudgetRanges.map((r) => r.label)}
                availableOptions={
                  availableBudgetIds.length > 0
                    ? currentBudgetRanges
                        .filter((r) => availableBudgetIds.includes(r.id))
                        .map((r) => r.label)
                    : undefined
                }
                onSelect={(val) => {
                  const selected = currentBudgetRanges.find(
                    (r) => r.label === val,
                  );
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
                title="ต้องการเน้นใกล้รถไฟฟ้าไหม ?"
                options={["🚆 ใกล้รถไฟฟ้า BTS/MRT", "🚫 ไม่เน้นทำเลรถไฟฟ้า"]}
                availableOptions={[
                  availableTransitOptions.includes("NEAR_TRANSIT")
                    ? "🚆 ใกล้รถไฟฟ้า BTS/MRT"
                    : "",
                  availableTransitOptions.includes("ANY_LOCATION")
                    ? "🚫 ไม่เน้นทำเลรถไฟฟ้า"
                    : "",
                ].filter(Boolean)}
                onSelect={(val) => {
                  setNearTransit(val.includes("ใกล้รถไฟฟ้า"));
                  setStep(3);
                }}
              />
            )}

            {step === 3 && (
              <QuizQuestion
                title="ระบุย่านที่คุณต้องการ (เช่น อารีย์, บางนา)"
                options={popularAreas}
                availableOptions={availableLocations}
                onSelect={(val) => {
                  setArea(val);
                  handleSearch();
                }}
              />
            )}

            {step === 4 && <LoadingState loadingText={settings.loading_text} />}
          </div>

          <WizardFooter pdpaText={settings.pdpa_text} />
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
