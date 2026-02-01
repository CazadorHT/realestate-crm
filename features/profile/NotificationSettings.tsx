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
import { Bell, Mail, MessageSquare, UserPlus } from "lucide-react";
import { updateNotificationSettings } from "./actions";
import { toast } from "sonner";
import type { Json } from "@/lib/database.types";

interface NotificationSettingsProps {
  initialSettings: Json | null;
}

const DEFAULT_SETTINGS = {
  new_lead: true,
  assignment: true,
  status_update: false,
  activity: true,
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

  const definition = [
    {
      id: "new_lead",
      label: "Lead ใหม่",
      description: "แจ้งเตือนเมื่อมี Lead ใหม่เข้ามา",
      icon: <UserPlus className="h-5 w-5" />,
    },
    {
      id: "assignment",
      label: "มอบหมายงาน",
      description: "แจ้งเตือนเมื่อได้รับมอบหมายทรัพย์หรือ Lead ใหม่",
      icon: <Bell className="h-5 w-5" />,
    },
    {
      id: "status_update",
      label: "อัปเดตสถานะ",
      description: "แจ้งเตือนเมื่อมีการเปลี่ยนสถานะทรัพย์หรือ Lead",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      id: "activity",
      label: "กิจกรรมใหม่",
      description: "แจ้งเตือนกิจกรรมใหม่ใน Lead ของคุณ",
      icon: <Mail className="h-5 w-5" />,
    },
  ];

  const handleToggle = async (id: string, current: boolean) => {
    // Optimistic Update
    const nextSettings = { ...settings, [id]: !current };
    setSettings(nextSettings);
    setIsUpdating(true);

    try {
      const result = await updateNotificationSettings(nextSettings);
      if (!result.success) {
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
    <Card className={isUpdating ? "opacity-70 transition-opacity" : ""}>
      <CardHeader>
        <CardTitle>การแจ้งเตือน</CardTitle>
        <CardDescription>
          เลือกประเภทการแจ้งเตือนที่คุณต้องการรับ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {definition.map((item, index) => {
          const isEnabled = settings[item.id] ?? false; // Default false if missing
          return (
            <div key={item.id}>
              {index > 0 && <Separator className="my-4" />}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`p-2 rounded-full ${
                      isEnabled
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <Label
                      htmlFor={item.id}
                      className="font-medium cursor-pointer"
                    >
                      {item.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={item.id}
                  checked={isEnabled}
                  onCheckedChange={() => handleToggle(item.id, isEnabled)}
                  disabled={isUpdating}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
