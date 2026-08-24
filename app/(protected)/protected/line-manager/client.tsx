"use client";

import { useState } from "react";
import { LineTemplate } from "@/features/line/types";
import { updateLineTemplate } from "@/features/line/actions";
import {
  Home,
  MessageCircle,
  Mail,
  UserPlus,
  LogIn,
  TrendingDown,
  CheckCircle,
  Tag,
  Palette,
  Loader2,
  Save,
  User,
  Clock,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { LineTemplateCard } from "@/features/line/components/LineTemplateCard";
import { BroadcastPanel } from "@/features/line/components/BroadcastPanel";

import { useLanguage } from "@/components/providers/LanguageProvider";

export function LineManagerClient({
  initialTemplates,
}: {
  initialTemplates: LineTemplate[];
}) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const [templates, setTemplates] = useState(initialTemplates);
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpdate = async (
    key: string,
    field: "is_active" | "config.headerColor" | "config.headerText",
    value: string | boolean,
  ) => {
    // Validation for header text
    if (field === "config.headerText" && typeof value === "string" && value.length > 50) {
      toast.error(isEn ? "Header text is too long (max 50 chars)" : "ข้อความส่วนหัวยาวเกินไป (สูงสุด 50 ตัวอักษร)");
      return;
    }

    // Optimistic Update
    const updatedTemplates = templates.map((t) => {
      if (t.key === key) {
        if (field === "is_active") return { ...t, is_active: value as boolean };
        if (field === "config.headerColor")
          return { ...t, config: { ...t.config, headerColor: value as string } };
        if (field === "config.headerText")
          return { ...t, config: { ...t.config, headerText: value as string } };
      }
      return t;
    });
    setTemplates(updatedTemplates);

    // If it's just text input, don't auto-save immediately to avoid spamming
    if (field === "is_active" || field === "config.headerColor") {
      saveChanges(key, updatedTemplates);
    }
  };

  const saveChanges = async (key: string, currentTemplates: LineTemplate[]) => {
    const template = currentTemplates.find((t) => t.key === key);
    if (!template) return;

    setLoading(key);
    try {
      await updateLineTemplate(key, {
        is_active: template.is_active,
        config: template.config,
      });
      toast.success(isEn ? "Saved changes" : "บันทึกการเปลี่ยนแปลงแล้ว");
    } catch (err) {
      toast.error(isEn ? "Failed to save" : "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight bg-linear-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent font-sarabun">
          {isEn ? "LINE OA Manager" : "ระบบจัดการ LINE OA"}
        </h2>
        <p className="text-muted-foreground font-sarabun">
          {isEn
            ? "Customize LINE Flex notification templates and broadcast messages to customer groups."
            : "ปรับแต่งเทมเพลตแจ้งเตือน LINE Flex และระบบยิงบรอดแคสต์กลุ่มหาลูกค้าของคุณ"}
        </p>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-11 mb-6 border border-slate-200/50">
          <TabsTrigger value="templates" className="rounded-lg px-6 font-bold text-xs h-9 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
            🎨 {isEn ? "Message Templates" : "จัดการเทมเพลตข้อความ"}
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="rounded-lg px-6 font-bold text-xs h-9 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
            📢 {isEn ? "Send Broadcast" : "ส่งข้อความบรอดแคสต์"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
            {templates.map((template) => (
              <LineTemplateCard
                key={template.key}
                template={template}
                loading={loading === template.key}
                onUpdate={handleUpdate}
                onSave={(key) => saveChanges(key, templates)}
              />
            ))}
          </div>

          {templates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Loader2 className="w-10 h-10 mb-4 animate-spin text-slate-300" />
              <p className="font-medium font-sarabun">
                {isEn ? "Loading templates..." : "กำลังโหลดเทมเพลต..."}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="broadcast" className="space-y-6">
          <BroadcastPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
