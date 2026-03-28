"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getSiteSettings,
  updateSiteSetting,
  generateSocialAutomationTemplatesAction,
} from "@/features/site-settings/actions";
import { SocialKeyword } from "@/features/site-settings/schema";

// Extracted Components
import { KeywordAutomationCard } from "./social-automation/KeywordAutomationCard";
import { TemplateEditorCard } from "./social-automation/TemplateEditorCard";

export function SocialAutomationSettings() {
  const [keywords, setKeywords] = useState<SocialKeyword[]>([]);
  const [templates, setTemplates] = useState({
    social: { th: "", en: "", cn: "" },
    tiktok: { th: "", en: "", cn: "" },
    line: { th: "", en: "", cn: "" },
  });

  const [activeTab, setActiveTab] = useState<"th" | "en" | "cn">("th");
  const [activePlatform, setActivePlatform] = useState<
    "social" | "line" | "tiktok"
  >("social");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [initialData, setInitialData] = useState<any>(null);
  
  const templateSectionRef = useRef<HTMLDivElement>(null);

  const scrollToTemplate = () => {
    templateSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const settings = await getSiteSettings();
        setKeywords(settings.social_automation_keywords || []);
        setTemplates({
          social: {
            th: settings.social_post_template || "",
            en: settings.social_post_template_en || "",
            cn: settings.social_post_template_cn || "",
          },
          tiktok: {
            th: settings.tiktok_post_template || "",
            en: settings.tiktok_post_template_en || "",
            cn: settings.tiktok_post_template_cn || "",
          },
          line: {
            th: settings.line_post_template || "",
            en: settings.line_post_template_en || "",
            cn: settings.line_post_template_cn || "",
          },
        });
        setInitialData(settings);
      } catch (err) {
        toast.error("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const addRow = () => {
    setKeywords([
      ...keywords,
      { keyword: "", dm_content: "", public_reply: "", enabled: true },
    ]);
  };

  const removeRow = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, data: Partial<SocialKeyword>) => {
    const newKeywords = [...keywords];
    newKeywords[index] = { ...newKeywords[index], ...data };
    setKeywords(newKeywords);
  };

  const updateTemplate = (
    platform: "social" | "line" | "tiktok",
    lang: "th" | "en" | "cn",
    value: string,
  ) => {
    setTemplates((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [lang]: value,
      },
    }));
  };

  const hasChanges = initialData
    ? JSON.stringify(keywords) !==
        JSON.stringify(initialData.social_automation_keywords || []) ||
      templates.social.th !== (initialData.social_post_template || "") ||
      templates.social.en !== (initialData.social_post_template_en || "") ||
      templates.social.cn !== (initialData.social_post_template_cn || "") ||
      templates.line.th !== (initialData.line_post_template || "") ||
      templates.line.en !== (initialData.line_post_template_en || "") ||
      templates.line.cn !== (initialData.line_post_template_cn || "") ||
      templates.tiktok.th !== (initialData.tiktok_post_template || "") ||
      templates.tiktok.en !== (initialData.tiktok_post_template_en || "") ||
      templates.tiktok.cn !== (initialData.tiktok_post_template_cn || "")
    : false;

  const handleSave = (silent = false) => {
    if (!silent && keywords.some((k) => !k.keyword || !k.dm_content)) {
      toast.error("กรุณากรอก Keyword และข้อความ DM ให้ครบถ้วน");
      return;
    }

    startTransition(async () => {
      try {
        const promises = [
          updateSiteSetting("social_automation_keywords", keywords),
          updateSiteSetting("social_post_template", templates.social.th),
          updateSiteSetting("social_post_template_en", templates.social.en),
          updateSiteSetting("social_post_template_cn", templates.social.cn),
          updateSiteSetting("line_post_template", templates.line.th),
          updateSiteSetting("line_post_template_en", templates.line.en),
          updateSiteSetting("line_post_template_cn", templates.line.cn),
          updateSiteSetting("tiktok_post_template", templates.tiktok.th),
          updateSiteSetting("tiktok_post_template_en", templates.tiktok.en),
          updateSiteSetting("tiktok_post_template_cn", templates.tiktok.cn),
        ];

        const results = await Promise.all(promises);
        const allSuccess = results.every((r) => r.success);

        if (allSuccess) {
          if (!silent) toast.success("บันทึกการตั้งค่าเรียบร้อย");
          setInitialData({
            social_automation_keywords: keywords,
            social_post_template: templates.social.th,
            social_post_template_en: templates.social.en,
            social_post_template_cn: templates.social.cn,
            line_post_template: templates.line.th,
            line_post_template_en: templates.line.en,
            line_post_template_cn: templates.line.cn,
            tiktok_post_template: templates.tiktok.th,
            tiktok_post_template_en: templates.tiktok.en,
            tiktok_post_template_cn: templates.tiktok.cn,
          });
        } else if (!silent) {
          toast.error("เกิดข้อผิดพลาดในการบันทึกบางรายการ");
        }
      } catch (error) {
        if (!silent) toast.error("เกิดข้อผิดพลาดในการบันทึก");
      }
    });
  };

  // Debounced Auto-Save Logic
  useEffect(() => {
    if (!hasChanges) return;

    // Check validation before auto-saving
    const isValid = !keywords.some((k) => !k.keyword || !k.dm_content);
    if (!isValid) return;

    const timer = setTimeout(() => {
      handleSave(true);
    }, 3000); // 3 seconds delay for auto-save

    return () => clearTimeout(timer);
  }, [keywords, templates, hasChanges]);

  const handleAiGenerate = async (
    type: "SOCIAL_POST" | "KEYWORD_DM" | "LINE_POST" | "TIKTOK_POST",
    index?: number,
  ) => {
    const keyword = index !== undefined ? keywords[index]?.keyword : undefined;
    const loadingId =
      index !== undefined
        ? `dm-${index}`
        : type === "SOCIAL_POST"
          ? "social-post"
          : type === "TIKTOK_POST"
            ? "tiktok-post"
            : "line-post";

    setIsGenerating(loadingId);
    try {
      if (type === "KEYWORD_DM") {
        const res = await generateSocialAutomationTemplatesAction(
          type,
          keyword,
          activeTab,
        );
        if (res.success && res.data && index !== undefined) {
          updateRow(index, { dm_content: res.data });
          toast.success("สร้างข้อความตอบกลับด้วย AI เรียบร้อย");
        } else {
          toast.error(res.message || "เกิดข้อผิดพลาดในการสร้างข้อความ");
        }
      } else {
        // Multi-language generation for Global Templates
        const languages: ("th" | "en" | "cn")[] = ["th", "en", "cn"];
        toast.info("กำลังสร้างเนื้อหาทั้ง 3 ภาษาด้วย AI...");

        const results = await Promise.all(
          languages.map((lang) =>
            generateSocialAutomationTemplatesAction(type, keyword, lang),
          ),
        );

        const platformMap: Record<string, "social" | "line" | "tiktok"> = {
          SOCIAL_POST: "social",
          LINE_POST: "line",
          TIKTOK_POST: "tiktok",
        };
        const platform = platformMap[type];

        let successCount = 0;
        results.forEach((res, i) => {
          if (res.success && res.data && platform) {
            updateTemplate(platform, languages[i], res.data);
            successCount++;
          }
        });

        if (successCount === 3) {
          toast.success("สร้างเนื้อหาครบทั้ง 3 ภาษาแล้วครับ ✨");
        } else if (successCount > 0) {
          toast.success(`สร้างเนื้อหาสำเร็จ ${successCount}/3 ภาษา`);
        } else {
          toast.error("ไม่สามารถสร้างเนื้อหาได้ กรุณาลองใหม่อีกครั้ง");
        }
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ AI");
    } finally {
      setIsGenerating(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <KeywordAutomationCard
        keywords={keywords}
        addRow={addRow}
        removeRow={removeRow}
        updateRow={updateRow}
        handleSave={handleSave}
        handleAiGenerate={handleAiGenerate}
        isPending={isPending}
        hasChanges={hasChanges}
        isGenerating={isGenerating}
        scrollToTemplate={scrollToTemplate}
      />

      <TemplateEditorCard
        activePlatform={activePlatform}
        setActivePlatform={setActivePlatform}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        templates={templates}
        updateTemplate={updateTemplate}
        handleAiGenerate={(type) => handleAiGenerate(type)}
        isGenerating={isGenerating}
        isPending={isPending}
        hasChanges={hasChanges}
        handleSave={handleSave}
        templateSectionRef={templateSectionRef}
      />
    </div>
  );
}
