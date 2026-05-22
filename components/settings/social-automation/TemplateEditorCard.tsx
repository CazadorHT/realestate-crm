import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FaMeta, FaTiktok, FaLine, FaInstagram, FaFacebook } from "react-icons/fa6";
import { Sparkles, Loader2, Save } from "lucide-react";
import { FacebookPostPreview } from "./FacebookPostPreview";
import { InstagramPostPreview } from "@/components/settings/social-automation/InstagramPostPreview";
import { TikTokPostPreview } from "./TikTokPostPreview";
import { LinePostPreview } from "./LinePostPreview";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { SMART_TAGS } from "./constants";

interface TemplateEditorCardProps {
  activePlatform: "facebook" | "instagram" | "line" | "tiktok";
  setActivePlatform: (platform: "facebook" | "instagram" | "line" | "tiktok") => void;
  activeTab: "th" | "en" | "cn" | "ru";
  setActiveTab: (tab: "th" | "en" | "cn" | "ru") => void;
  templates: {
    facebook: { th: string; en: string; cn: string; ru: string };
    instagram: { th: string; en: string; cn: string; ru: string };
    tiktok: { th: string; en: string; cn: string; ru: string };
    line: { th: string; en: string; cn: string; ru: string };
  };
  updateTemplate: (
    platform: "facebook" | "instagram" | "line" | "tiktok",
    lang: "th" | "en" | "cn" | "ru",
    value: string,
  ) => void;
  handleAiGenerate: (
    type: "SOCIAL_POST" | "LINE_POST" | "TIKTOK_POST",
  ) => void;
  isGenerating: string | null;
  isPending: boolean;
  hasChanges: boolean;
  handleSave: () => void;
  templateSectionRef: React.RefObject<HTMLDivElement | null>;
  tiktokConnected?: boolean;
  tiktokMetadata?: {
    display_name?: string;
    avatar_url?: string;
  };
  lineBotInfo?: {
    displayName?: string;
    pictureUrl?: string;
    basicId?: string;
  };
  metaConnected?: boolean;
  metaPageName?: string;
}

