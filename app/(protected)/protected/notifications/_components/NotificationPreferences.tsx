"use client";

import { useState } from "react";
import { Settings, Bell, UserPlus, ShieldPlus, TrendingUp, Save, LucideIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateNotificationSettings } from "@/features/profile/actions";
import { cn } from "@/lib/utils";

interface PreferenceItemProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  enabled: boolean;
  onToggle: (id: string, val: boolean) => void;
}

function PreferenceItem({ id, title, description, icon: Icon, enabled, onToggle }: PreferenceItemProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
      <div className="flex items-center gap-4">
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
          enabled ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <Switch 
        checked={enabled} 
        onCheckedChange={(val) => onToggle(id, val)}
      />
    </div>
  );
}

interface NotificationPreferencesProps {
  initialSettings?: Record<string, boolean>;
}

export function NotificationPreferences({ initialSettings = {} }: NotificationPreferencesProps) {
  const [settings, setSettings] = useState<Record<string, boolean>>({
    activity: true,
    new_lead: true,
    assignment: true,
    status_update: false,
    ...initialSettings
  });
  const [saving, setSaving] = useState(false);

  const handleToggle = (id: string, val: boolean) => {
    setSettings(prev => ({ ...prev, [id]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateNotificationSettings(settings);
      if (result.success) {
        toast.success("บันทึกการตั้งค่าแล้ว");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast.error("ไม่สามารถบันทึกการตั้งค่าได้");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">ตั้งค่าการแจ้งเตือน</h2>
          <p className="text-sm text-slate-500 font-medium tracking-tight">เลือกรับข้อมูลที่คุณต้องการทราบมากที่สุด</p>
        </div>
      </div>

      <div className="grid gap-2">
        <PreferenceItem 
          id="activity" 
          title="กิจกรรมทั่วไป" 
          description="การแจ้งเตือนจากความเคลื่อนไหวของเพื่อนร่วมทีม" 
          icon={Bell} 
          enabled={settings.activity}
          onToggle={handleToggle}
        />
        <PreferenceItem 
          id="new_lead" 
          title="ลีดใหม่" 
          description="แจ้งเตือนทันทีเมื่อมีลีดใหม่กรอกข้อมูลเข้ามา" 
          icon={UserPlus} 
          enabled={settings.new_lead}
          onToggle={handleToggle}
        />
        <PreferenceItem 
          id="assignment" 
          title="การมอบหมายงาน" 
          description="เมื่อคุณได้รับมอบหมายให้ดูแลลีดหรือทรัพย์ใหม่" 
          icon={ShieldPlus} 
          enabled={settings.assignment}
          onToggle={handleToggle}
        />
        <PreferenceItem 
          id="status_update" 
          title="อัปเดตสถานะ" 
          description="การเปลี่ยนแปลงสถานะของดีลหรือสัญญาที่คุณดูแล" 
          icon={TrendingUp} 
          enabled={settings.status_update}
          onToggle={handleToggle}
        />
      </div>

      <div className="pt-4 border-t border-slate-100">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full rounded-2xl h-14 bg-slate-900 hover:bg-slate-800 text-white font-black text-base gap-3 shadow-lg shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {saving ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          บันทึกการตั้งค่า
        </Button>
      </div>
    </div>
  );
}
