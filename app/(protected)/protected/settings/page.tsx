import { Metadata } from "next";
import { SiteSettingsPanel } from "@/components/settings/SiteSettingsPanel";
import { BrandSettingsPanel } from "@/components/settings/BrandSettingsPanel";
import { Settings, Palette, Globe } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Settings | CRM",
  description: "Manage site settings",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm">
            <Settings className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">การตั้งค่า</h1>
            <p className="text-sm text-slate-500">
              จัดการระบบและภาพลักษณ์ของแบรนด์คุณ
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full space-y-6">
        <TabsList className="bg-slate-100/80 p-1 rounded-xl border border-slate-200 h-auto flex-wrap sm:flex-nowrap">
          <TabsTrigger
            value="general"
            className="rounded-lg py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all text-slate-600 font-medium"
          >
            <Globe className="h-4 w-4 mr-2" />
            ตั้งค่าทั่วไป (General)
          </TabsTrigger>
          <TabsTrigger
            value="branding"
            className="rounded-lg py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all text-slate-600 font-medium"
          >
            <Palette className="h-4 w-4 mr-2" />
            อัตลักษณ์แบรนด์ (Brand CI)
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="general"
          className="mt-0 focus-visible:outline-none"
        >
          <SiteSettingsPanel />
        </TabsContent>

        <TabsContent
          value="branding"
          className="mt-0 focus-visible:outline-none"
        >
          <BrandSettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
