/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { Building2, Loader2, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { type ProjectAdminItem } from "@/features/properties/actions/projects";
import { type MasterDataTransitStation } from "@/features/properties/actions/fetch-master-data";

// Import custom hook
import { useProjectForm } from "./hooks/useProjectForm";

// Import step components
import { Step1BasicInfo } from "./wizard-steps/Step1BasicInfo";
import { Step2LocationTransit } from "./wizard-steps/Step2LocationTransit";
import { Step3Facilities } from "./wizard-steps/Step3Facilities";
import { Step4Description } from "./wizard-steps/Step4Description";
import { Step5SeoSettings } from "./wizard-steps/Step5SeoSettings";
import { TransitStationSelector } from "./TransitStationSelector";
import { useLanguage } from "@/lib/i18n/language-context";

interface ProjectFormWizardProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  project: ProjectAdminItem | null;
  stations: MasterDataTransitStation[];
  dbFeatures: any[];
  onSaveSuccess: () => void;
}

export function ProjectFormWizard({
  isOpen,
  onClose,
  project,
  stations,
  dbFeatures,
  onSaveSuccess,
}: ProjectFormWizardProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const {
    isSaving,
    isFormDirty,
    setIsFormDirty,
    formStep,
    setFormStep,
    googleMapsUrl,
    isAiGenerating,
    nameTh,
    setNameTh,
    nameEn,
    setNameEn,
    slug,
    setSlug,
    developer,
    setDeveloper,
    propertyType,
    setPropertyType,
    province,
    setProvince,
    district,
    setDistrict,
    subdistrict,
    setSubdistrict,
    lat,
    lng,
    yearCompleted,
    setYearCompleted,
    totalUnits,
    setTotalUnits,
    imageUrl,
    setImageUrl,
    descTh,
    setDescTh,
    descEn,
    setDescEn,
    descCn,
    setDescCn,
    descRu,
    setDescRu,
    seoTitleTh,
    setSeoTitleTh,
    seoTitleEn,
    setSeoTitleEn,
    seoDescTh,
    setSeoDescTh,
    seoDescEn,
    setSeoDescEn,
    selectedFacilities,
    isActive,
    setIsActive,
    sortOrder,
    setSortOrder,
    selectedStationCodes,
    setSelectedStationCodes,
    stationDistancesMap,
    setStationDistancesMap,
    isStationSelectorOpen,
    setIsStationSelectorOpen,
    handleFacilityToggle,
    handleGoogleMapsUrlChange,
    handleAiAutoFill,
    handleSave,
    groupedFeatures,
  } = useProjectForm({ isOpen, project, dbFeatures, onClose, onSaveSuccess });

  const renderFormContent = () => (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1 py-2">
      {formStep === 1 && (
        <Step1BasicInfo
          nameTh={nameTh}
          setNameTh={setNameTh}
          nameEn={nameEn}
          setNameEn={setNameEn}
          slug={slug}
          setSlug={setSlug}
          developer={developer}
          setDeveloper={setDeveloper}
          propertyType={propertyType}
          setPropertyType={setPropertyType}
          yearCompleted={yearCompleted}
          setYearCompleted={setYearCompleted}
          totalUnits={totalUnits}
          setTotalUnits={setTotalUnits}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          isAiGenerating={isAiGenerating}
          onAiAutoFill={handleAiAutoFill}
          setIsFormDirty={setIsFormDirty}
        />
      )}

      {formStep === 2 && (
        <Step2LocationTransit
          googleMapsUrl={googleMapsUrl}
          onGoogleMapsUrlChange={handleGoogleMapsUrlChange}
          lat={lat}
          lng={lng}
          province={province}
          setProvince={setProvince}
          district={district}
          setDistrict={setDistrict}
          subdistrict={subdistrict}
          setSubdistrict={setSubdistrict}
          selectedStationCodes={selectedStationCodes}
          setSelectedStationCodes={setSelectedStationCodes}
          stationDistancesMap={stationDistancesMap}
          setStationDistancesMap={setStationDistancesMap}
          stations={stations}
          onOpenStationSelector={() => {
            setIsStationSelectorOpen(true);
          }}
          setIsFormDirty={setIsFormDirty}
        />
      )}

      {formStep === 3 && (
        <Step3Facilities
          selectedFacilities={selectedFacilities}
          onFacilityToggle={handleFacilityToggle}
          dbFeatures={dbFeatures}
          groupedFeatures={groupedFeatures}
        />
      )}

      {formStep === 4 && (
        <Step4Description
          descTh={descTh}
          setDescTh={setDescTh}
          descEn={descEn}
          setDescEn={setDescEn}
          descCn={descCn}
          setDescCn={setDescCn}
          descRu={descRu}
          setDescRu={setDescRu}
          setIsFormDirty={setIsFormDirty}
        />
      )}

      {formStep === 5 && (
        <Step5SeoSettings
          seoTitleTh={seoTitleTh}
          setSeoTitleTh={setSeoTitleTh}
          seoTitleEn={seoTitleEn}
          setSeoTitleEn={setSeoTitleEn}
          seoDescTh={seoDescTh}
          setSeoDescTh={setSeoDescTh}
          seoDescEn={seoDescEn}
          setSeoDescEn={setSeoDescEn}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          isActive={isActive}
          setIsActive={setIsActive}
          setIsFormDirty={setIsFormDirty}
        />
      )}
    </div>
  );

  return (
    <>
      <ResponsiveDialog
        open={isOpen}
        onOpenChange={(open) => { if (!open) { onClose(false); setIsFormDirty(false); } }}
        confirmOnClose={isFormDirty}
        isLoading={isSaving}
        loadingText={isEn ? "Saving project..." : "กำลังบันทึกข้อมูล..."}
        title={
          <span className="flex items-center gap-2 text-slate-900">
            <Building2 className="h-5.5 w-5.5 text-indigo-600" />
            {project 
              ? (isEn ? `Edit Project: ${project.name.en || project.name.th}` : `แก้ไขโครงการ: ${project.name.th}`) 
              : (isEn ? "Create New Project" : "สร้างโครงการใหม่")}
          </span>
        }
        description={
          <div className="space-y-4 mt-2">
            <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
              {isEn
                ? "Complete project information step-by-step to link property listings and generate SEO landing pages."
                : "กรอกข้อมูลโครงการทีละขั้นตอนเพื่อให้ผูกกับรายการทรัพย์สินและสร้างหน้า Landing Page สำหรับทำ SEO"}
            </p>
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100/50">
              <div className="flex items-center justify-between relative">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className="flex flex-col items-center z-10">
                    <button
                      type="button"
                      onClick={() => {
                        if (nameTh.trim() || nameEn.trim()) {
                          setFormStep(step);
                        } else {
                          toast.error(isEn ? "Please enter a project name first" : "กรุณาระบุชื่อโครงการขั้นต้นก่อนสลับขั้นตอนครับ");
                        }
                      }}
                      className={cn(
                        "w-8.5 h-8.5 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 cursor-pointer touch-manipulation",
                        formStep === step
                          ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                          : formStep > step
                          ? "bg-emerald-500 text-white"
                          : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      {step}
                    </button>
                    <span className="text-[10px] mt-1.5 font-bold text-slate-500 hidden sm:inline">
                      {step === 1
                        ? (isEn ? "General" : "ข้อมูลทั่วไป")
                        : step === 2
                        ? (isEn ? "Location" : "ที่ตั้ง & การเดินทาง")
                        : step === 3
                        ? (isEn ? "Facilities" : "สิ่งอำนวยความสะดวก")
                        : step === 4
                        ? (isEn ? "Description" : "รายละเอียด")
                        : (isEn ? "SEO & Config" : "SEO & ตั้งค่า")}
                    </span>
                  </div>
                ))}
                <div className="absolute top-4.5 left-4 right-4 h-0.5 bg-slate-200/60 -z-0" />
                <div 
                  className="absolute top-4.5 left-4 h-0.5 bg-indigo-600 transition-all duration-300 -z-0" 
                  style={{ width: `${((formStep - 1) / 4) * 92}%` }}
                />
              </div>
            </div>
          </div>
        }
        className="sm:max-w-3xl"
        footer={
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 w-full px-6 sm:px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose(false)}
              disabled={isSaving}
              className="w-full sm:w-auto h-11 sm:h-10.5 rounded-xl font-bold border-slate-200 text-slate-650 cursor-pointer"
            >
              {isEn ? "Cancel" : "ยกเลิก"}
            </Button>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {formStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormStep(prev => prev - 1)}
                  disabled={isSaving}
                  className="w-full sm:w-auto h-11 sm:h-10.5 rounded-xl font-semibold border-slate-200 text-slate-650 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {isEn ? "Back" : "ย้อนกลับ"}
                </Button>
              )}
              
              {formStep < 5 ? (
                <Button
                  type="button"
                  onClick={() => {
                    if (nameTh.trim() && nameEn.trim()) {
                      setFormStep(prev => prev + 1);
                    } else {
                      toast.error(isEn ? "Please enter project names in Thai and English" : "กรุณาระบุชื่อโครงการก่อนสลับขั้นตอนครับ");
                    }
                  }}
                  className="w-full sm:w-auto h-11 sm:h-10.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/20 cursor-pointer flex items-center gap-1"
                >
                  {isEn ? "Next" : "ถัดไป"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full sm:w-auto h-11 sm:h-10.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isEn ? "Saving..." : "กำลังบันทึก..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      {isEn ? "Save Project" : "บันทึกโครงการ"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); if (formStep === 5) handleSave(); }} className="space-y-6 p-6">
          {renderFormContent()}
        </form>
      </ResponsiveDialog>

      <TransitStationSelector
        isOpen={isStationSelectorOpen}
        onClose={setIsStationSelectorOpen}
        selectedStationCodes={selectedStationCodes}
        setSelectedStationCodes={setSelectedStationCodes}
        stations={stations}
        setIsFormDirty={setIsFormDirty}
      />
    </>
  );
}

