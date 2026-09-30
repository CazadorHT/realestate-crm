"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save, UserCheck, ShieldCheck } from "lucide-react";
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
import { MetaAccountsManager } from "./social-automation/MetaAccountsManager";

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
  const [questionnaireBudgetOptions, setQuestionnaireBudgetOptions] = useState<
    Array<{ label: string; min_price?: number; max_price?: number }>
  >(
    initialSettings?.questionnaire_budget_options || [
      { label: "< ฿100k/mo", max_price: 100000 },
      { label: "฿100k - ฿200k", min_price: 100000, max_price: 200000 },
      { label: "฿200k - ฿350k", min_price: 200000, max_price: 350000 },
      { label: "> ฿350k/mo", min_price: 350000 },
    ]
  );
  const [questionnaireZoneOptions, setQuestionnaireZoneOptions] = useState<
    Array<{ label: string; keywords: string[] }>
  >(
    initialSettings?.questionnaire_zone_options || [
      { label: "ฉลอง / ราไวย์ (Chalong)", keywords: ["Chalong", "Rawai", "ฉลอง", "ราไวย์"] },
      { label: "บางเทา (Bangtao)", keywords: ["Bangtao", "Cherngtalay", "บางเทา", "เชิงทะเล"] },
      { label: "กะทู้ (Kathu)", keywords: ["Kathu", "Phuket Town", "กะทู้", "เมืองภูเก็ต"] },
    ]
  );
  const [followGateEnabled, setFollowGateEnabled] = useState(
    !!initialSettings?.follow_gate_enabled
  );
  const [followGateTab, setFollowGateTab] = useState<"th" | "en">("th");
  const [followGateMessages, setFollowGateMessages] = useState({
    th: initialSettings?.follow_gate_message || "ขอบคุณที่สนใจน้า ✨ เพื่อรับรายละเอียดห้องและราคาพิเศษ รบกวนกดติดตามโปรไฟล์ {{handle}} ก่อนน้า แล้วกดปุ่ม \"ฟอลแล้ว\" ด้านล่างได้เลยครับ 💕",
    en: initialSettings?.follow_gate_message_en || "Thanks for your interest! ✨ To receive room details and special price, please follow our profile {{handle}} first, then tap 'Followed' below 💕",
  });
  const [followGateRetryMessages, setFollowGateRetryMessages] = useState({
    th: initialSettings?.follow_gate_retry_message || "ระบบตรวจพบว่ายังไม่ได้กดติดตามเลยน้า 🥺 ฝากกดติดตาม {{handle}} ก่อนน้าเด่วส่งข้อมูลให้ทันทีเลยครับ ✨",
    en: initialSettings?.follow_gate_retry_message_en || "It looks like you haven't followed yet 🥺 Please follow {{handle}} first, then tap the button below to get the details! ✨",
  });
  const [followGateSuccessMessages, setFollowGateSuccessMessages] = useState({
    th: initialSettings?.follow_gate_success_message || "ขอบคุณที่กดติดตามน้า 🙏✨ นี่คือรายละเอียดโครงการที่ขอไว้ครับ 👇",
    en: initialSettings?.follow_gate_success_message_en || "Thank you for following! 🙏✨ Here are the property details you requested 👇",
  });
  const [followGatePublicReplies, setFollowGatePublicReplies] = useState({
    th: initialSettings?.follow_gate_public_reply || "ส่งข้อมูลให้ทาง DM แล้วน้า ฝากกดติดตาม {{handle}} แล้วเช็ก Inbox ได้เลยครับ 😊📩",
    en: initialSettings?.follow_gate_public_reply_en || "Sent you a DM! Please follow {{handle}} and check your Inbox 😊📩",
  });
  const [followGateBtnProfiles, setFollowGateBtnProfiles] = useState({
    th: initialSettings?.follow_gate_btn_profile || "👉 ไปที่หน้าโปรไฟล์",
    en: initialSettings?.follow_gate_btn_profile_en || "👉 View Profile",
  });
  const [followGateBtnChecks, setFollowGateBtnChecks] = useState({
    th: initialSettings?.follow_gate_btn_check || "✅ ฟอลแล้ว (รับข้อมูล)",
    en: initialSettings?.follow_gate_btn_check_en || "✅ Followed (Get Info)",
  });
  const [showFollowGateCustomizer, setShowFollowGateCustomizer] = useState(
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
        if (settings.questionnaire_budget_options) {
          setQuestionnaireBudgetOptions(settings.questionnaire_budget_options);
        }
        if (settings.questionnaire_zone_options) {
          setQuestionnaireZoneOptions(settings.questionnaire_zone_options);
        }
        setFollowGateEnabled(!!settings.follow_gate_enabled);
        if (settings.follow_gate_enabled) setShowFollowGateCustomizer(true);
        if (settings.follow_gate_message || settings.follow_gate_message_en) {
          setFollowGateMessages({
            th: settings.follow_gate_message || "ขอบคุณที่สนใจน้า ✨ เพื่อรับรายละเอียดห้องและราคาพิเศษ รบกวนกดติดตามโปรไฟล์ {{handle}} ก่อนน้า แล้วกดปุ่ม \"ฟอลแล้ว\" ด้านล่างได้เลยครับ 💕",
            en: settings.follow_gate_message_en || "Thanks for your interest! ✨ To receive room details and special price, please follow our profile {{handle}} first, then tap 'Followed' below 💕",
          });
        }
        if (settings.follow_gate_retry_message || settings.follow_gate_retry_message_en) {
          setFollowGateRetryMessages({
            th: settings.follow_gate_retry_message || "ระบบตรวจพบว่ายังไม่ได้กดติดตามเลยน้า 🥺 ฝากกดติดตาม {{handle}} ก่อนน้าเด่วส่งข้อมูลให้ทันทีเลยครับ ✨",
            en: settings.follow_gate_retry_message_en || "It looks like you haven't followed yet 🥺 Please follow {{handle}} first, then tap the button below to get the details! ✨",
          });
        }
        if (settings.follow_gate_success_message || settings.follow_gate_success_message_en) {
          setFollowGateSuccessMessages({
            th: settings.follow_gate_success_message || "ขอบคุณที่กดติดตามน้า 🙏✨ นี่คือรายละเอียดโครงการที่ขอไว้ครับ 👇",
            en: settings.follow_gate_success_message_en || "Thank you for following! 🙏✨ Here are the property details you requested 👇",
          });
        }
        if (settings.follow_gate_public_reply || settings.follow_gate_public_reply_en) {
          setFollowGatePublicReplies({
            th: settings.follow_gate_public_reply || "ส่งข้อมูลให้ทาง DM แล้วน้า ฝากกดติดตาม {{handle}} แล้วเช็ก Inbox ได้เลยครับ 😊📩",
            en: settings.follow_gate_public_reply_en || "Sent you a DM! Please follow {{handle}} and check your Inbox 😊📩",
          });
        }
        if (settings.follow_gate_btn_profile || settings.follow_gate_btn_profile_en) {
          setFollowGateBtnProfiles({
            th: settings.follow_gate_btn_profile || "👉 ไปที่หน้าโปรไฟล์",
            en: settings.follow_gate_btn_profile_en || "👉 View Profile",
          });
        }
        if (settings.follow_gate_btn_check || settings.follow_gate_btn_check_en) {
          setFollowGateBtnChecks({
            th: settings.follow_gate_btn_check || "✅ ฟอลแล้ว (รับข้อมูล)",
            en: settings.follow_gate_btn_check_en || "✅ Followed (Get Info)",
          });
        }
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
      JSON.stringify(questionnaireBudgetOptions) !== JSON.stringify(initialData.questionnaire_budget_options || [
        { label: "< ฿100k/mo", max_price: 100000 },
        { label: "฿100k - ฿200k", min_price: 100000, max_price: 200000 },
        { label: "฿200k - ฿350k", min_price: 200000, max_price: 350000 },
        { label: "> ฿350k/mo", min_price: 350000 },
      ]) ||
      JSON.stringify(questionnaireZoneOptions) !== JSON.stringify(initialData.questionnaire_zone_options || [
        { label: "ฉลอง / ราไวย์ (Chalong)", keywords: ["Chalong", "Rawai", "ฉลอง", "ราไวย์"] },
        { label: "บางเทา (Bangtao)", keywords: ["Bangtao", "Cherngtalay", "บางเทา", "เชิงทะเล"] },
        { label: "กะทู้ (Kathu)", keywords: ["Kathu", "Phuket Town", "กะทู้", "เมืองภูเก็ต"] },
      ]) ||
      followGateEnabled !== !!initialData.follow_gate_enabled ||
      followGateMessages.th !== (initialData.follow_gate_message || "ขอบคุณที่สนใจน้า ✨ เพื่อรับรายละเอียดห้องและราคาพิเศษ รบกวนกดติดตามโปรไฟล์ {{handle}} ก่อนน้า แล้วกดปุ่ม \"ฟอลแล้ว\" ด้านล่างได้เลยครับ 💕") ||
      followGateMessages.en !== (initialData.follow_gate_message_en || "Thanks for your interest! ✨ To receive room details and special price, please follow our profile {{handle}} first, then tap 'Followed' below 💕") ||
      followGateRetryMessages.th !== (initialData.follow_gate_retry_message || "ระบบตรวจพบว่ายังไม่ได้กดติดตามเลยน้า 🥺 ฝากกดติดตาม {{handle}} ก่อนน้าเด่วส่งข้อมูลให้ทันทีเลยครับ ✨") ||
      followGateRetryMessages.en !== (initialData.follow_gate_retry_message_en || "It looks like you haven't followed yet 🥺 Please follow {{handle}} first, then tap the button below to get the details! ✨") ||
      followGateSuccessMessages.th !== (initialData.follow_gate_success_message || "ขอบคุณที่กดติดตามน้า 🙏✨ นี่คือรายละเอียดโครงการที่ขอไว้ครับ 👇") ||
      followGateSuccessMessages.en !== (initialData.follow_gate_success_message_en || "Thank you for following! 🙏✨ Here are the property details you requested 👇") ||
      followGatePublicReplies.th !== (initialData.follow_gate_public_reply || "ส่งข้อมูลให้ทาง DM แล้วน้า ฝากกดติดตาม {{handle}} แล้วเช็ก Inbox ได้เลยครับ 😊📩") ||
      followGatePublicReplies.en !== (initialData.follow_gate_public_reply_en || "Sent you a DM! Please follow {{handle}} and check your Inbox 😊📩") ||
      followGateBtnProfiles.th !== (initialData.follow_gate_btn_profile || "👉 ไปที่หน้าโปรไฟล์") ||
      followGateBtnProfiles.en !== (initialData.follow_gate_btn_profile_en || "👉 View Profile") ||
      followGateBtnChecks.th !== (initialData.follow_gate_btn_check || "✅ ฟอลแล้ว (รับข้อมูล)") ||
      followGateBtnChecks.en !== (initialData.follow_gate_btn_check_en || "✅ Followed (Get Info)") ||
      leadCaptureGateEnabled !== !!initialData.lead_capture_gate_enabled ||
      checkTemplate(templates.facebook, initialData.facebook_post_template, initialData.facebook_post_template_en, initialData.facebook_post_template_cn, initialData.facebook_post_template_ru) ||
      checkTemplate(templates.instagram, initialData.instagram_post_template, initialData.instagram_post_template_en, initialData.instagram_post_template_cn, initialData.instagram_post_template_ru) ||
      checkTemplate(templates.tiktok, initialData.tiktok_post_template, initialData.tiktok_post_template_en, initialData.tiktok_post_template_cn, initialData.tiktok_post_template_ru) ||
      checkTemplate(templates.line, initialData.line_post_template, initialData.line_post_template_en, initialData.line_post_template_cn, initialData.line_post_template_ru);

    setIsDirty(changed);
  }, [keywords, instagramStoryReplyEnabled, directDmReplyEnabled, storyAdsWelcomeMessages, storyAdsButtonsEnabled, storyAdsCustomButtons, autoFeaturedCarouselEnabled, questionnaireBudgetOptions, questionnaireZoneOptions, followGateEnabled, followGateMessages, followGateRetryMessages, followGateSuccessMessages, followGatePublicReplies, followGateBtnProfiles, followGateBtnChecks, leadCaptureGateEnabled, templates, initialData]);

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
          updateSiteSetting("questionnaire_budget_options", questionnaireBudgetOptions as any).then((r) => ({ key: "questionnaire_budget_options", ...r })),
          updateSiteSetting("questionnaire_zone_options", questionnaireZoneOptions as any).then((r) => ({ key: "questionnaire_zone_options", ...r })),
          updateSiteSetting("follow_gate_enabled", followGateEnabled).then((r) => ({ key: "follow_gate_enabled", ...r })),
          updateSiteSetting("follow_gate_message", followGateMessages.th.trim()).then((r) => ({ key: "follow_gate_message", ...r })),
          updateSiteSetting("follow_gate_message_en", followGateMessages.en.trim()).then((r) => ({ key: "follow_gate_message_en", ...r })),
          updateSiteSetting("follow_gate_retry_message", followGateRetryMessages.th.trim()).then((r) => ({ key: "follow_gate_retry_message", ...r })),
          updateSiteSetting("follow_gate_retry_message_en", followGateRetryMessages.en.trim()).then((r) => ({ key: "follow_gate_retry_message_en", ...r })),
          updateSiteSetting("follow_gate_success_message", followGateSuccessMessages.th.trim()).then((r) => ({ key: "follow_gate_success_message", ...r })),
          updateSiteSetting("follow_gate_success_message_en", followGateSuccessMessages.en.trim()).then((r) => ({ key: "follow_gate_success_message_en", ...r })),
          updateSiteSetting("follow_gate_public_reply", followGatePublicReplies.th.trim()).then((r) => ({ key: "follow_gate_public_reply", ...r })),
          updateSiteSetting("follow_gate_public_reply_en", followGatePublicReplies.en.trim()).then((r) => ({ key: "follow_gate_public_reply_en", ...r })),
          updateSiteSetting("follow_gate_btn_profile", followGateBtnProfiles.th.trim().slice(0, 20) || "👉 ไปที่หน้าโปรไฟล์").then((r) => ({ key: "follow_gate_btn_profile", ...r })),
          updateSiteSetting("follow_gate_btn_profile_en", followGateBtnProfiles.en.trim().slice(0, 20) || "👉 View Profile").then((r) => ({ key: "follow_gate_btn_profile_en", ...r })),
          updateSiteSetting("follow_gate_btn_check", followGateBtnChecks.th.trim().slice(0, 20) || "✅ ฟอลแล้ว (รับข้อมูล)").then((r) => ({ key: "follow_gate_btn_check", ...r })),
          updateSiteSetting("follow_gate_btn_check_en", followGateBtnChecks.en.trim().slice(0, 20) || "✅ Followed (Get Info)").then((r) => ({ key: "follow_gate_btn_check_en", ...r })),
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
        <MetaAccountsManager />

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
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isEn ? "Premium Automation Gates" : "ระบบประตูกรองแชต (Premium Automation Gates)"}
                </h4>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200/50 px-2 py-0.5 rounded-full">
                  Lead & Follower Boost
                </span>
              </div>

              {/* Toggles Grid (items-start prevents awkward vertical stretching) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* 1. Follow Gate Toggle Card */}
                <div className={`p-4 rounded-xl border transition-all ${
                  followGateEnabled 
                    ? "bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/20 border-blue-200 shadow-xs" 
                    : "bg-slate-50/50 border-slate-200/80"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                        followGateEnabled ? "bg-blue-600 text-white shadow-xs" : "bg-slate-200 text-slate-600"
                      }`}>
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                          Follow Gate
                          {followGateEnabled && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {isEn ? "Must follow account before receiving info" : "ต้องติดตามบัญชีก่อนรับข้อมูล"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {followGateEnabled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowFollowGateCustomizer(!showFollowGateCustomizer)}
                          className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2.5 rounded-lg border border-blue-200/60"
                        >
                          {showFollowGateCustomizer 
                            ? (isEn ? "Hide Messages" : "ซ่อนข้อความ") 
                            : (isEn ? "⚙️ Configure Messages" : "⚙️ ตั้งค่าข้อความ")}
                        </Button>
                      )}
                      <Switch
                        checked={followGateEnabled}
                        onCheckedChange={(v) => {
                          setFollowGateEnabled(v);
                          if (v) setShowFollowGateCustomizer(true);
                          setIsDirty(true);
                        }}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Lead Capture Gate Toggle Card */}
                <div className={`p-4 rounded-xl border transition-all ${
                  leadCaptureGateEnabled 
                    ? "bg-gradient-to-br from-purple-50/40 via-white to-pink-50/20 border-purple-200 shadow-xs" 
                    : "bg-slate-50/50 border-slate-200/80"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                        leadCaptureGateEnabled ? "bg-purple-600 text-white shadow-xs" : "bg-slate-200 text-slate-600"
                      }`}>
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                          Lead Capture Gate
                          {leadCaptureGateEnabled && (
                            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {isEn ? "Request email/phone before sending links" : "ขออีเมล/เบอร์โทรศัพท์ลูกค้าก่อนเฉลยส่งลิงก์"}
                        </div>
                      </div>
                    </div>

                    <Switch
                      checked={leadCaptureGateEnabled}
                      onCheckedChange={(v) => { setLeadCaptureGateEnabled(v); setIsDirty(true); }}
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </div>
                </div>

                {/* 3. Follow Gate Full-Width Customizer (Spans all columns for clean balance) */}
                {followGateEnabled && showFollowGateCustomizer && (
                  <div className="col-span-1 md:col-span-2 p-5 bg-gradient-to-b from-slate-50/90 to-white rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200/70 gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-sm shadow-2xs">
                          ✍️
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">
                            {isEn ? "Customize Messages & Buttons (Follow Gate Flow)" : "ปรับแต่งข้อความและปุ่มกด (Follow Gate Flow)"}
                          </h5>
                          <p className="text-[11px] text-slate-500">
                            {isEn ? "Configure bot responses and button labels for both Thai and English" : "กำหนดข้อความและชื่อปุ่มที่ส่งให้ลูกค้าได้ทั้งเวอร์ชันภาษาไทยและอังกฤษ"}
                          </p>
                        </div>
                      </div>

                      {/* Language Switcher Tabs & Close */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
                          <button
                            type="button"
                            onClick={() => setFollowGateTab("th")}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                              followGateTab === "th"
                                ? "bg-white text-blue-600 shadow-xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            🇹🇭 ภาษาไทย (TH)
                          </button>
                          <button
                            type="button"
                            onClick={() => setFollowGateTab("en")}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                              followGateTab === "en"
                                ? "bg-white text-blue-600 shadow-xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            🇬🇧 English (EN)
                          </button>
                        </div>

                        <span className="text-[10px] font-mono font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-lg">
                          {isEn ? "{{handle}} = IG Username" : "ใส่ {{handle}} แทนชื่อไอจี"}
                        </span>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowFollowGateCustomizer(false)}
                          className="h-8 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        >
                          ✕ {isEn ? "Close" : "ปิด"}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Left Column: DM Message, Button 1, Button 2, Retry */}
                      <div className="space-y-3.5">
                        {/* 1. DM Follow Invitation */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                            <span>
                              {followGateTab === "th" ? "1. ข้อความใน DM ชวนให้กดติดตาม (TH)" : "1. DM Follow Invitation Message (EN)"}
                            </span>
                            <span className="text-[10px] font-normal text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                              {isEn ? "Includes 2 buttons below" : "ส่งพร้อม 2 ปุ่มด้านล่าง"}
                            </span>
                          </label>
                          <textarea
                            rows={3}
                            value={followGateMessages[followGateTab]}
                            onChange={(e) => {
                              setFollowGateMessages((prev) => ({
                                ...prev,
                                [followGateTab]: e.target.value,
                              }));
                              setIsDirty(true);
                            }}
                            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y leading-relaxed text-slate-700"
                            placeholder={
                              followGateTab === "th"
                                ? "ขอบคุณที่สนใจน้า ✨ เพื่อรับรายละเอียดห้องและราคาพิเศษ รบกวนกดติดตามโปรไฟล์ {{handle}} ก่อนน้า แล้วกดปุ่ม \"ฟอลแล้ว\" ด้านล่างได้เลยครับ 💕"
                                : "Thanks for your interest! ✨ To receive room details and special price, please follow our profile {{handle}} first, then tap 'Followed' below 💕"
                            }
                          />
                        </div>

                        {/* Buttons Customization (Button 1 & Button 2) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Button 1: Profile Link */}
                          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                              <span>{followGateTab === "th" ? "ปุ่มที่ 1: ไปหน้าโปรไฟล์" : "Button 1: View Profile"}</span>
                              <span className={`text-[10px] font-mono px-1 rounded ${
                                (followGateBtnProfiles[followGateTab]?.length || 0) >= 20
                                  ? "text-amber-600 bg-amber-50 font-bold"
                                  : "text-slate-400"
                              }`}>
                                {followGateBtnProfiles[followGateTab]?.length || 0}/20
                              </span>
                            </label>
                            <input
                              type="text"
                              maxLength={20}
                              value={followGateBtnProfiles[followGateTab]}
                              onChange={(e) => {
                                setFollowGateBtnProfiles((prev) => ({
                                  ...prev,
                                  [followGateTab]: e.target.value,
                                }));
                                setIsDirty(true);
                              }}
                              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 font-medium"
                              placeholder={followGateTab === "th" ? "👉 ไปที่หน้าโปรไฟล์" : "👉 View Profile"}
                            />
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>{isEn ? "* Direct link to IG profile" : "* ลิงก์ตรงไปหน้าโปรไฟล์ IG"}</span>
                              <span className="text-[9px] font-mono text-slate-400">max 20</span>
                            </div>
                          </div>

                          {/* Button 2: Follow Check */}
                          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                              <span>{followGateTab === "th" ? "ปุ่มที่ 2: ปุ่มยืนยันฟอล" : "Button 2: Confirm Follow"}</span>
                              <span className={`text-[10px] font-mono px-1 rounded ${
                                (followGateBtnChecks[followGateTab]?.length || 0) >= 20
                                  ? "text-amber-600 bg-amber-50 font-bold"
                                  : "text-slate-400"
                              }`}>
                                {followGateBtnChecks[followGateTab]?.length || 0}/20
                              </span>
                            </label>
                            <input
                              type="text"
                              maxLength={20}
                              value={followGateBtnChecks[followGateTab]}
                              onChange={(e) => {
                                setFollowGateBtnChecks((prev) => ({
                                  ...prev,
                                  [followGateTab]: e.target.value,
                                }));
                                setIsDirty(true);
                              }}
                              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 font-medium"
                              placeholder={followGateTab === "th" ? "✅ ฟอลแล้ว (รับข้อมูล)" : "✅ Followed (Get Info)"}
                            />
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>{isEn ? "* Checks follow via Meta API" : "* กดเพื่อตรวจสถานะฟอลผ่าน API"}</span>
                              <span className="text-[9px] font-mono text-slate-400">max 20</span>
                            </div>
                          </div>
                        </div>

                        {/* 4. Retry Reminder Message */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                            <span>
                              {followGateTab === "th" ? "2. ข้อความเตือนเมื่อยังไม่ได้กดฟอลจริง" : "2. Reminder Message when not following yet"}
                            </span>
                            <span className="text-[10px] font-normal text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              {isEn ? "If not followed" : "กรณีเช็กแล้วไม่พบการฟอล"}
                            </span>
                          </label>
                          <textarea
                            rows={2}
                            value={followGateRetryMessages[followGateTab]}
                            onChange={(e) => {
                              setFollowGateRetryMessages((prev) => ({
                                ...prev,
                                [followGateTab]: e.target.value,
                              }));
                              setIsDirty(true);
                            }}
                            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-y leading-relaxed text-slate-700"
                            placeholder={
                              followGateTab === "th"
                                ? "ระบบตรวจพบว่ายังไม่ได้กดติดตามเลยน้า 🥺 ฝากกดติดตาม {{handle}} ก่อนน้าเด่วส่งข้อมูลให้ทันทีเลยครับ ✨"
                                : "It looks like you haven't followed yet 🥺 Please follow {{handle}} first, then tap the button to get the details! ✨"
                            }
                          />
                        </div>
                      </div>

                      {/* Right Column: Step 3, 4 + Live Preview */}
                      <div className="space-y-3.5">
                        {/* 3. Follow Success Confirmation */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                            <span>
                              {followGateTab === "th" ? "3. ข้อความยืนยันเมื่อฟอลสำเร็จแล้ว" : "3. Confirmation Message after following"}
                            </span>
                            <span className="text-[10px] font-normal text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {isEn ? "Sent before room details" : "ส่งก่อนปล่อยข้อมูลห้อง"}
                            </span>
                          </label>
                          <input
                            type="text"
                            value={followGateSuccessMessages[followGateTab]}
                            onChange={(e) => {
                              setFollowGateSuccessMessages((prev) => ({
                                ...prev,
                                [followGateTab]: e.target.value,
                              }));
                              setIsDirty(true);
                            }}
                            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700"
                            placeholder={
                              followGateTab === "th"
                                ? "ขอบคุณที่กดติดตามน้า 🙏✨ นี่คือรายละเอียดโครงการที่ขอไว้ครับ 👇"
                                : "Thank you for following! 🙏✨ Here are the property details you requested 👇"
                            }
                          />
                        </div>

                        {/* 4. Public Comment Reply */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                            <span>
                              {followGateTab === "th" ? "4. ข้อความตอบกลับหน้าคอมเมนต์ใต้โพสต์" : "4. Public Reply under Comment"}
                            </span>
                            <span className="text-[10px] font-normal text-slate-400">
                              {isEn ? "Public comment alert" : "สะกิดเตือนใต้คอมเมนต์"}
                            </span>
                          </label>
                          <input
                            type="text"
                            value={followGatePublicReplies[followGateTab]}
                            onChange={(e) => {
                              setFollowGatePublicReplies((prev) => ({
                                ...prev,
                                [followGateTab]: e.target.value,
                              }));
                              setIsDirty(true);
                            }}
                            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                            placeholder={
                              followGateTab === "th"
                                ? "ส่งข้อมูลให้ทาง DM แล้วน้า ฝากกดติดตาม {{handle}} แล้วเช็ก Inbox ได้เลยครับ 😊📩"
                                : "Sent you a DM! Please follow {{handle}} and check your Inbox 😊📩"
                            }
                          />
                        </div>

                        {/* Interactive Buttons Simulation preview */}
                        <div className="p-4 bg-slate-100/80 rounded-xl border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">
                              {isEn ? "Live Button Preview:" : "ตัวอย่างปุ่มที่ส่งให้ลูกค้าจริง:"}
                            </span>
                            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
                              {followGateTab === "th" ? "🇹🇭 TH Mode" : "🇬🇧 EN Mode"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <div className="flex-1 text-center text-xs font-bold bg-white text-blue-600 border border-slate-300 py-2 px-3 rounded-xl shadow-2xs truncate">
                              {followGateBtnProfiles[followGateTab] || (followGateTab === "th" ? "👉 ไปที่หน้าโปรไฟล์" : "👉 View Profile")}
                            </div>
                            <div className="flex-1 text-center text-xs font-bold bg-blue-600 text-white py-2 px-3 rounded-xl shadow-xs truncate">
                              {followGateBtnChecks[followGateTab] || (followGateTab === "th" ? "✅ ฟอลแล้ว (รับข้อมูล)" : "✅ Followed (Get Info)")}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Story Ads & Smart Auto-Reply Flow */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isEn ? "Story Ads & General Welcome Flow" : "ระบบต้อนรับ Story Ads & ข้อความกว้าง (Story Ads Flow)"}
                </h4>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-full">
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
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
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
                              ? "bg-white text-blue-600 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
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
                    className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                    <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <span>{isEn ? "Interactive Buttons (Max 3)" : "ปุ่มกดของข้อความต้อนรับ (สูงสุด 3 ปุ่ม)"}</span>
                            <span className="text-[10px] font-medium bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
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
                            className="text-[11px] text-slate-500 hover:text-red-600 font-medium transition-colors"
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
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg transition-all"
                          >
                            + {isEn ? "Customize Buttons" : "กำหนดปุ่มเอง (เช่น ใส่ลิงก์เว็บ)"}
                          </button>
                        )}
                      </div>

                      {storyAdsCustomButtons.length === 0 ? (
                        <div className="text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
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
                              className="p-3 bg-white rounded-lg border border-slate-200 space-y-2"
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
                                    className="text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
                                    className="text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
                                      className="text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
                                      className="text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
                              className="w-full py-2 border border-dashed border-slate-300 hover:border-blue-400 text-xs font-semibold text-blue-600 rounded-lg transition-all"
                            >
                              + {isEn ? "Add Another Button" : "เพิ่มปุ่มอีกรายการ (สูงสุด 3 ปุ่ม)"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ad Campaign Questionnaire Options (Dynamic Budgets & Zones) */}
                  <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <span>{isEn ? "Smart Match Questionnaire Options" : "ตัวเลือกคำถาม Smart Match (แอด Carousel / ให้ช่วยหาทรัพย์)"}</span>
                          <span className="text-[10px] font-medium bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                            {isEn ? "Dynamic Campaigns" : "ปรับเปลี่ยนตามแคมเปญ"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {isEn
                            ? "Customize budget tiers and zones shown in Messenger Quick Replies when users click '🔍 ให้ช่วยหาทรัพย์อื่น'"
                            : "ตั้งค่าช่วงราคาและโซนที่ให้ลูกค้ากดเลือกใน Messenger เมื่อกดปุ่ม '🔍 ให้ช่วยหาทรัพย์อื่น' (ส่งผลทันที ไม่ต้องแก้โค้ด)"}
                        </div>
                      </div>
                    </div>

                    {/* Budget Options */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-slate-600">
                          {isEn ? "Budget Range Options (Max 4-5 items recommended)" : "1. ตัวเลือกงบประมาณ (Budget Options)"}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setQuestionnaireBudgetOptions([
                              ...questionnaireBudgetOptions,
                              { label: "฿50k - ฿100k", min_price: 50000, max_price: 100000 },
                            ]);
                            setIsDirty(true);
                          }}
                          className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          + {isEn ? "Add Budget" : "เพิ่มช่วงงบ"}
                        </button>
                      </div>

                      <div className="space-y-2">
                        {questionnaireBudgetOptions.map((b, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                            <input
                              type="text"
                              value={b.label}
                              onChange={(e) => {
                                const updated = [...questionnaireBudgetOptions];
                                updated[idx].label = e.target.value;
                                setQuestionnaireBudgetOptions(updated);
                                setIsDirty(true);
                              }}
                              placeholder={isEn ? "Button Label (e.g. < ฿100k/mo)" : "ข้อความบนปุ่ม (เช่น < ฿100k/mo)"}
                              className="text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 flex-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                            <input
                              type="number"
                              value={b.min_price !== undefined ? b.min_price : ""}
                              onChange={(e) => {
                                const updated = [...questionnaireBudgetOptions];
                                updated[idx].min_price = e.target.value ? Number(e.target.value) : undefined;
                                setQuestionnaireBudgetOptions(updated);
                                setIsDirty(true);
                              }}
                              placeholder="Min ฿ (ต่ำสุด)"
                              className="text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 w-24 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                            <input
                              type="number"
                              value={b.max_price !== undefined ? b.max_price : ""}
                              onChange={(e) => {
                                const updated = [...questionnaireBudgetOptions];
                                updated[idx].max_price = e.target.value ? Number(e.target.value) : undefined;
                                setQuestionnaireBudgetOptions(updated);
                                setIsDirty(true);
                              }}
                              placeholder="Max ฿ (สูงสุด)"
                              className="text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 w-24 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setQuestionnaireBudgetOptions(questionnaireBudgetOptions.filter((_, i) => i !== idx));
                                setIsDirty(true);
                              }}
                              className="text-slate-400 hover:text-red-500 p-1 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Zone Options */}
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-slate-600">
                          {isEn ? "Zone Options & Matching Keywords" : "2. ตัวเลือกทำเล/โซน และคีย์เวิร์ดค้นหา (Zone Options)"}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setQuestionnaireZoneOptions([
                              ...questionnaireZoneOptions,
                              { label: "กมลา (Kamala)", keywords: ["Kamala", "กมลา"] },
                            ]);
                            setIsDirty(true);
                          }}
                          className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          + {isEn ? "Add Zone" : "เพิ่มโซน"}
                        </button>
                      </div>

                      <div className="space-y-2">
                        {questionnaireZoneOptions.map((z, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                            <input
                              type="text"
                              value={z.label}
                              onChange={(e) => {
                                const updated = [...questionnaireZoneOptions];
                                updated[idx].label = e.target.value;
                                setQuestionnaireZoneOptions(updated);
                                setIsDirty(true);
                              }}
                              placeholder={isEn ? "Button Label (e.g. ฉลอง / ราไวย์)" : "ชื่อปุ่ม (เช่น ฉลอง / ราไวย์)"}
                              className="text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 w-1/3 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                            <input
                              type="text"
                              value={z.keywords.join(", ")}
                              onChange={(e) => {
                                const updated = [...questionnaireZoneOptions];
                                updated[idx].keywords = e.target.value.split(",").map((k) => k.trim()).filter(Boolean);
                                setQuestionnaireZoneOptions(updated);
                                setIsDirty(true);
                              }}
                              placeholder={isEn ? "Keywords separated by comma (e.g. Chalong, Rawai, ฉลอง)" : "คำค้นหาแยกด้วยจุลภาค (เช่น Chalong, Rawai, ฉลอง)"}
                              className="text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 flex-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setQuestionnaireZoneOptions(questionnaireZoneOptions.filter((_, i) => i !== idx));
                                setIsDirty(true);
                              }}
                              className="text-slate-400 hover:text-red-500 p-1 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Live Phone Simulator */}
      <div className="lg:col-span-4 bg-slate-50/60 p-6 rounded-2xl border border-slate-200">
        <div className="mb-4">
          <h3 className="text-base font-bold flex items-center gap-2 text-slate-900">
            <span>Live Phone Preview</span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Real-time</span>
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
          followGateMessage={followGateMessages[followGateTab]}
          followGateSuccessMessage={followGateSuccessMessages[followGateTab]}
          followGatePublicReply={followGatePublicReplies[followGateTab]}
          followGateBtnProfile={followGateBtnProfiles[followGateTab]}
          followGateBtnCheck={followGateBtnChecks[followGateTab]}
          leadCaptureGateEnabled={leadCaptureGateEnabled}
          instagramStoryReplyEnabled={instagramStoryReplyEnabled}
          directDmReplyEnabled={directDmReplyEnabled}
          accountHandle="@hunter.vcc"
        />
      </div>

      {/* Floating Sticky Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300 w-11/12 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-semibold text-slate-700">
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

