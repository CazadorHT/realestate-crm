import { Metadata } from "next";
import { SiteSettingsPanel } from "@/components/settings/SiteSettingsPanel";
import { Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "Settings | CRM",
  description: "Manage site settings",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-slate-100 rounded-xl">
          <Settings className="h-6 w-6 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">การตั้งค่า</h1>
          <p className="text-slate-500">จัดการการตั้งค่าระบบและฟีเจอร์ต่างๆ</p>
        </div>
      </div>

      {/* Site Settings Panel */}
      <SiteSettingsPanel />
    </div>
  );
}
