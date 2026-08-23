"use client";

import Link from "next/link";
import { FaLine, FaTiktok, FaMeta } from "react-icons/fa6";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IntegrationDisconnectButton } from "@/components/settings/IntegrationDisconnectButton";
import { SocialAutomationSettings } from "@/components/settings/SocialAutomationSettings";
import { SiteSettings } from "@/features/site-settings/schema";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

interface SocialTabContentProps {
  isLineConnected: boolean;
  lineBotInfo: any;
  isTikTokConnected: boolean;
  isFacebookConnected: boolean;
  allSettings: SiteSettings;
}

export function SocialTabContent({
  isLineConnected,
  lineBotInfo,
  isTikTokConnected,
  isFacebookConnected,
  allSettings,
}: SocialTabContentProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LINE Card */}
        <Card
          className={cn(
            "relative group transition-all duration-500 overflow-hidden border-slate-200/60 bg-white/40 backdrop-blur-xl hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 rounded-[32px]",
            isLineConnected && "ring-2 ring-emerald-500/50"
          )}
        >
          <CardHeader className="pb-4 pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "relative p-3 rounded-2xl transition-all duration-300 transform group-hover:rotate-6 shadow-sm border border-emerald-100/50",
                  isLineConnected ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-emerald-50 text-emerald-500"
                )}>
                  <div className="absolute inset-0 bg-emerald-400/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <FaLine className="h-7 w-7 relative z-10" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900 leading-none mb-1">
                    {isEn ? "LINE" : "LINE (ไลน์)"}
                  </CardTitle>
                  <CardDescription className="text-slate-500 font-medium text-[11px] uppercase tracking-wider">
                    Official Account Hub
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            {isLineConnected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse pointer-events-none absolute inset-0" />
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-xs font-semibold text-emerald-700">
                      {isEn ? "Connected" : "เชื่อมต่อแล้ว (Connected)"}
                    </span>
                  </div>
                  {lineBotInfo?.displayName && (
                    <Badge variant="outline" className="bg-white/80 border-emerald-200 text-emerald-700 font-semibold px-3 py-1 rounded-xl">
                      {lineBotInfo.displayName}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href="/protected/line-manager" className="flex-1">
                    <Button className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-200 border-none transition-all active:scale-95">
                      {isEn ? "Manage Bot" : "จัดการบอท (Manage Bot)"}
                    </Button>
                  </Link>
                  <IntegrationDisconnectButton
                    provider="line"
                    variant="outline"
                    showLabel={false}
                    className="h-12 w-12 p-0 flex items-center justify-center rounded-2xl bg-slate-50 border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 leading-relaxed font-semibold">
                  {isEn 
                    ? "Connect LINE Official Account to receive notifications and chat with clients directly through CRM."
                    : "เชื่อมต่อ Line OA เพื่อรับการแจ้งเตือนและแชทกับลูกค้าผ่านระบบ CRM ได้ทันที"}
                </p>
                <Link href="/protected/line-manager">
                  <Button variant="outline" className="w-full h-12 rounded-2xl border-dashed border-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-semibold transition-all">
                    Connect LINE
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* TikTok Card */}
        <Card
          className={cn(
            "relative group transition-all duration-500 overflow-hidden border-slate-200/60 bg-white/40 backdrop-blur-xl hover:shadow-2xl hover:shadow-slate-900/10 hover:-translate-y-1 rounded-[32px]",
            isTikTokConnected && "ring-2 ring-slate-900/50"
          )}
        >
          <CardHeader className="pb-4 pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "relative p-3 rounded-2xl transition-all duration-300 transform group-hover:-rotate-6 shadow-sm border border-slate-100",
                  isTikTokConnected ? "bg-slate-900 text-white shadow-slate-300" : "bg-slate-100 text-slate-900"
                )}>
                  <div className="absolute inset-0 bg-slate-400/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <FaTiktok className="h-7 w-7 relative z-10" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900 leading-none mb-1">TikTok</CardTitle>
                  <CardDescription className="text-slate-500 font-medium text-[11px] uppercase tracking-wider">
                    Video Marketing Hub
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            {isTikTokConnected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-100/50 border border-slate-200/50">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-700">
                      {isEn ? "Active" : "เปิดใช้งาน (Active)"}
                    </span>
                  </div>
                  {allSettings.tiktok_auth_token?.display_name && (
                    <Badge variant="outline" className="bg-white/80 border-slate-300 text-slate-700 font-semibold px-3 py-1 rounded-xl text-[11px]">
                      {allSettings.tiktok_auth_token.display_name}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <a href="/api/auth/tiktok/login" className="flex-1">
                    <Button className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl shadow-lg shadow-slate-200 border-none transition-all active:scale-95">
                      Reconnect Content
                    </Button>
                  </a>
                  <IntegrationDisconnectButton
                    provider="tiktok"
                    variant="outline"
                    showLabel={false}
                    className="h-12 w-12 p-0 flex items-center justify-center rounded-2xl bg-slate-50 border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 leading-relaxed font-semibold">
                  {isEn 
                    ? "Import videos from TikTok to market and showcase your properties attractively."
                    : "นำเข้าวิดีโอจาก TikTok เพื่อทำการตลาดและขายทรัพย์ของคุณได้อย่างน่าสนใจมากขึ้น"}
                </p>
                <a href="/api/auth/tiktok/login" className="w-full">
                  <Button variant="outline" className="w-full h-12 rounded-2xl border-dashed border-2 border-slate-300 text-slate-900 hover:bg-slate-50 font-semibold transition-all">
                    Connect TikTok
                  </Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meta Card */}
        <Card
          className={cn(
            "relative group transition-all duration-500 overflow-hidden border-none bg-linear-to-br from-blue-600/5 via-indigo-600/5 to-pink-500/5 backdrop-blur-xl hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 rounded-[32px]",
            isFacebookConnected && "ring-2 ring-indigo-500 shadow-xl shadow-indigo-100"
          )}
        >
          {isFacebookConnected && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
          )}
          <CardHeader className="pb-4 pt-8 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "relative p-3 rounded-2xl transition-all duration-500 transform group-hover:scale-110 shadow-sm border border-blue-100",
                  isFacebookConnected 
                    ? "bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-indigo-200" 
                    : "bg-blue-50 text-blue-600"
                )}>
                  <div className="absolute inset-0 bg-indigo-400/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <FaMeta className="h-7 w-7 relative z-10" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900 leading-none mb-1">Meta (FB & IG)</CardTitle>
                  <CardDescription className="text-slate-500 font-medium text-[11px] uppercase tracking-wider">
                    Marketing Automation Hub
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pb-8 relative z-10">
            {isFacebookConnected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100/50 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-indigo-600 animate-pulse" />
                    <span className="text-xs font-semibold text-indigo-700">
                      {isEn ? "Active" : "กำลังทำงาน (Active)"}
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-white/90 border-indigo-200 text-indigo-700 font-semibold px-3 py-1 rounded-xl text-[10px]">
                    {allSettings.meta_page_name || "Enterprise"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <a href="/api/auth/facebook/login" className="flex-1">
                    <Button className="w-full h-12 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-200 border-none transition-all active:scale-95">
                      {isEn ? "Sync Tokens" : "อัปเดตโทเค็น (Sync Tokens)"}
                    </Button>
                  </a>
                  <IntegrationDisconnectButton
                    provider="facebook"
                    variant="outline"
                    showLabel={false}
                    className="h-12 w-12 p-0 flex items-center justify-center rounded-2xl bg-white/50 border-indigo-200 text-indigo-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95 shadow-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 leading-relaxed font-semibold">
                  {isEn 
                    ? "Expand to Facebook and Instagram with automated marketing and lead alerts."
                    : "ขยายตลาดไปยัง Facebook และ Instagram พร้อมรับการแจ้งเตือนและการตลาดอัตโนมัติ"}
                </p>
                <a href="/api/auth/facebook/login" className="w-full">
                  <Button className="w-full h-12 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:opacity-90 shadow-md shadow-indigo-100 transition-all active:scale-95">
                    Connect Meta
                  </Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div id="social-automation" className="mt-8">
        <SocialAutomationSettings
          lineBotInfo={lineBotInfo}
          initialSettings={allSettings}
        />
      </div>
    </div>
  );
}

