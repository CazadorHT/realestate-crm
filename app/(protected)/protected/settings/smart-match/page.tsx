"use client";

import { SmartMatchConfigPanel } from "@/components/settings/SmartMatchConfigPanel";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SmartMatchConfigTour } from "@/components/settings/_components/SmartMatchConfigTour";
import { useLanguage } from "@/lib/i18n/language-context";

export default function SmartMatchSettingsPage() {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="container max-w-screen-2xl py-8 space-y-6">
      <SmartMatchConfigTour />
      <SettingsHeader 
        title={
          isEn ? (
            <>Configure <span className="bg-linear-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">SmartMatch Wizard</span></>
          ) : (
            <>ตั้งค่า <span className="bg-linear-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">SmartMatch Wizard</span></>
          )
        }
        description={isEn ? "Manage budget ranges, property types, and matching parameters for accurate suggestions" : "จัดการช่วงงบประมาณ ประเภททรัพย์ และการตั้งค่าต่างๆ เพื่อการแนะนำทรัพย์ที่แม่นยำที่สุด"}
        subPath={[
          { label: isEn ? "System Control" : "System Control", href: "/protected/settings?tab=ai" },
          { label: isEn ? "SmartMatch Settings" : "SmartMatch (ตั้งค่าแนะนำทรัพย์)" }
        ]}
      />

      <div id="tour-smartmatch-config">
        <SmartMatchConfigPanel />
      </div>
    </div>
  );
}

