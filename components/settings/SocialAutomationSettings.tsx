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
  SiteSettings,
} from "@/features/site-settings/schema";

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
  const [keywords, setKeywords] = useState<SocialKeyword[]>(
    initialSettings?.social_automation_keywords || [],
  );

  const [instagramStoryReplyEnabled, setInstagramStoryReplyEnabled] = useState(
    !!initialSettings?.instagram_story_reply_enabled
  );
  const [directDmReplyEnabled, setDirectDmReplyEnabled] = useState(
    !!initialSettings?.direct_dm_reply_enabled
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
        toast.error("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [initialSettings]);

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
      followGateEnabled !== !!initialData.follow_gate_enabled ||
      leadCaptureGateEnabled !== !!initialData.lead_capture_gate_enabled ||
      checkTemplate(templates.facebook, initialData.facebook_post_template, initialData.facebook_post_template_en, initialData.facebook_post_template_cn, initialData.facebook_post_template_ru) ||
      checkTemplate(templates.instagram, initialData.instagram_post_template, initialData.instagram_post_template_en, initialData.instagram_post_template_cn, initialData.instagram_post_template_ru) ||
      checkTemplate(templates.tiktok, initialData.tiktok_post_template, initialData.tiktok_post_template_en, initialData.tiktok_post_template_cn, initialData.tiktok_post_template_ru) ||
      checkTemplate(templates.line, initialData.line_post_template, initialData.line_post_template_en, initialData.line_post_template_cn, initialData.line_post_template_ru);

    setIsDirty(changed);
  }, [keywords, instagramStoryReplyEnabled, directDmReplyEnabled, followGateEnabled, leadCaptureGateEnabled, templates, initialData]);

  const hasChanges = isDirty;

  const handleSave = (silent = false) => {
    if (!silent && keywords.some((k) => !k.keyword || !k.dm_content)) {
      toast.error("กรุณากรอก Keyword และข้อความ DM ให้ครบถ้วน");
      return;
    }

    startTransition(async () => {
      try {
        const results = await Promise.all([
          updateSiteSetting("social_automation_keywords", keywords as any).then((r) => ({ key: "social_automation_keywords", ...r })),
          updateSiteSetting("instagram_story_reply_enabled", instagramStoryReplyEnabled).then((r) => ({ key: "instagram_story_reply_enabled", ...r })),
          updateSiteSetting("direct_dm_reply_enabled", directDmReplyEnabled).then((r) => ({ key: "direct_dm_reply_enabled", ...r })),
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
          if (!silent) toast.success("บันทึกการตั้งค่าเรียบร้อย ✅");
          setIsDirty(false);
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
              เงื่อนไขทริกเกอร์และฟีเจอร์ขั้นสูง (Triggers & Gates)
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              เปิด/ปิดจุดเชื่อมโยงทริกเกอร์และฟีเจอร์พรีเมียมสำหรับเพจของคุณ
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Triggers Section */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">เงื่อนไขทริกเกอร์ (Automation Triggers)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">ตอบกลับเมื่อคอมเมนต์ใต้สตอรี่</div>
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
                    <div className="text-sm font-semibold text-slate-700">ตอบกลับข้อความตรงทันที</div>
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
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">ระบบประตูกรองแชต (Premium Automation Gates)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">Follow Gate</div>
                    <div className="text-xs text-slate-400">ต้องติดตามบัญชีก่อนรับข้อมูล</div>
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
                    <div className="text-xs text-slate-400">ขออีเมล/เบอร์โทรศัพท์ลูกค้าก่อนเฉลยส่งลิงก์</div>
                  </div>
                  <Switch
                    checked={leadCaptureGateEnabled}
                    onCheckedChange={(v) => { setLeadCaptureGateEnabled(v); setIsDirty(true); }}
                    className="data-[state=checked]:bg-blue-600"
                  />
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
          <p className="text-xs text-slate-500 mt-1">จำลองการแสดงผลของแชทบอทและการตอบกลับอัตโนมัติบนโซเชียลมีเดีย</p>
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
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-white/90 backdrop-blur-md border border-slate-200  shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300 w-11/12 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-250">มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</span>
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
              บันทึกการตั้งค่าทั้งหมด
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
