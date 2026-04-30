import { SmartMatchConfigPanel } from "@/components/settings/SmartMatchConfigPanel";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { Metadata } from "next";
import { SmartMatchConfigTour } from "@/components/settings/_components/SmartMatchConfigTour";

export const metadata: Metadata = {
  title: "SmartMatch Config | CRM",
};

export default function SmartMatchSettingsPage() {
  return (
    <div className="container max-w-screen-2xl py-8 space-y-6">
      <SmartMatchConfigTour />
      <SettingsHeader 
        title={<>ตั้งค่า <span className="bg-linear-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">SmartMatch Wizard</span></>}
        description="จัดการช่วงงบประมาณ ประเภททรัพย์ และการตั้งค่าต่างๆ เพื่อการแนะนำทรัพย์ที่แม่นยำที่สุด"
        subPath={[
          { label: "System Control", href: "/protected/settings?tab=ai" },
          { label: "SmartMatch (ตั้งค่าแนะนำทรัพย์)" }
        ]}
      />

      <div id="tour-smartmatch-config">
        <SmartMatchConfigPanel />
      </div>
    </div>
  );
}