export function TemplateEditorCard({
  activePlatform,
  setActivePlatform,
  activeTab,
  setActiveTab,
  templates,
  updateTemplate,
  handleAiGenerate,
  isGenerating,
  isPending,
  hasChanges,
  handleSave,
  templateSectionRef,
  tiktokConnected,
  tiktokMetadata,
  lineBotInfo,
  metaConnected,
  metaPageName,
}: TemplateEditorCardProps) {
  const isInvalid = (activePlatform === "instagram" && 
    Object.values(templates.instagram).some(text => text.length > 2200)) ||
    (activePlatform === "tiktok" &&
    Object.values(templates.tiktok).some(text => text.length > 4000));

  return (
    <div ref={templateSectionRef} className="scroll-mt-6">
      <Card className="mt-8 border-slate-200 shadow-sm relative overflow-hidden">
        {/* Decorative Background */}
        <div className={cn(
          "absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none transition-colors duration-500",
          activePlatform === "facebook" ? "bg-blue-100/40" :
          activePlatform === "instagram" ? "bg-pink-100/40" :
          activePlatform === "tiktok" ? "bg-slate-200/40" :
          "bg-emerald-100/40"
        )} />

        <CardHeader className={cn(
          "border-b relative transition-colors duration-500",
          activePlatform === "facebook" ? "bg-linear-to-r from-blue-600 to-indigo-600/50" :
          activePlatform === "instagram" ? "bg-linear-to-r from-fuchsia-600 to-pink-600/50" :
          activePlatform === "tiktok" ? "bg-linear-to-r from-slate-800 to-slate-700/80" :
          "bg-linear-to-r from-green-600 to-emerald-600/50"
        )}>
          <div className="flex flex-col gap-6 md:flex-row items-center md:items-start justify-between">
            <div className="flex flex-col items-center md:flex-row md:items-center gap-4 text-center md:text-left">
              <div className={cn(
                "p-3 rounded-2xl transition-all duration-500 shadow-sm",
                activePlatform === "facebook" ? "bg-white/20 backdrop-blur-md" :
                activePlatform === "instagram" ? "bg-white/20 backdrop-blur-md" :
                activePlatform === "tiktok" ? "bg-white/10 backdrop-blur-md" :
                "bg-white/20 backdrop-blur-md"
              )}>
                {activePlatform === "facebook" ? (
                  <FaMeta className="h-6 w-6 text-white" />
                ) : activePlatform === "instagram" ? (
                  <FaMeta className="h-6 w-6 text-white" />
                ) : activePlatform === "tiktok" ? (
                  <FaTiktok className="h-6 w-6 text-white" />
                ) : (
                  <FaLine className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold text-white tracking-tight">
                  {activePlatform === "facebook"
                    ? "Facebook Post Template"
                    : activePlatform === "instagram"
                      ? "Instagram Post Template"
                      : activePlatform === "tiktok"
                        ? "TikTok Post Template"
                        : "Line Flex Template"}
                </CardTitle>
                <CardDescription className="text-white/80 text-xs sm:text-sm max-w-[280px] sm:max-w-md mx-auto md:mx-0">
                  {activePlatform === "facebook"
                    ? "แก้ไขรูปแบบข้อความสำหรับโพสต์ลง Facebook"
                    : activePlatform === "instagram"
                      ? "แก้ไขรูปแบบข้อความสำหรับโพสต์ลง Instagram"
                      : activePlatform === "tiktok"
                        ? "แก้ไข Caption สำหรับโพสต์ลง TikTok"
                        : "แก้ไขเนื้อหาที่จะแสดงใน Line Flex Message"}
                </CardDescription>
              </div>
            </div>
            <div className="w-full md:w-auto flex bg-black/10 p-1 rounded-xl border border-white/10 shadow-inner overflow-x-auto no-scrollbar whitespace-nowrap gap-1">
              <Button
                variant={activePlatform === "facebook" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActivePlatform("facebook")}
                className={cn(
                  "rounded-lg px-4 h-8 transition-all shrink-0 font-bold text-xs",
                  activePlatform === "facebook" ? "bg-white text-blue-600 shadow-sm" : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                <FaFacebook className="h-3.5 w-3.5" />
                Facebook
              </Button>
              <Button
                variant={activePlatform === "instagram" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActivePlatform("instagram")}
                className={cn(
                  "rounded-lg px-4 h-8 transition-all shrink-0 font-bold text-xs",
                  activePlatform === "instagram" ? "bg-white text-pink-600 shadow-sm" : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                <FaInstagram className="h-3.5 w-3.5" />
                Instagram
              </Button>
              <Button
                variant={activePlatform === "tiktok" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActivePlatform("tiktok")}
                className={cn(
                  "rounded-lg px-4 h-8 transition-all shrink-0 font-bold text-xs",
                  activePlatform === "tiktok" ? "bg-white text-slate-900 shadow-sm" : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                <FaTiktok className="h-3.5 w-3.5 " />
                TikTok
              </Button>
              <Button
                variant={activePlatform === "line" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActivePlatform("line")}
                className={cn(
                  "rounded-lg px-4 h-8 transition-all shrink-0 font-bold text-xs",
                  activePlatform === "line" ? "bg-white text-emerald-600 shadow-sm" : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                <FaLine className="h-3.5 w-3.5 " />
                Line
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              className="border-blue-200! bg-blue-50 text-blue-700 hover:text-blue-100! hover:bg-blue-500! gap-2 font-medium h-8 rounded-lg"
              onClick={() =>
                handleAiGenerate(
                  activePlatform === "facebook" || activePlatform === "instagram"
                    ? "SOCIAL_POST"
                    : activePlatform === "tiktok"
                      ? "TIKTOK_POST"
                      : "LINE_POST",
                )
              }
              disabled={!!isGenerating}
            >
              {isGenerating === "facebook-post" ||
              isGenerating === "instagram-post" ||
              isGenerating === "line-post" ||
              isGenerating === "tiktok-post" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              สร้างด้วย AI ({activeTab.toUpperCase()})
            </Button>
          </div>
 
          {(activePlatform === "facebook" || activePlatform === "instagram") && (
            <div className="mt-4 flex items-center justify-between p-3 bg-white/50 border border-slate-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-2 w-2 rounded-full animate-pulse mr-1",
                  metaConnected ? "bg-green-500" : "bg-red-500"
                )} />
                <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full",
                  metaConnected ? "text-green-500 bg-green-100" : "text-red-500 bg-red-100"
                )}>
                  {metaConnected ? "Meta Connected" : "Meta Not Connected"}
                </span>
                {metaConnected && metaPageName && (
                  <div className="flex items-center gap-1.5 ml-3 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold border border-blue-500 shadow-sm">
                    <div className="h-3.5 w-3.5 rounded-full bg-blue-500 flex items-center justify-center">
                      <FaFacebook className="h-2 w-2" />
                    </div>
                    <span>{metaPageName}</span>
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant={metaConnected ? "outline" : "default"}
                className={cn(
                  "h-8 rounded-lg text-xs font-bold",
                  !metaConnected && "bg-blue-600 hover:bg-blue-500 text-white"
                )}
                onClick={() => window.location.href = "/api/auth/facebook"}
              >
                {metaConnected ? "Reconnect" : "Connect Facebook"}
              </Button>
            </div>
          )}

          {activePlatform === "tiktok" && (
            <div className="mt-4 flex items-center justify-between p-3 bg-white/50 border border-slate-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-2 w-2 rounded-full animate-pulse mr-1",
                  tiktokConnected ? "bg-green-500" : "bg-red-500"
                )} />
                <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full",
                  tiktokConnected ? "text-green-500 bg-green-100" : "text-red-500 bg-red-100"
                )}>
                  {tiktokConnected ? "TikTok Connected" : "TikTok Not Connected"}
                </span>
                {tiktokConnected && tiktokMetadata?.display_name && (
                  <div className="flex items-center gap-1.5 ml-3 px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold border border-slate-700 shadow-sm">
                    {tiktokMetadata.avatar_url ? (
                      <img src={tiktokMetadata.avatar_url} alt={`${tiktokMetadata.display_name || 'TikTok'} avatar`} className="h-3.5 w-3.5 rounded-full border border-slate-700" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full bg-slate-700 flex items-center justify-center">
                        <FaTiktok className="h-2 w-2" />
                      </div>
                    )}
                    <span>@{tiktokMetadata.display_name}</span>
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant={tiktokConnected ? "outline" : "default"}
                className={cn(
                  "h-8 rounded-lg text-xs font-bold",
                  !tiktokConnected && "bg-slate-900 hover:bg-slate-800 text-white"
                )}
                onClick={() => window.location.href = "/api/auth/tiktok/login"}
              >
                {tiktokConnected ? "Reconnect" : "Connect Account"}
              </Button>
            </div>
          )}

          {activePlatform === "line" && (
            <div className="mt-4 flex items-center justify-between p-3 bg-white/50 border border-slate-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-1" />
                <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full",
                  lineBotInfo?.displayName ? "text-green-500 bg-green-100" : "text-red-500 bg-red-100"
                )}>
                  {lineBotInfo?.displayName ? "LINE Connected" : "LINE Not Connected"}
                </span>
                {lineBotInfo?.displayName && (
                  <div className="flex items-center gap-1.5 ml-3 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold border border-emerald-500 shadow-sm">
                    {lineBotInfo.pictureUrl ? (
                      <img src={lineBotInfo.pictureUrl} alt={`${lineBotInfo.displayName || 'LINE'} avatar`} className="h-3.5 w-3.5 rounded-full border border-emerald-500" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <FaLine className="h-2 w-2" />
                      </div>
                    )}
                    <span>{lineBotInfo.displayName}</span>
                    {lineBotInfo.basicId && (
                      <span className="opacity-70 font-normal ml-0.5">({lineBotInfo.basicId})</span>
                    )}
                  </div>
                )}
              </div>
              <Link href="/protected/line-manager">
                <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs font-bold hover:text-emerald-600 border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50">
                  Manage Bot
                </Button>
              </Link>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <Tabs
            defaultValue="th"
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as any)}
            className="w-full"
          >
            <div className="px-4 sm:px-6 pt-4">
              <TabsList className="grid w-full grid-cols-4 bg-slate-200/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-300/50 shadow-inner h-12">
                <TabsTrigger
                  value="th"
                  className={cn(
                    "relative h-8 rounded-lg font-bold transition-all duration-300 gap-1.5 sm:gap-2 px-1 sm:px-4",
                    "data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm",
                    "text-slate-600 hover:text-slate-800 hover:bg-white/50"
                  )}
                >
                  <span className="text-base sm:text-lg shrink-0">🇹🇭</span>
                  <span className="text-[11px] sm:text-xs">ไทย</span>
                  {templates[activePlatform].th && (
                    <div className="absolute top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-white shadow-xs" title="Template exists" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="en"
                  className={cn(
                    "relative h-8 rounded-lg font-bold transition-all duration-300 gap-1.5 sm:gap-2 px-1 sm:px-4",
                    "data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm",
                    "text-slate-600 hover:text-slate-800 hover:bg-white/50"
                  )}
                >
                  <span className="text-base sm:text-lg shrink-0">🇺🇸</span>
                  <span className="text-[11px] sm:text-xs">EN</span>
                  {templates[activePlatform].en && (
                    <div className="absolute top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-white shadow-xs" title="Template exists" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="cn"
                  className={cn(
                    "relative h-8 rounded-lg font-bold transition-all duration-300 gap-1.5 sm:gap-2 px-1 sm:px-4",
                    "data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm",
                    "text-slate-600 hover:text-slate-800 hover:bg-white/50"
                  )}
                >
                  <span className="text-base sm:text-lg shrink-0">🇨🇳</span>
                  <span className="text-[11px] sm:text-xs">中文</span>
                  {templates[activePlatform].cn && (
                    <div className="absolute top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-white shadow-xs" title="Template exists" />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="ru"
                  className={cn(
                    "relative h-8 rounded-lg font-bold transition-all duration-300 gap-1.5 sm:gap-2 px-1 sm:px-4",
                    "data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm",
                    "text-slate-600 hover:text-slate-800 hover:bg-white/50"
                  )}
                >
                  <span className="text-base sm:text-lg shrink-0">🇷🇺</span>
                  <span className="text-[11px] sm:text-xs">RU</span>
                  {templates[activePlatform].ru && (
                    <div className="absolute top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-white shadow-xs" title="Template exists" />
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-x divide-slate-100">
              {/* Left Column: Editor */}
              <div className="">
                {["th", "en", "cn", "ru"].map((lang) => (
                  <TabsContent key={lang} value={lang} className="m-0 max-h-[550px] overflow-y-auto no-scrollbar border-r border-slate-200/50">
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {activePlatform === "facebook"
                            ? `Facebook Editor (${lang.toUpperCase()})`
                            : activePlatform === "instagram"
                              ? `Instagram Editor (${lang.toUpperCase()})`
                              : activePlatform === "tiktok"
                                ? `TikTok Editor (${lang.toUpperCase()})`
                                : `Line Content Editor (${lang.toUpperCase()})`}
                        </label>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-bold text-[10px] h-5 transition-all duration-300",
                            isPending
                              ? "bg-amber-50 text-amber-600 border-amber-200 animate-pulse"
                              : !hasChanges
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : "bg-blue-50 text-blue-600 border-blue-200"
                          )}
                        >
                          {isPending ? (
                            <span className="flex items-center gap-1">
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                              SAVING
                            </span>
                          ) : !hasChanges ? (
                            "SAVED"
                          ) : (
                            "CHANGING..."
                          )}
                        </Badge>
                      </div>
                      <Textarea
                        placeholder="🏠 {{title}}\n💰 {{price}}\n..."
                        value={templates[activePlatform][lang as "th" | "en" | "cn" | "ru"]}
                        onChange={(e) =>
                          updateTemplate(
                            activePlatform,
                            lang as "th" | "en" | "cn" | "ru",
                            e.target.value,
                          )
                        }
                        className="min-h-[300px] font-mono text-sm border-slate-200 focus:border-blue-500 focus:ring-blue-100 placeholder:text-slate-300 resize-none pb-8 shadow-sm transition-all"
                      />
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex justify-between items-center px-1">
                          <div className="text-[11px] text-slate-400 italic">
                            {activePlatform === "instagram" && 
                             templates[activePlatform][lang as "th" | "en" | "cn" | "ru"].length > 2200 && (
                              <span className="text-red-500 font-bold flex items-center gap-1 animate-pulse">
                                ⚠️ ยาวเกินกำหนด IG (จำกัด 2,200)
                              </span>
                            )}
                            {activePlatform === "tiktok" && 
                             templates[activePlatform][lang as "th" | "en" | "cn" | "ru"].length > 4000 && (
                              <span className="text-red-500 font-bold flex items-center gap-1 animate-pulse">
                                ⚠️ ยาวเกินกำหนด TikTok (จำกัด 4,000)
                              </span>
                            )}
                          </div>
                          <div className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white shadow-xs",
                            (activePlatform === "instagram" && templates[activePlatform][lang as "th" | "en" | "cn" | "ru"].length > 2200) ||
                            (activePlatform === "tiktok" && templates[activePlatform][lang as "th" | "en" | "cn" | "ru"].length > 4000)
                              ? "text-red-600 border-red-200 bg-red-50"
                              : "text-slate-500 border-slate-200"
                          )}>
                            {templates[activePlatform][lang as "th" | "en" | "cn" | "ru"].length.toLocaleString()} 
                            {activePlatform === "instagram" ? " / 2,200" : activePlatform === "tiktok" ? " / 4,000" : ""} ตัวอักษร
                          </div>
                        </div>

                        {activePlatform === "tiktok" && (
                          <div className="text-xs text-slate-500 bg-slate-50/80 p-3 rounded-xl border border-slate-200/50 flex flex-col gap-1.5">
                            <p className="font-bold flex items-center gap-1.5 text-slate-700 text-[11px]">
                              <FaTiktok className="h-3 w-3" />
                              TikTok Caption Tips:
                            </p>
                            <ul className="list-disc pl-4 space-y-0.5 text-[10px] opacity-80">
                              <li>ควรสั้น กระชับ และใช้ประโยค Hook ที่น่าสนใจใน 3-5 คำแรก</li>
                              <li>ใส่ Hashtag 3-5 อัน (เช่น #อสังหา #บ้านเช่า)</li>
                            </ul>
                          </div>
                        )}

                        {activePlatform === "instagram" && (
                          <div className="text-xs text-slate-500 bg-slate-50/80 p-3 rounded-xl border border-slate-200/50 flex flex-col gap-1.5">
                            <p className="font-bold flex items-center gap-1.5 text-slate-700 text-[11px]">
                              <FaInstagram className="h-3 w-3" />
                              Instagram Caption Tips:
                            </p>
                            <ul className="list-disc pl-4 space-y-0.5 text-[10px] opacity-80">
                              <li>IG จำกัดที่ 2,200 ตัวอักษร พยายามอย่าให้ยาวจนเกินไป</li>
                              <li>ใส่รายละเอียดสำคัญ (ห้องนอน, ห้องน้ำ, พื้นที่) ให้ชัดเจน</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </div>

              {/* Right Column: Premium Preview */}
              <div className="bg-slate-50/50 p-6 flex flex-col items-center max-h-[550px] overflow-y-auto no-scrollbar">
                <div className="w-full flex items-center justify-between mb-6">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {activePlatform === "facebook"
                      ? "Facebook Post Preview"
                      : activePlatform === "instagram"
                        ? "Instagram Post Preview"
                      : activePlatform === "tiktok"
                        ? "TikTok Video Preview"
                        : "Line Flex Preview"}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                      Live Preview
                    </span>
                  </div>
                </div>

                <div className="w-full flex justify-center">
                  {activePlatform === "facebook" ? (
                    <FacebookPostPreview
                      template={templates.facebook[activeTab]}
                      language={activeTab}
                    />
                  ) : activePlatform === "instagram" ? (
                    <InstagramPostPreview
                      template={templates.instagram[activeTab]}
                      language={activeTab}
                    />
                  ) : activePlatform === "tiktok" ? (
                    <TikTokPostPreview
                      template={templates.tiktok[activeTab]}
                      language={activeTab}
                    />
                  ) : (
                    <LinePostPreview
                      template={templates.line[activeTab]}
                      language={activeTab}
                    />
                  )}
                </div>

                <div className="mt-8 p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl text-[11px] text-blue-600/70 text-center max-w-[280px] leading-relaxed">
                  💡 <b>Pro Tip:</b> ใช้ตัวแปร {"{{...}}"}{" "}
                  เพื่อดึงข้อมูลทรัพย์สินมาแสดงโดยอัตโนมัติในตอนที่กดโพสต์จริง
                </div>
              </div>
            </div>
          </Tabs>

          <div className="px-6 pb-6 pt-0 space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {SMART_TAGS.map((item) => (
                <div
                  key={item.tag}
                  className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] group/tag cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all active:scale-95"
                  title={`คลิกเพื่อคัดลอก: ${item.label}`}
                  onClick={() => {
                    navigator.clipboard.writeText(item.tag);
                    toast.success(`คัดลอก ${item.tag} แล้ว`, {
                      description: `ใช้ปุ่ม Ctrl+V หรือ Cmd+V เพื่อวางในกล่องข้อความ`,
                      duration: 2000,
                    });
                  }}
                >
                  <code className="text-blue-600 font-bold group-hover/tag:text-blue-700 transition-colors">
                    {item.tag}
                  </code>
                  <span className="text-slate-400 group-hover/tag:text-slate-500">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isPending || !hasChanges || isInvalid}
              className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              บันทึกรูปแบบข้อความ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
