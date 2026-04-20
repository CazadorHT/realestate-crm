"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, MessageSquare, UserPlus, Clock } from "lucide-react";
import { updateNotificationSettings } from "./actions";
import { toast } from "sonner";
import type { Json } from "@/lib/database.types";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";

interface NotificationSettingsProps {
  initialSettings: Json | null;
}

const DEFAULT_SETTINGS = {
  new_lead: true,
  assignment: true,
  status_update: false,
  activity: true,
  price_drop: true,
  contract_expiry: true,
};

export function NotificationSettings({
  initialSettings,
}: NotificationSettingsProps) {
  // Parse initial settings or use default
  const parsedSettings =
    initialSettings && typeof initialSettings === "object"
      ? (initialSettings as Record<string, boolean>)
      : DEFAULT_SETTINGS;

  const [settings, setSettings] =
    useState<Record<string, boolean>>(parsedSettings);

  const [isUpdating, setIsUpdating] = useState(false);

  const groups = [
    {
      title: "การขายและลีด (Sales & Leads)",
      items: [
        {
          id: "new_lead",
          label: "Lead ใหม่",
          description: "แจ้งเตือนเมื่อมีลูกค้าใหม่เข้ามาในระบบ",
          icon: <UserPlus className="h-4 w-4" />,
          color: "bg-blue-500",
        },
        {
          id: "assignment",
          label: "มอบหมายงาน",
          description: "เมื่อคุณได้รับมอบหมายทรัพย์หรือลูกค้าใหม่",
          icon: <Bell className="h-4 w-4" />,
          color: "bg-indigo-500",
        },
        {
          id: "status_update",
          label: "การเคลื่อนไหว",
          description: "เมื่อมีการเปลี่ยนสถานะของทรัพย์หรือลูกค้า",
          icon: <MessageSquare className="h-4 w-4" />,
          color: "bg-emerald-500",
        },
        {
          id: "activity",
          label: "บันทึกกิจกรรม",
          description: "เมื่อทีมงานบันทึกกิจกรรมใหม่ในเคสของคุณ",
          icon: <Mail className="h-4 w-4" />,
          color: "bg-amber-500",
        },
      ],
    },
    {
      title: "ตลาดและสัญญา (Market & Contracts)",
      items: [
        {
          id: "price_drop",
          label: "ทรัพย์ลดราคา",
          description: "อัปเดตเมื่อมีทรัพย์ในทำเลของคุณลดราคาลง",
          icon: <Bell className="h-4 w-4" />,
          color: "bg-rose-500",
        },
        {
          id: "contract_expiry",
          label: "เตือนต่อสัญญา",
          description: "แจ้งเตือนล่วงหน้าเมื่อสัญญาฝากขายใกล้หมดอายุ",
          icon: <Clock className="h-4 w-4" />,
          color: "bg-orange-500",
        },
      ],
    },
  ];

  const handleToggle = async (id: string, current: boolean) => {
    // Find the label for toast
    const item = groups.flatMap((g) => g.items).find((d) => d.id === id);
    const label = item?.label || id;

    // Optimistic Update
    const nextSettings = { ...settings, [id]: !current };
    setSettings(nextSettings);
    setIsUpdating(true);

    try {
      const result = await updateNotificationSettings(nextSettings);
      if (result.success) {
        toast.success(`${!current ? "เปิด" : "ปิด"}${label} สำเร็จ`);
      } else {
        // Revert on failure
        setSettings({ ...settings, [id]: current });
        toast.error("บันทึกการตั้งค่าไม่สำเร็จ: " + result.message);
      }
    } catch (error) {
      setSettings({ ...settings, [id]: current });
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card
      className={cn(
        "border-slate-200 shadow-sm transition-opacity duration-300",
        isUpdating && "opacity-60 pointer-events-none",
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-slate-900" />
          <CardTitle className="text-lg font-bold">ศูนย์การแจ้งเตือน</CardTitle>
        </div>
        <CardDescription>
          ตั้งค่าการรับข่าวสารและการอัปเดตที่สำคัญจากระบบ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 px-6 pb-8">
        {groups.map((group, gIndex) => (
          <div key={gIndex} className="space-y-4">
            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">
              {group.title}
            </h4>
            <div className="grid gap-2">
              {group.items.map((item) => {
                const isEnabled = settings[item.id] ?? false;
                return (
                  <m.div
                    key={item.id}
                    layout
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
                      isEnabled
                        ? "bg-white border-slate-100 shadow-sm"
                        : "bg-slate-50/50 border-transparent grayscale-[0.5] opacity-80",
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "p-2.5 rounded-xl text-white shadow-lg",
                          isEnabled ? item.color : "bg-slate-300",
                        )}
                      >
                        {item.icon}
                      </div>
                      <div className="flex flex-col">
                        <Label
                          htmlFor={item.id}
                          className={cn(
                            "text-sm font-bold cursor-pointer transition-colors",
                            isEnabled ? "text-slate-900" : "text-slate-500",
                          )}
                        >
                          {item.label}
                        </Label>
                        <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={item.id}
                      checked={isEnabled}
                      onCheckedChange={() => handleToggle(item.id, isEnabled)}
                      disabled={isUpdating}
                      className="data-[state=checked]:bg-slate-900"
                    />
                  </m.div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-2">
          <p className="text-[10px] text-center text-slate-300 font-medium">
            ระบบจะส่งการแจ้งเตือนผ่านหน้าเว็บ และ LINE หากมีการเปิดใช้งาน
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
