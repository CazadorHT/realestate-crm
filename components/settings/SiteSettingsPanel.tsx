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
import { Badge } from "@/components/ui/badge";
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
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  getSiteSettings,
  updateSiteSettings,
  SiteSettings,
} from "@/features/site-settings/actions";
import { cn } from "@/lib/utils";

export function SiteSettingsPanel() {
  const [settings, setSettings] = useState<SiteSettings>({
    smart_match_wizard_enabled: true,
    chatbot_enabled: true,
    floating_contact_enabled: true,
    isolation_properties_enabled: false,
    isolation_leads_enabled: false,
    isolation_deals_enabled: false,
    social_automation_keywords: [],
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  const SettingItem = ({
    id,
    keyName,
    icon: Icon,
    iconColor,
    bgColor,
    title,
    description,
  }: {
    id: string;
    keyName: keyof SiteSettings;
    icon: any;
    iconColor: string;
    bgColor: string;
    title: string;
    description: string;
  }) => {
    const isEnabled = settings[keyName] as boolean;

    return (
      <div
        className={cn(
          "group flex flex-col p-5 rounded-2xl border transition-all duration-300 h-full",
          isEnabled
            ? "bg-white border-slate-200 shadow-sm hover:border-blue-300"
            : "bg-slate-50/50 border-slate-100 opacity-80",
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg transition-transform duration-300 group-hover:scale-110",
                bgColor,
              )}
            >
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor={id}
                  className="text-sm font-semibold text-slate-900 cursor-pointer"
                >
                  {title}
                </Label>
                <Badge
                  variant={isEnabled ? "default" : "secondary"}
                  className={cn(
                    "text-[10px] uppercase font-medium px-2 py-1 leading-none",
                    isEnabled
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-slate-200",
                  )}
                >
                  {isEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-2 items-center gap-3">
          <p className="text-xs text-slate-500 leading-relaxed ">{description}</p>
          <Switch
            id={id}
            checked={isEnabled}
            onCheckedChange={() => handleToggle(keyName)}
            className="data-[state=checked]:bg-blue-600 scale-90"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Save Action Bar (Sticky or Floating) */}
      <div
        className={cn(
          "flex items-center justify-between p-4 rounded-2xl border bg-white/80 backdrop-blur-md shadow-lg sticky top-6 z-50 transition-all duration-500",
          hasChanges
            ? "border-blue-200 translate-y-0 opacity-100"
            : "border-slate-100 translate-y-0 opacity-100",
        )}
      >
        <div className="flex items-center gap-3 px-2">
          {hasChanges ? (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm font-bold text-amber-700">
                มีข้อมูลที่รอการบันทึก
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-slate-500">
                การตั้งค่าเป็นปัจจุบันแล้ว
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Button
              variant="ghost"
              onClick={handleReset}
              disabled={isPending}
              className="rounded-xl font-bold text-slate-600 hover:bg-slate-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              ยกเลิก
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isPending || !hasChanges}
            className={cn(
              "rounded-xl px-6 font-bold shadow-md transition-all",
              hasChanges
                ? "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200"
                : "bg-slate-100 text-slate-400",
            )}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            บันทึกการตั้งค่าทั้งหมด
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Public Website Features */}
        <Card className="border-none shadow-sm bg-transparent p-6">
          <div className="flex  items-center gap-3 mb-4 px-2">
            <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Home className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                ฟีเจอร์หน้าเว็บไซต์สาธารณะ
              </h2>
              <p className="text-sm text-slate-500">
                ปรับแต่งการแสดงผลและฟีเจอร์ที่ลูกค้าจะเห็นบนเว็บไซต์
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingItem
              id="smart_match"
              keyName="smart_match_wizard_enabled"
              icon={Sparkles}
              iconColor="text-purple-600"
              bgColor="bg-purple-100"
              title="Smart Match Wizard"
              description="ระบบ AI วิเคราะห์ความต้องการลูกค้าและแนะนำอสังหาริมทรัพย์ที่เหมาะสมที่สุดให้ทันที"
            />

            <SettingItem
              id="chatbot"
              keyName="chatbot_enabled"
              icon={MessageCircle}
              iconColor="text-blue-600"
              bgColor="bg-blue-100"
              title="AI Real Estate Assistant"
              description="ผู้ช่วยอัจฉริยะที่พร้อมตอบคำถามโครงการและข้อมูลทรัพย์กับลูกค้าตลอด 24 ชั่วโมง"
            />

            <SettingItem
              id="floating_contact"
              keyName="floating_contact_enabled"
              icon={Phone}
              iconColor="text-emerald-600"
              bgColor="bg-emerald-100"
              title="Floating Contact Widgets"
              description="ปุ่มติดต่อด่วน (LINE/โทร) ที่ลอยอยู่มุมล่าง ช่วยให้ลูกค้าเข้าถึงคุณได้ง่ายขึ้นทุกขณะ"
            />
          </div>
        </Card>

        {/* Data Isolation & Security */}
        <Card className="border-none shadow-sm bg-transparent p-6">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                การแยกส่วนข้อมูลและความปลอดภัย
              </h2>
              <p className="text-sm text-slate-500">
                จำกัดการมองเห็นข้อมูลระหว่าง Agent
                เพื่อความเป็นระเบียบและความปลอดภัย
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingItem
              id="isolation_properties"
              keyName="isolation_properties_enabled"
              icon={Home}
              iconColor="text-indigo-600"
              bgColor="bg-indigo-100"
              title="Property Privacy Mode"
              description="Agent จะสามารถเข้าถึงและจัดการได้เฉพาะข้อมูลอสังหาริมทรัพย์ที่ตนเองดูแลเท่านั้น"
            />

            <SettingItem
              id="isolation_leads"
              keyName="isolation_leads_enabled"
              icon={Users}
              iconColor="text-emerald-600"
              bgColor="bg-emerald-50"
              title="Lead Management Isolation"
              description="แยกฐานข้อมูลลูกค้าอย่างชัดเจน Agent จะเห็นเฉพาะลูกค้าที่ได้รับมอบหมายหรือหามาเอง"
            />

            <SettingItem
              id="isolation_deals"
              keyName="isolation_deals_enabled"
              icon={Briefcase}
              iconColor="text-amber-600"
              bgColor="bg-amber-100"
              title="Deal & Contract Protection"
              description="จำกัดการเข้าถึงข้อมูลการปิดดีลและสัญญาเฉพาะเจ้าของเคสและผู้ดูแลระบบเท่านั้น"
            />
          </div>
        </Card>
      </div>

      {/* Footer Info */}
      <div className="bg-slate-100/50 rounded-2xl p-6 border border-slate-200">
        <div className="flex gap-4">
          <div className="p-2 bg-white rounded-lg self-start shadow-xs">
            <ShieldCheck className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">
              ข้อมูลความปลอดภัย
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              การตั้งค่าเหล่านี้จะมีผลกับพนักงานทุกคนในระบบทันทีที่ทำการบันทึก
              สำหรับผู้ดูแลระบบ (Admin)
              จะได้รับสิทธิ์ในการมองเห็นข้อมูลทั้งหมดของบริษัท (Full Access)
              โดยไม่มีการแยกส่วนข้อมูลเหล่านี้
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
