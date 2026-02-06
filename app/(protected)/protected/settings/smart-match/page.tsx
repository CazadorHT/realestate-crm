import { SmartMatchConfigPanel } from "@/components/settings/SmartMatchConfigPanel";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "SmartMatch Config | CRM",
};

export default function SmartMatchSettingsPage() {
  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">ตั้งค่า SmartMatch Wizard</h1>
          <p className="text-muted-foreground">
            จัดการช่วงงบประมาณ ประเภททรัพย์ และการตั้งค่าต่างๆ ของ Wizard
          </p>
        </div>
      </div>

      <SmartMatchConfigPanel />
    </div>
  );
}
