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
import {
  SiteSettingKey,
  SocialKeyword,
  SiteSettings,
} from "@/features/site-settings/schema";

// Extracted Components
import { KeywordAutomationCard } from "./social-automation/KeywordAutomationCard";
import { TemplateEditorCard } from "./social-automation/TemplateEditorCard";

export function SocialAutomationSettings({
  lineBotInfo,
  initialSettings,
}: {
  lineBotInfo?: any;
  initialSettings?: SiteSettings;
}) {
  const [keywords, setKeywords] = useState<SocialKeyword[]>(
    initialSettings?.social_automation_keywords || [],
  );
  const [templates, setTemplates] = useState({
    facebook: {
      th: initialSettings?.facebook_post_template || "",
      en: initialSettings?.facebook_post_template_en || "",
      cn: initialSettings?.facebook_post_template_cn || "",
      ru: initialSettings?.facebook_post_template_ru || "",
    },
    instagram: {
      th: initialSettings?.instagram_post_template || "",
      en: initialSettings?.instagram_post_template_en || "",
      cn: initialSettings?.instagram_post_template_cn || "",
      ru: initialSettings?.instagram_post_template_ru || "",
    },
    tiktok: {
      th: initialSettings?.tiktok_post_template || "",
      en: initialSettings?.tiktok_post_template_en || "",
      cn: initialSettings?.tiktok_post_template_cn || "",
      ru: initialSettings?.tiktok_post_template_ru || "",
    },
    line: {
      th: initialSettings?.line_post_template || "",
      en: initialSettings?.line_post_template_en || "",
      cn: initialSettings?.line_post_template_cn || "",
      ru: initialSettings?.line_post_template_ru || "",
    },
  });

  const [activeTab, setActiveTab] = useState<"th" | "en" | "cn" | "ru">("th");
  const [activePlatform, setActivePlatform] = useState<
    "facebook" | "instagram" | "line" | "tiktok"
  >("facebook");

  const [tiktokConnected, setTiktokConnected] = useState(
    !!initialSettings?.tiktok_auth_token,
  );
  const [tiktokMetadata, setTiktokMetadata] = useState<{
    display_name?: string;
    avatar_url?: string;
  }>({
    display_name: initialSettings?.tiktok_auth_token?.display_name,
    avatar_url: initialSettings?.tiktok_auth_token?.avatar_url,
  });
  const [metaConnected, setMetaConnected] = useState(
    !!initialSettings?.meta_page_access_token,
  );
  const [metaPageName, setMetaPageName] = useState(
    initialSettings?.meta_page_name || "",
  );
  const [isLoading, setIsLoading] = useState(!initialSettings);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [initialData, setInitialData] = useState<SiteSettings | null>(
    initialSettings || null,
  );
  
  const templateSectionRef = useRef<HTMLDivElement>(null);

  const scrollToTemplate = () => {
    templateSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    // Only load if initialSettings wasn't provided or we need to refresh
    if (initialSettings && initialData) {
      return;
    }
    
    async function load() {
      setIsLoading(true);
      try {
        const settings = await getSiteSettings();
        setKeywords(settings.social_automation_keywords || []);
        setTemplates({
          facebook: {
            th: settings.facebook_post_template || "",
            en: settings.facebook_post_template_en || "",
            cn: settings.facebook_post_template_cn || "",
            ru: settings.facebook_post_template_ru || "",
          },
          instagram: {
            th: settings.instagram_post_template || "",
            en: settings.instagram_post_template_en || "",
            cn: settings.instagram_post_template_cn || "",
            ru: settings.instagram_post_template_ru || "",
          },
          tiktok: {
            th: settings.tiktok_post_template || "",
            en: settings.tiktok_post_template_en || "",
            cn: settings.tiktok_post_template_cn || "",
            ru: settings.tiktok_post_template_ru || "",
          },
          line: {
            th: settings.line_post_template || "",
            en: settings.line_post_template_en || "",
            cn: settings.line_post_template_cn || "",
            ru: settings.line_post_template_ru || "",
          },
        });
        setTiktokConnected(!!settings.tiktok_auth_token);
        if (settings.tiktok_auth_token) {
          setTiktokMetadata({
            display_name: settings.tiktok_auth_token.display_name,
            avatar_url: settings.tiktok_auth_token.avatar_url,
          });
        }
        setMetaConnected(!!settings.meta_page_access_token);
        setMetaPageName(settings.meta_page_name || "");
        setInitialData(settings);
      } catch (err) {
        toast.error("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [initialSettings, initialData]);

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
    platform: "facebook" | "instagram" | "line" | "tiktok",
    lang: "th" | "en" | "cn" | "ru",
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
      templates.facebook.th !== (initialData.facebook_post_template || "") ||
      templates.facebook.en !== (initialData.facebook_post_template_en || "") ||
      templates.facebook.cn !== (initialData.facebook_post_template_cn || "") ||
      templates.facebook.ru !== (initialData.facebook_post_template_ru || "") ||
      templates.instagram.th !== (initialData.instagram_post_template || "") ||
      templates.instagram.en !== (initialData.instagram_post_template_en || "") ||
      templates.instagram.cn !== (initialData.instagram_post_template_cn || "") ||
      templates.instagram.ru !== (initialData.instagram_post_template_ru || "") ||
      templates.line.th !== (initialData.line_post_template || "") ||
      templates.line.en !== (initialData.line_post_template_en || "") ||
      templates.line.cn !== (initialData.line_post_template_cn || "") ||
      templates.line.ru !== (initialData.line_post_template_ru || "") ||
      templates.tiktok.th !== (initialData.tiktok_post_template || "") ||
      templates.tiktok.en !== (initialData.tiktok_post_template_en || "") ||
      templates.tiktok.cn !== (initialData.tiktok_post_template_cn || "") ||
      templates.tiktok.ru !== (initialData.tiktok_post_template_ru || "")
    : false;

  const handleSave = (silent = false) => {
    if (!silent && keywords.some((k) => !k.keyword || !k.dm_content)) {
      toast.error("กรุณากรอก Keyword และข้อความ DM ให้ครบถ้วน");
      return;
    }

    startTransition(async () => {
      try {
        if (!initialData) return;

        const promises = [];

        if (
          JSON.stringify(keywords) !==
          JSON.stringify(initialData.social_automation_keywords || [])
        ) {
          promises.push(
            updateSiteSetting(
              "social_automation_keywords",
              keywords.map((k) => k.keyword),
            ).then((r) => ({ key: "social_automation_keywords", ...r }))
          );
        }

        const templateMappings: { key: SiteSettingKey; value: string; initial: string }[] = [
          { key: "facebook_post_template", value: templates.facebook.th, initial: initialData.facebook_post_template || "" },
          { key: "facebook_post_template_en", value: templates.facebook.en, initial: initialData.facebook_post_template_en || "" },
          { key: "facebook_post_template_cn", value: templates.facebook.cn, initial: initialData.facebook_post_template_cn || "" },
          { key: "facebook_post_template_ru", value: templates.facebook.ru, initial: initialData.facebook_post_template_ru || "" },
          { key: "instagram_post_template", value: templates.instagram.th, initial: initialData.instagram_post_template || "" },
          { key: "instagram_post_template_en", value: templates.instagram.en, initial: initialData.instagram_post_template_en || "" },
          { key: "instagram_post_template_cn", value: templates.instagram.cn, initial: initialData.instagram_post_template_cn || "" },
          { key: "instagram_post_template_ru", value: templates.instagram.ru, initial: initialData.instagram_post_template_ru || "" },
          { key: "line_post_template", value: templates.line.th, initial: initialData.line_post_template || "" },
          { key: "line_post_template_en", value: templates.line.en, initial: initialData.line_post_template_en || "" },
          { key: "line_post_template_cn", value: templates.line.cn, initial: initialData.line_post_template_cn || "" },
          { key: "line_post_template_ru", value: templates.line.ru, initial: initialData.line_post_template_ru || "" },
          { key: "tiktok_post_template", value: templates.tiktok.th, initial: initialData.tiktok_post_template || "" },
          { key: "tiktok_post_template_en", value: templates.tiktok.en, initial: initialData.tiktok_post_template_en || "" },
          { key: "tiktok_post_template_cn", value: templates.tiktok.cn, initial: initialData.tiktok_post_template_cn || "" },
          { key: "tiktok_post_template_ru", value: templates.tiktok.ru, initial: initialData.tiktok_post_template_ru || "" },
        ];

        for (const mapping of templateMappings) {
          if (mapping.value !== mapping.initial) {
            promises.push(
              updateSiteSetting(mapping.key, mapping.value).then((r) => ({
                key: mapping.key,
                ...r,
              }))
            );
          }
        }

        if (promises.length === 0) {
          return;
        }

        const results = await Promise.all(promises);
        const allSuccess = results.every((r) => r.success);

        if (allSuccess) {
          if (!silent) toast.success("บันทึกการตั้งค่าเรียบร้อย");
          setInitialData({
            ...initialData,
            social_automation_keywords: keywords,
            facebook_post_template: templates.facebook.th,
            facebook_post_template_en: templates.facebook.en,
            facebook_post_template_cn: templates.facebook.cn,
            facebook_post_template_ru: templates.facebook.ru,
            instagram_post_template: templates.instagram.th,
            instagram_post_template_en: templates.instagram.en,
            instagram_post_template_cn: templates.instagram.cn,
            instagram_post_template_ru: templates.instagram.ru,
            line_post_template: templates.line.th,
            line_post_template_en: templates.line.en,
            line_post_template_cn: templates.line.cn,
            line_post_template_ru: templates.line.ru,
            tiktok_post_template: templates.tiktok.th,
            tiktok_post_template_en: templates.tiktok.en,
            tiktok_post_template_cn: templates.tiktok.cn,
            tiktok_post_template_ru: templates.tiktok.ru,
          });
        } else if (!silent) {
          const failedKeys = results
            .filter((r) => !r.success)
            .map((r) => r.key)
            .join(", ");
          toast.error(`เกิดข้อผิดพลาดในการบันทึกบางรายการ: ${failedKeys}`);
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
          ? `${activePlatform}-post`
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
        const languages: ("th" | "en" | "cn" | "ru")[] = ["th", "en", "cn", "ru"];
        toast.info("กำลังสร้างเนื้อหาทั้ง 4 ภาษาด้วย AI...");

        const results = await Promise.all(
          languages.map((lang) =>
            generateSocialAutomationTemplatesAction(
              type,
              type === "SOCIAL_POST" ? activePlatform : keyword,
              lang,
            ),
          ),
        );

        const platformMap: Record<string, "facebook" | "instagram" | "line" | "tiktok"> = {
          SOCIAL_POST: activePlatform === "instagram" ? "instagram" : "facebook",
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

        if (successCount === 4) {
          toast.success("สร้างเนื้อหาครบทั้ง 4 ภาษาแล้วครับ ✨");
        } else if (successCount > 0) {
          toast.success(`สร้างเนื้อหาสำเร็จ ${successCount}/4 ภาษา`);
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
        tiktokConnected={tiktokConnected}
        tiktokMetadata={tiktokMetadata}
        lineBotInfo={lineBotInfo}
        metaConnected={metaConnected}
        metaPageName={metaPageName}
      />
    </div>
  );
}
