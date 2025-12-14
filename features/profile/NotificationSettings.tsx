"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, MessageSquare, UserPlus } from "lucide-react";

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

export function NotificationSettings() {
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: "new_lead",
      label: "Lead ใหม่",
      description: "แจ้งเตือนเมื่อมี Lead ใหม่เข้ามา",
      icon: <UserPlus className="h-5 w-5" />,
      enabled: true,
    },
    {
      id: "assignment",
      label: "มอบหมายงาน",
      description: "แจ้งเตือนเมื่อได้รับมอบหมายทรัพย์หรือ Lead ใหม่",
      icon: <Bell className="h-5 w-5" />,
      enabled: true,
    },
    {
      id: "status_update",
      label: "อัปเดตสถานะ",
      description: "แจ้งเตือนเมื่อมีการเปลี่ยนสถานะทรัพย์หรือ Lead",
      icon: <MessageSquare className="h-5 w-5" />,
      enabled: false,
    },
    {
      id: "activity",
      label: "กิจกรรมใหม่",
      description: "แจ้งเตือนกิจกรรมใหม่ใน Lead ของคุณ",
      icon: <Mail className="h-5 w-5" />,
      enabled: true,
    },
  ]);

  const handleToggle = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, enabled: !notif.enabled } : notif
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>การแจ้งเตือน</CardTitle>
        <CardDescription>
          เลือกประเภทการแจ้งเตือนที่คุณต้องการรับ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications.map((notif, index) => (
          <div key={notif.id}>
            {index > 0 && <Separator className="my-4" />}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className={`p-2 rounded-full ${notif.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {notif.icon}
                </div>
                <div className="flex-1">
                  <Label htmlFor={notif.id} className="font-medium cursor-pointer">
                    {notif.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {notif.description}
                  </p>
                </div>
              </div>
              <Switch
                id={notif.id}
                checked={notif.enabled}
                onCheckedChange={() => handleToggle(notif.id)}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
