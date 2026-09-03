"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  getSiteSettings,
  updateSiteSetting,
  generateSocialAutomationTemplatesAction,
} from "@/features/site-settings/actions";
import {
  SocialKeyword,
  SocialButton,
  SiteSettings,
} from "@/features/site-settings/schema";
import { useLanguage } from "@/lib/i18n/language-context";

// Extracted Components
import { KeywordAutomationCard } from "./social-automation/KeywordAutomationCard";
import { TemplateEditorCard } from "./social-automation/TemplateEditorCard";
import { PhoneSimulator } from "./social-automation/PhoneSimulator";

export function SocialAutomationSettings({
  lineBotInfo,
  initialSettings,
  mode = "automation",
}: {
  lineBotInfo?: any;
  initialSettings?: SiteSettings;
  mode?: "social" | "automation";
}) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [keywords, setKeywords] = useState<SocialKeyword[]>(
    initialSettings?.social_automation_keywords || [],
  );

  const [instagramStoryReplyEnabled, setInstagramStoryReplyEnabled] = useState(
    !!initialSettings?.instagram_story_reply_enabled
  );
  const [directDmReplyEnabled, setDirectDmReplyEnabled] = useState(
    !!initialSettings?.direct_dm_reply_enabled
  );
  const [storyAdsWelcomeMessages, setStoryAdsWelcomeMessages] = useState({
    th: initialSettings?.story_ads_welcome_message ||
      "เซฮายยย ขอบคุณที่แวะมาสอบถามน้า ✨\nยินดีให้บริการค่ะ ต้องการสอบถามข้อมูลห้อง นัดชมสถานที่จริง หรือพูดคุยกับทีมงาน เลือกรายการด้านล่างได้เลยน้าาา 💕",
    en: initialSettings?.story_ads_welcome_message_en ||
      "Hello! Thank you for reaching out ✨\nWe're delighted to assist you. Would you like to schedule a viewing, check available units, or chat with our team? Please choose an option below 💕",
    cn: initialSettings?.story_ads_welcome_message_cn ||
      "您好！感谢您的咨询 ✨\n很高兴为您服务。如果您想预约看房、查看最新房源或与客服交谈，请选择下方选项 💕",
    ru: initialSettings?.story_ads_welcome_message_ru ||
      "Здравствуйте! Спасибо за обращение ✨\nБудем рады помочь! Выберите нужный пункт ниже: запись на просмотр, свободные варианты или связь с менеджером 💕",
  });
  const [storyAdsTab, setStoryAdsTab] = useState<"th" | "en" | "cn" | "ru">("th");
  const [storyAdsButtonsEnabled, setStoryAdsButtonsEnabled] = useState(
    initialSettings?.story_ads_buttons_enabled !== false
  );
  const [storyAdsCustomButtons, setStoryAdsCustomButtons] = useState<SocialButton[]>(
    initialSettings?.story_ads_custom_buttons || []
  );
  const [autoFeaturedCarouselEnabled, setAutoFeaturedCarouselEnabled] = useState(
    initialSettings?.auto_featured_carousel_enabled !== false
  );
  const [followGateEnabled, setFollowGateEnabled] = useState(
    !!initialSettings?.follow_gate_enabled
  );
  const [leadCaptureGateEnabled, setLeadCaptureGateEnabled] = useState(
    !!initialSettings?.lead_capture_gate_enabled
  );
  const [simulatorTab, setSimulatorTab] = useState<"post" | "comments" | "dm">("post");
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
  const [isDirty, setIsDirty] = useState(false);
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
        setInstagramStoryReplyEnabled(!!settings.instagram_story_reply_enabled);
        setDirectDmReplyEnabled(!!settings.direct_dm_reply_enabled);
        setStoryAdsWelcomeMessages({
          th: settings.story_ads_welcome_message ||
            "เซฮายยย ขอบคุณที่แวะมาสอบถามน้า ✨\nยินดีให้บริการค่ะ ต้องการสอบถามข้อมูลห้อง นัดชมสถานที่จริง หรือพูดคุยกับทีมงาน เลือกรายการด้านล่างได้เลยน้าาา 💕",
          en: settings.story_ads_welcome_message_en ||
            "Hello! Thank you for reaching out ✨\nWe're delighted to assist you. Would you like to schedule a viewing, check available units, or chat with our team? Please choose an option below 💕",
          cn: settings.story_ads_welcome_message_cn ||
            "您好！感谢您的咨询 ✨\n很高兴为您服务。如果您想预约看房、查看最新房源或与客服交谈，请选择下方选项 💕",
          ru: settings.story_ads_welcome_message_ru ||
            "Здравствуйте! Спасибо за обращение ✨\nБудем рады помочь! Выберите нужный пункт ниже: запись на просмотр, свободные варианты или связь с менеджером 💕",
        });
        setStoryAdsButtonsEnabled(settings.story_ads_buttons_enabled !== false);
        setStoryAdsCustomButtons(settings.story_ads_custom_buttons || []);
        setAutoFeaturedCarouselEnabled(settings.auto_featured_carousel_enabled !== false);
        setFollowGateEnabled(!!settings.follow_gate_enabled);
        setLeadCaptureGateEnabled(!!settings.lead_capture_gate_enabled);
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
        toast.error(isEn ? "Failed to load automation data" : "ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [initialSettings, isEn, initialData]);

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
    setKeywords(keywords.map((k, i) => (i === index ? { ...k, ...data } : k)));
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

  // Auto-compute isDirty by comparing state to last saved snapshot
  useEffect(() => {
    if (!initialData) return;

    // Helper to normalize keyword fields to avoid mismatch between undefined/null/""
    const normalizeKeywords = (list: any[]) => {
      return list.map((k) => ({
        keyword: (k.keyword || "").trim(),
        dm_content: (k.dm_content || "").trim(),
        public_reply: (k.public_reply || "").trim(),
        public_replies: (k.public_replies || []).map((r: string) => r.trim()).filter(Boolean),
        enabled: k.enabled !== false,
        language: k.language || "th",
        buttons: (k.buttons || []).map((b: any) => ({
          title: (b.title || "").trim(),
          type: b.type || "postback",
          url: (b.url || "").trim() || undefined,
        })),
        linked_post_id: k.linked_post_id || undefined,
        linked_post_preview: k.linked_post_preview || undefined,
      }));
    };

    const kw = JSON.stringify(normalizeKeywords(keywords));
    const savedKw = JSON.stringify(normalizeKeywords(initialData.social_automation_keywords || []));

    const checkTemplate = (p: any, dbTh: any, dbEn: any, dbCn: any, dbRu: any) => {
      return (
        (p.th || "").trim() !== (dbTh || "").trim() ||
        (p.en || "").trim() !== (dbEn || "").trim() ||
        (p.cn || "").trim() !== (dbCn || "").trim() ||
        (p.ru || "").trim() !== (dbRu || "").trim()
      );
    };

    const changed =
      kw !== savedKw ||
      instagramStoryReplyEnabled !== !!initialData.instagram_story_reply_enabled ||
      directDmReplyEnabled !== !!initialData.direct_dm_reply_enabled ||
      checkTemplate(storyAdsWelcomeMessages, initialData.story_ads_welcome_message, initialData.story_ads_welcome_message_en, initialData.story_ads_welcome_message_cn, initialData.story_ads_welcome_message_ru) ||
      storyAdsButtonsEnabled !== (initialData.story_ads_buttons_enabled !== false) ||
      JSON.stringify(storyAdsCustomButtons) !== JSON.stringify(initialData.story_ads_custom_buttons || []) ||
      autoFeaturedCarouselEnabled !== (initialData.auto_featured_carousel_enabled !== false) ||
      followGateEnabled !== !!initialData.follow_gate_enabled ||
      leadCaptureGateEnabled !== !!initialData.lead_capture_gate_enabled ||
      checkTemplate(templates.facebook, initialData.facebook_post_template, initialData.facebook_post_template_en, initialData.facebook_post_template_cn, initialData.facebook_post_template_ru) ||
      checkTemplate(templates.instagram, initialData.instagram_post_template, initialData.instagram_post_template_en, initialData.instagram_post_template_cn, initialData.instagram_post_template_ru) ||
      checkTemplate(templates.tiktok, initialData.tiktok_post_template, initialData.tiktok_post_template_en, initialData.tiktok_post_template_cn, initialData.tiktok_post_template_ru) ||
      checkTemplate(templates.line, initialData.line_post_template, initialData.line_post_template_en, initialData.line_post_template_cn, initialData.line_post_template_ru);

    setIsDirty(changed);
  }, [keywords, instagramStoryReplyEnabled, directDmReplyEnabled, storyAdsWelcomeMessages, storyAdsButtonsEnabled, storyAdsCustomButtons, autoFeaturedCarouselEnabled, followGateEnabled, leadCaptureGateEnabled, templates, initialData]);

  const hasChanges = isDirty;

  const handleSave = (silent = false) => {
    if (!silent && keywords.some((k) => !k.keyword || !k.dm_content)) {
      toast.error(isEn ? "Please fill in all keyword and DM content fields" : "กรุณากรอก Keyword และข้อความ DM ให้ครบถ้วน");
      return;
    }

    startTransition(async () => {
      try {
        const results = await Promise.all([
          updateSiteSetting("social_automation_keywords", keywords as any).then((r) => ({ key: "social_automation_keywords", ...r })),
          updateSiteSetting("instagram_story_reply_enabled", instagramStoryReplyEnabled).then((r) => ({ key: "instagram_story_reply_enabled", ...r })),
          updateSiteSetting("direct_dm_reply_enabled", directDmReplyEnabled).then((r) => ({ key: "direct_dm_reply_enabled", ...r })),
          updateSiteSetting("story_ads_welcome_message", storyAdsWelcomeMessages.th).then((r) => ({ key: "story_ads_welcome_message", ...r })),
          updateSiteSetting("story_ads_welcome_message_en", storyAdsWelcomeMessages.en).then((r) => ({ key: "story_ads_welcome_message_en", ...r })),
          updateSiteSetting("story_ads_welcome_message_cn", storyAdsWelcomeMessages.cn).then((r) => ({ key: "story_ads_welcome_message_cn", ...r })),
          updateSiteSetting("story_ads_welcome_message_ru", storyAdsWelcomeMessages.ru).then((r) => ({ key: "story_ads_welcome_message_ru", ...r })),
          updateSiteSetting("story_ads_buttons_enabled", storyAdsButtonsEnabled).then((r) => ({ key: "story_ads_buttons_enabled", ...r })),
          updateSiteSetting("story_ads_custom_buttons", storyAdsCustomButtons as any).then((r) => ({ key: "story_ads_custom_buttons", ...r })),
          updateSiteSetting("auto_featured_carousel_enabled", autoFeaturedCarouselEnabled).then((r) => ({ key: "auto_featured_carousel_enabled", ...r })),
          updateSiteSetting("follow_gate_enabled", followGateEnabled).then((r) => ({ key: "follow_gate_enabled", ...r })),
          updateSiteSetting("lead_capture_gate_enabled", leadCaptureGateEnabled).then((r) => ({ key: "lead_capture_gate_enabled", ...r })),
          updateSiteSetting("facebook_post_template", templates.facebook.th).then((r) => ({ key: "facebook_post_template", ...r })),
          updateSiteSetting("facebook_post_template_en", templates.facebook.en).then((r) => ({ key: "facebook_post_template_en", ...r })),
          updateSiteSetting("facebook_post_template_cn", templates.facebook.cn).then((r) => ({ key: "facebook_post_template_cn", ...r })),
          updateSiteSetting("facebook_post_template_ru", templates.facebook.ru).then((r) => ({ key: "facebook_post_template_ru", ...r })),
          updateSiteSetting("instagram_post_template", templates.instagram.th).then((r) => ({ key: "instagram_post_template", ...r })),
          updateSiteSetting("instagram_post_template_en", templates.instagram.en).then((r) => ({ key: "instagram_post_template_en", ...r })),
          updateSiteSetting("instagram_post_template_cn", templates.instagram.cn).then((r) => ({ key: "instagram_post_template_cn", ...r })),
          updateSiteSetting("instagram_post_template_ru", templates.instagram.ru).then((r) => ({ key: "instagram_post_template_ru", ...r })),
          updateSiteSetting("line_post_template", templates.line.th).then((r) => ({ key: "line_post_template", ...r })),
          updateSiteSetting("line_post_template_en", templates.line.en).then((r) => ({ key: "line_post_template_en", ...r })),
          updateSiteSetting("line_post_template_cn", templates.line.cn).then((r) => ({ key: "line_post_template_cn", ...r })),
          updateSiteSetting("line_post_template_ru", templates.line.ru).then((r) => ({ key: "line_post_template_ru", ...r })),
          updateSiteSetting("tiktok_post_template", templates.tiktok.th).then((r) => ({ key: "tiktok_post_template", ...r })),
          updateSiteSetting("tiktok_post_template_en", templates.tiktok.en).then((r) => ({ key: "tiktok_post_template_en", ...r })),
          updateSiteSetting("tiktok_post_template_cn", templates.tiktok.cn).then((r) => ({ key: "tiktok_post_template_cn", ...r })),
          updateSiteSetting("tiktok_post_template_ru", templates.tiktok.ru).then((r) => ({ key: "tiktok_post_template_ru", ...r })),
        ]);

        const allSuccess = results.every((r) => r.success);

        if (allSuccess) {
          if (!silent) toast.success(isEn ? "Settings saved successfully ✅" : "บันทึกการตั้งค่าเรียบร้อย ✅");
          setIsDirty(false);
        } else if (!silent) {
          const failedKeys = results
            .filter((r) => !r.success)
            .map((r) => r.key)
            .join(", ");
          toast.error(isEn ? `Failed to save some items: ${failedKeys}` : `เกิดข้อผิดพลาดในการบันทึกบางรายการ: ${failedKeys}`);
        }
      } catch (error) {
        if (!silent) toast.error(isEn ? "Error saving settings" : "เกิดข้อผิดพลาดในการบันทึก");
      }
    });
  };

  // Auto-Save disabled by user request. Saving is now fully manual.

  const handleAiGenerate = async (
    type: "SOCIAL_POST" | "INSTAGRAM_POST" | "KEYWORD_DM" | "LINE_POST" | "TIKTOK_POST",
    index?: number,
  ) => {
    const keyword = index !== undefined ? keywords[index]?.keyword : undefined;
    const loadingId =
      index !== undefined
        ? `dm-${index}`
        : type === "SOCIAL_POST"
          ? "facebook-post"
          : type === "INSTAGRAM_POST"
            ? "instagram-post"
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
          toast.success(isEn ? "AI DM response generated successfully" : "สร้างข้อความตอบกลับด้วย AI เรียบร้อย");
        } else {
          toast.error(res.message || (isEn ? "Failed to generate message" : "เกิดข้อผิดพลาดในการสร้างข้อความ"));
        }
      } else {
        // Multi-language generation for Global Templates
        const languages: ("th" | "en" | "cn" | "ru")[] = ["th", "en", "cn", "ru"];
        toast.info(isEn ? "Generating content across 4 languages with AI..." : "กำลังสร้างเนื้อหาทั้ง 4 ภาษาด้วย AI...");

        const results = await Promise.all(
          languages.map((lang) =>
            generateSocialAutomationTemplatesAction(
              type,
              type === "SOCIAL_POST" ? "facebook" : type === "INSTAGRAM_POST" ? "instagram" : keyword,
              lang,
            ),
          ),
        );

        const platformMap: Record<string, "facebook" | "instagram" | "line" | "tiktok"> = {
          SOCIAL_POST: "facebook",
          INSTAGRAM_POST: "instagram",
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
          toast.success(isEn ? "Generated content in all 4 languages ✨" : "สร้างเนื้อหาครบทั้ง 4 ภาษาแล้วครับ ✨");
        } else if (successCount > 0) {
          toast.success(isEn ? `Generated content for ${successCount}/4 languages` : `สร้างเนื้อหาสำเร็จ ${successCount}/4 ภาษา`);
        } else {
          toast.error(isEn ? "Failed to generate content. Please try again." : "ไม่สามารถสร้างเนื้อหาได้ กรุณาลองใหม่อีกครั้ง");
        }
      }
    } catch (err) {
      toast.error(isEn ? "Error connecting to AI service" : "เกิดข้อผิดพลาดในการเชื่อมต่อ AI");
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

  if (mode === "social") {
    return (
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
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Form Editor */}
      <div className="lg:col-span-8 space-y-6">
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

        {/* Triggers and Gates Advanced Options */}
        <Card className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden ring-1 ring-slate-900/5">
          <CardHeader className="bg-linear-to-b from-white to-slate-50/50 border-b border-slate-200 pb-6">
            <CardTitle className="text-lg font-semibold text-slate-900">
              {isEn ? "Advanced Triggers & Premium Gates" : "เงื่อนไขทริกเกอร์และฟีเจอร์ขั้นสูง (Triggers & Gates)"}
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              {isEn ? "Configure automation triggers and interactive gates for your social channels" : "เปิด/ปิดจุดเชื่อมโยงทริกเกอร์และฟีเจอร์พรีเมียมสำหรับเพจของคุณ"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Triggers Section */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                {isEn ? "Automation Triggers" : "เงื่อนไขทริกเกอร์ (Automation Triggers)"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">
                      {isEn ? "Story Comments Reply" : "ตอบกลับเมื่อคอมเมนต์ใต้สตอรี่"}
                    </div>
                    <div className="text-xs text-slate-400">Replies to a story</div>
                  </div>
                  <Switch
                    checked={instagramStoryReplyEnabled}
                    onCheckedChange={(v) => { setInstagramStoryReplyEnabled(v); setIsDirty(true); }}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">
                      {isEn ? "Instant Direct DM Reply" : "ตอบกลับข้อความตรงทันที"}
                    </div>
                    <div className="text-xs text-slate-400">Direct DMs response</div>
                  </div>
                  <Switch
                    checked={directDmReplyEnabled}
                    onCheckedChange={(v) => { setDirectDmReplyEnabled(v); setIsDirty(true); }}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Premium Gates Section */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                {isEn ? "Premium Automation Gates" : "ระบบประตูกรองแชต (Premium Automation Gates)"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">Follow Gate</div>
                    <div className="text-xs text-slate-400">
                      {isEn ? "Must follow account before receiving info" : "ต้องติดตามบัญชีก่อนรับข้อมูล"}
                    </div>
                  </div>
                  <Switch
                    checked={followGateEnabled}
                    onCheckedChange={(v) => { setFollowGateEnabled(v); setIsDirty(true); }}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">Lead Capture Gate</div>
                    <div className="text-xs text-slate-400">
                      {isEn ? "Request email/phone before sending links" : "ขออีเมล/เบอร์โทรศัพท์ลูกค้าก่อนเฉลยส่งลิงก์"}
                    </div>
                  </div>
                  <Switch
                    checked={leadCaptureGateEnabled}
                    onCheckedChange={(v) => { setLeadCaptureGateEnabled(v); setIsDirty(true); }}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Story Ads & Smart Auto-Reply Flow */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isEn ? "Story Ads & General Welcome Flow" : "ระบบต้อนรับ Story Ads & ข้อความกว้าง (Story Ads Flow)"}
                </h4>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ">
                  Smart Fallback & Lead Capture
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                {isEn
                  ? "When users comment or reply to Story Ads, the CRM sends a welcoming message with interactive action buttons and featured property cards without broken variable brackets."
                  : "เมื่อลูกค้าตอบกลับหรือทักมาจาก Story Ads ระบบจะส่งข้อความต้อนรับสุภาพ พร้อมปุ่มกดด่วน และการ์ดห้องแนะนำอัตโนมัติ โดยไม่เกิดปัญหาตัวแปรหลุด []"}
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                    <div>
                      <div className="text-sm font-semibold text-slate-700">
                        {isEn ? "3 Quick Action Buttons" : "ปุ่มกดด่วน 3 ตัวเลือก"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {isEn ? "📅 Book Viewing, 🏠 Browse Rooms, 💬 Talk to Admin" : "📅 นัดดูห้องจริง, 🏠 ห้องว่าง/ราคา, 💬 คุยกับแอดมิน"}
                      </div>
                    </div>
                    <Switch
                      checked={storyAdsButtonsEnabled}
                      onCheckedChange={(v) => { setStoryAdsButtonsEnabled(v); setIsDirty(true); }}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                    <div>
                      <div className="text-sm font-semibold text-slate-700">
                        {isEn ? "Auto Featured Carousel" : "ส่งการ์ดห้องแนะนำอัตโนมัติ"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {isEn ? "Send top available rooms when no specific property is linked" : "ส่ง Carousel รวมห้องเด่นจากระบบเมื่อไม่มีห้องเฉพาะ"}
                      </div>
                    </div>
                    <Switch
                      checked={autoFeaturedCarouselEnabled}
                      onCheckedChange={(v) => { setAutoFeaturedCarouselEnabled(v); setIsDirty(true); }}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-600 block">
                      {isEn ? "Story Ads Welcome Message Template" : "ข้อความต้อนรับสำหรับ Story Ads / แอดกว้าง"}
                    </label>
                    
                    {/* Language Tabs */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                      {[
                        { key: "th", label: "🇹🇭 TH" },
                        { key: "en", label: "🇬🇧 EN" },
                        { key: "cn", label: "🇨🇳 CN" },
                        { key: "ru", label: "🇷🇺 RU" },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setStoryAdsTab(tab.key as any)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all ${
                            storyAdsTab === tab.key
                              ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                              : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={storyAdsWelcomeMessages[storyAdsTab]}
                    onChange={(e) => {
                      setStoryAdsWelcomeMessages((prev) => ({
                        ...prev,
                        [storyAdsTab]: e.target.value,
                      }));
                      setIsDirty(true);
                    }}
                    placeholder={
                      storyAdsTab === "en"
                        ? "Hello! Thank you for reaching out ✨..."
                        : storyAdsTab === "cn"
                        ? "您好！感谢您的咨询 ✨..."
                        : storyAdsTab === "ru"
                        ? "Здравствуйте! Спасибо за обращение ✨..."
                        : "เซฮายยย ขอบคุณที่แวะมาสอบถามน้า ✨..."
                    }
                    className="w-full text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="flex items-center justify-between mt-1 mb-4">
                    <span className="text-[11px] text-slate-400">
                      {isEn
                        ? "💡 Tip: Auto-detects user language (TH/EN/CN/RU) and replies in their language seamlessly."
                        : "💡 ระบบจะตรวจจับภาษาของลูกค้า (ไทย/อังกฤษ/จีน/รัสเซีย) และส่งข้อความตามภาษาที่ลูกค้าพิมพ์มาโดยอัตโนมัติ"}
                    </span>
                  </div>

                  {/* Story Ads Custom Buttons Builder */}
                  {storyAdsButtonsEnabled && (
                    <div className="p-4 bg-slate-50/70 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <span>{isEn ? "Interactive Buttons (Max 3)" : "ปุ่มกดของข้อความต้อนรับ (สูงสุด 3 ปุ่ม)"}</span>
                            <span className="text-[10px] font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                              {storyAdsCustomButtons.length > 0 ? `${storyAdsCustomButtons.length}/3 Custom` : "3 Default"}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {isEn
                              ? "Add direct links to your website or interactive chatbot actions"
                              : "ใส่ลิงก์ตรงไปยังเว็บไซต์ หรือเลือกการกระทำในแชท"}
                          </div>
                        </div>

                        {storyAdsCustomButtons.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setStoryAdsCustomButtons([]);
                              setIsDirty(true);
                            }}
                            className="text-[11px] text-slate-500 hover:text-red-600 dark:text-slate-400 font-medium transition-colors"
                          >
                            {isEn ? "Reset to Defaults" : "รีเซ็ตเป็นปุ่มมาตรฐาน"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setStoryAdsCustomButtons([
                                { title: "📅 นัดดูห้องจริง", type: "postback", payload: "ACTION_BOOK_VIEWING" },
                                { title: "🌐 ชมเว็บไซต์เรา", type: "web_url", url: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/properties` : "https://vccasset.com/properties" },
                                { title: "💬 คุยกับแอดมิน", type: "postback", payload: "ACTION_TALK_ADMIN" },
                              ]);
                              setIsDirty(true);
                            }}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg transition-all"
                          >
                            + {isEn ? "Customize Buttons" : "กำหนดปุ่มเอง (เช่น ใส่ลิงก์เว็บ)"}
                          </button>
                        )}
                      </div>

                      {storyAdsCustomButtons.length === 0 ? (
                        <div className="text-xs text-slate-500 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-500">✓</span>
                            <span>
                              {isEn
                                ? "Using 3 Smart Buttons: 📅 Book Viewing, 🏠 Available Units, 💬 Chat with Staff"
                                : "กำลังใช้ปุ่มด่วนอัตโนมัติ: 📅 นัดดูห้องจริง, 🏠 ห้องว่าง/ราคา, 💬 คุยกับแอดมิน"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {storyAdsCustomButtons.map((btn, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <input
                                    type="text"
                                    maxLength={20}
                                    value={btn.title}
                                    onChange={(e) => {
                                      const updated = [...storyAdsCustomButtons];
                                      updated[idx].title = e.target.value;
                                      setStoryAdsCustomButtons(updated);
                                      setIsDirty(true);
                                    }}
                                    placeholder={isEn ? "Button Title (Max 20 chars)" : "ชื่อปุ่ม (ไม่เกิน 20 ตัวอักษร)"}
                                    className="text-xs text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                  />
                                  <select
                                    value={btn.type || "postback"}
                                    onChange={(e) => {
                                      const updated = [...storyAdsCustomButtons];
                                      updated[idx].type = e.target.value as any;
                                      if (e.target.value === "web_url" && !updated[idx].url) {
                                        updated[idx].url = "https://";
                                      }
                                      setStoryAdsCustomButtons(updated);
                                      setIsDirty(true);
                                    }}
                                    className="text-xs text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                  >
                                    <option value="web_url">🔗 ลิงก์เว็บไซต์ (Web URL)</option>
                                    <option value="postback">⚡ การกระทำในแชท (Chat Action)</option>
                                  </select>

                                  {btn.type === "web_url" ? (
                                    <input
                                      type="url"
                                      value={btn.url || ""}
                                      onChange={(e) => {
                                        const updated = [...storyAdsCustomButtons];
                                        updated[idx].url = e.target.value;
                                        setStoryAdsCustomButtons(updated);
                                        setIsDirty(true);
                                      }}
                                      placeholder="https://yourwebsite.com/properties"
                                      className="text-xs text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                    />
                                  ) : (
                                    <select
                                      value={btn.payload || "ACTION_BOOK_VIEWING"}
                                      onChange={(e) => {
                                        const updated = [...storyAdsCustomButtons];
                                        updated[idx].payload = e.target.value;
                                        setStoryAdsCustomButtons(updated);
                                        setIsDirty(true);
                                      }}
                                      className="text-xs text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                    >
                                      <option value="ACTION_BOOK_VIEWING">📅 นัดดูห้องจริง (Book Viewing)</option>
                                      <option value="ACTION_BROWSE_ROOMS">🏠 ส่งการ์ดห้องว่าง (Browse Rooms)</option>
                                      <option value="ACTION_TALK_ADMIN">💬 คุยกับแอดมิน (Talk to Staff)</option>
                                    </select>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = storyAdsCustomButtons.filter((_, i) => i !== idx);
                                    setStoryAdsCustomButtons(updated);
                                    setIsDirty(true);
                                  }}
                                  className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                                  title="Remove button"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}

                          {storyAdsCustomButtons.length < 3 && (
                            <button
                              type="button"
                              onClick={() => {
                                setStoryAdsCustomButtons([
                                  ...storyAdsCustomButtons,
                                  { title: "🌐 ชมเว็บไซต์เรา", type: "web_url", url: "https://" },
                                ]);
                                setIsDirty(true);
                              }}
                              className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 text-xs font-semibold text-blue-600 dark:text-blue-400 rounded-lg transition-all"
                            >
                              + {isEn ? "Add Another Button" : "เพิ่มปุ่มอีกรายการ (สูงสุด 3 ปุ่ม)"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Live Phone Simulator */}
      <div className="lg:col-span-4 bg-slate-50/60 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="mb-4">
          <h3 className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <span>Live Phone Preview</span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-400 uppercase tracking-wider">Real-time</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isEn 
              ? "Simulate chatbot and social automated reply experience" 
              : "จำลองการแสดงผลของแชทบอทและการตอบกลับอัตโนมัติบนโซเชียลมีเดีย"}
          </p>
        </div>
        <PhoneSimulator
          activeTab={simulatorTab}
          setActiveTab={setSimulatorTab}
          instagramTemplate={templates.instagram[activeTab] || ""}
          keywords={keywords}
          followGateEnabled={followGateEnabled}
          leadCaptureGateEnabled={leadCaptureGateEnabled}
          instagramStoryReplyEnabled={instagramStoryReplyEnabled}
          directDmReplyEnabled={directDmReplyEnabled}
        />
      </div>

      {/* Floating Sticky Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300 w-11/12 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-250">
              {isEn ? "Unsaved changes pending" : "มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => handleSave()}
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl h-10 px-6 shadow-md shadow-blue-200 disabled:opacity-50 transition-all active:scale-95"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEn ? "Save All Settings" : "บันทึกการตั้งค่าทั้งหมด"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

