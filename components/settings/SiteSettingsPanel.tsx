"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Settings,
  Sparkles,
  MessageCircle,
  Phone,
  Loader2,
  Save,
  RefreshCw,
  ShieldCheck,
  Users,
  Home,
  Briefcase,
} from "lucide-react";
import {
  getSiteSettings,
  updateSiteSettings,
  SiteSettings,
} from "@/features/site-settings/actions";

export function SiteSettingsPanel() {
  const [settings, setSettings] = useState<SiteSettings>({
    smart_match_wizard_enabled: true,
    chatbot_enabled: true,
    floating_contact_enabled: true,
    isolation_properties_enabled: false,
    isolation_leads_enabled: false,
    isolation_deals_enabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<SiteSettings | null>(
    null,
  );

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const data = await getSiteSettings();
        setSettings(data);
        setOriginalSettings(data);
      } catch (error) {
        toast.error("ไม่สามารถโหลดการตั้งค่าได้");
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleToggle = (key: keyof SiteSettings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(newSettings);

    // Check if there are changes from original
    if (originalSettings) {
      const hasAnyChange = Object.keys(originalSettings).some(
        (k) =>
          originalSettings[k as keyof SiteSettings] !==
          newSettings[k as keyof SiteSettings],
      );
      setHasChanges(hasAnyChange);
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateSiteSettings(settings);
      if (result.success) {
        toast.success("บันทึกการตั้งค่าเรียบร้อย");
        setOriginalSettings(settings);
        setHasChanges(false);
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาดในการบันทึก");
      }
    });
  };

  const handleReset = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="bg-linear-to-r from-slate-50 to-blue-50 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Settings className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg">ตั้งค่าฟีเจอร์หน้าเว็บ</CardTitle>
            <CardDescription>
              เปิด/ปิดฟีเจอร์ต่างๆ ที่แสดงในหน้าเว็บสาธารณะ
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Smart Match Wizard */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-purple-100 rounded-xl">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <Label
                htmlFor="smart_match"
                className="text-base font-medium text-slate-900 cursor-pointer"
              >
                Smart Match Wizard
              </Label>
              <p className="text-sm text-slate-500 mt-0.5">
                ระบบ AI ช่วยค้นหาอสังหาฯ ที่เหมาะกับผู้ใช้
              </p>
            </div>
          </div>
          <Switch
            id="smart_match"
            checked={settings.smart_match_wizard_enabled}
            onCheckedChange={() => handleToggle("smart_match_wizard_enabled")}
          />
        </div>

        {/* Chatbot */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <MessageCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <Label
                htmlFor="chatbot"
                className="text-base font-medium text-slate-900 cursor-pointer"
              >
                AI Chatbot
              </Label>
              <p className="text-sm text-slate-500 mt-0.5">
                แชทบอท AI ช่วยตอบคำถามลูกค้าแบบอัตโนมัติ
              </p>
            </div>
          </div>
          <Switch
            id="chatbot"
            checked={settings.chatbot_enabled}
            onCheckedChange={() => handleToggle("chatbot_enabled")}
          />
        </div>

        {/* Floating Contact */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-green-100 rounded-xl">
              <Phone className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <Label
                htmlFor="floating_contact"
                className="text-base font-medium text-slate-900 cursor-pointer"
              >
                ปุ่มติดต่อลอย (Floating Contact)
              </Label>
              <p className="text-sm text-slate-500 mt-0.5">
                ปุ่ม LINE/โทร ที่ลอยอยู่มุมขวาล่างของหน้าเว็บ
              </p>
            </div>
          </div>
          <Switch
            id="floating_contact"
            checked={settings.floating_contact_enabled}
            onCheckedChange={() => handleToggle("floating_contact_enabled")}
          />
        </div>

        <Separator />

        {/* Combined Save Button for everything */}
        <div className="flex items-center justify-end gap-3 pt-4">
          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isPending}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              รีเซ็ต
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isPending || !hasChanges}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            บันทึกการตั้งค่าทั้งหมด
          </Button>
        </div>
      </CardContent>

      <div className="mt-8">
        <Card className="border-slate-200">
          <CardHeader className="bg-linear-to-r from-slate-50 to-indigo-50 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  จัดการการเข้าถึงข้อมูล (Data Isolation)
                </CardTitle>
                <CardDescription>
                  ตั้งค่าการแยกส่วนข้อมูลเพื่อให้ Agent เห็นเฉพาะข้อมูลของตนเอง
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Property Isolation */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <Home className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <Label
                    htmlFor="isolation_properties"
                    className="text-base font-medium text-slate-900 cursor-pointer"
                  >
                    แยกฐานข้อมูลทรัพย์สิน (Properties)
                  </Label>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Agent จะเห็นและจัดการได้แค่ทรัพย์สินที่ตนเองสร้าง
                  </p>
                </div>
              </div>
              <Switch
                id="isolation_properties"
                checked={settings.isolation_properties_enabled}
                onCheckedChange={() =>
                  handleToggle("isolation_properties_enabled")
                }
              />
            </div>

            {/* Lead Isolation */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-emerald-100 rounded-xl">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <Label
                    htmlFor="isolation_leads"
                    className="text-base font-medium text-slate-900 cursor-pointer"
                  >
                    แยกฐานข้อมูลลูกค้า (Leads)
                  </Label>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Agent จะเห็นเฉพาะลูกค้าที่ตนเองหามา หรือได้รับมอบหมาย
                  </p>
                </div>
              </div>
              <Switch
                id="isolation_leads"
                checked={settings.isolation_leads_enabled}
                onCheckedChange={() => handleToggle("isolation_leads_enabled")}
              />
            </div>

            {/* Deal Isolation */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-amber-100 rounded-xl">
                  <Briefcase className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <Label
                    htmlFor="isolation_deals"
                    className="text-base font-medium text-slate-900 cursor-pointer"
                  >
                    แยกฐานข้อมูลการขาย (Deals/Contracts)
                  </Label>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Agent จะเห็นเฉพาะดีลที่ตนเองเป็นเจ้าของเคสเท่านั้น
                  </p>
                </div>
              </div>
              <Switch
                id="isolation_deals"
                checked={settings.isolation_deals_enabled}
                onCheckedChange={() => handleToggle("isolation_deals_enabled")}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Card>
  );
}
