"use client";

import React, { useState, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { FaLine, FaMeta } from "react-icons/fa6";
import { IntegrationDisconnectButton } from "@/components/settings/IntegrationDisconnectButton";
import { SocialAutomationSettings } from "@/components/settings/SocialAutomationSettings";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { saveManualMetaTokenAction } from "../actions";

interface SocialIntegrationsTabProps {
  allSettings: any;
  lineBotInfo: any;
  isLineConnected: boolean;
  isTikTokConnected: boolean;
  isFacebookConnected: boolean;
}

export function SocialIntegrationsTab({
  allSettings,
  lineBotInfo,
  isLineConnected,
  isTikTokConnected,
  isFacebookConnected,
}: SocialIntegrationsTabProps) {
  const router = useRouter();
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSaveManualToken = async () => {
    if (!manualToken.trim()) {
      toast.error("กรุณากรอก Token");
      return;
    }

    startTransition(async () => {
      const res = await saveManualMetaTokenAction(manualToken);
      if (res.success) {
        toast.success(res.message);
        setManualToken("");
        setShowManualInput(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LINE Card */}
        <Card
          className={cn(
            "relative group transition-all duration-500 overflow-hidden border-slate-200/60 bg-white/40 backdrop-blur-xl hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 rounded-[24px]",
            isLineConnected && "ring-2 ring-emerald-500/50",
          )}
        >
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "relative p-3 rounded-2xl transition-all duration-300 transform group-hover:rotate-6",
                    isLineConnected
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                      : "bg-emerald-50 text-emerald-500",
                  )}
                >
                  <div className="absolute inset-0 bg-emerald-400/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <FaLine className="h-7 w-7 relative z-10" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    LINE
                  </CardTitle>
                  <CardDescription className="text-slate-500 font-medium">
                    Official Account Hub
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLineConnected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-[20px] bg-emerald-50/80 border border-emerald-100/50 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-bold text-emerald-700">
                      Line OA Active
                    </span>
                  </div>
                  {lineBotInfo?.displayName && (
                    <Badge
                      variant="outline"
                      className="bg-white/95 border-emerald-200 text-emerald-700 font-bold px-3 py-1 text-[10px]"
                    >
                      {lineBotInfo.displayName}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/protected/line-manager"
                    className="flex-1"
                  >
                    <Button className="w-full h-12 bg-linear-to-r from-emerald-500 to-teal-500 text-white font-black rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95">
                      Manage Line Broadcasts
                    </Button>
                  </Link>
                  <IntegrationDisconnectButton
                    provider="line"
                    variant="outline"
                    showLabel={false}
                    className="h-12 w-12 p-0 flex items-center justify-center rounded-xl bg-white/50 border-emerald-200 text-emerald-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95 shadow-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  เชื่อมต่อ LINE Official Account
                  เพื่อยิงบรอดแคสต์ข้อมูลทรัพย์และสื่อสารกับลูกค้าได้โดยตรง
                </p>
                <Link href="/protected/settings/branches" className="w-full block">
                  <Button className="w-full h-12 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 text-white font-black hover:opacity-90 shadow-md active:scale-95">
                    Configure Line
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meta Card */}
        <Card
          className={cn(
            "relative group transition-all duration-500 overflow-hidden border-none bg-linear-to-br from-blue-600/5 via-indigo-600/5 to-pink-500/5 backdrop-blur-xl hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 rounded-[24px]",
            isFacebookConnected &&
              "ring-2 ring-indigo-500 shadow-xl shadow-indigo-100",
          )}
        >
          {isFacebookConnected && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
          )}
          <CardHeader className="pb-4 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "relative p-3 rounded-2xl transition-all duration-500 transform group-hover:scale-110",
                    isFacebookConnected
                      ? "bg-linear-to-br from-blue-50 to-indigo-600 text-white shadow-lg shadow-indigo-200"
                      : "bg-blue-50 text-blue-600",
                  )}
                >
                  <div className="absolute inset-0 bg-indigo-400/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <FaMeta className="h-7 w-7 relative z-10" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Meta
                  </CardTitle>
                  <CardDescription className="text-slate-500 font-medium">
                    FB & Instagram
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            {isFacebookConnected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-[20px] bg-indigo-50/80 border border-indigo-100/50 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-indigo-600 animate-pulse" />
                    <span className="text-sm font-bold text-indigo-700">
                      Integration Active
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-white/90 border-indigo-200 text-indigo-700 font-bold px-3 py-1 text-[10px]"
                  >
                    {allSettings.meta_page_name || "Enterprise"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <a
                    href="/api/auth/facebook/login"
                    className="flex-1"
                  >
                    <Button className="w-full h-12 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-200 border-none transition-all active:scale-95">
                      Update Tokens
                    </Button>
                  </a>
                  <IntegrationDisconnectButton
                    provider="facebook"
                    variant="outline"
                    showLabel={false}
                    className="h-12 w-12 p-0 flex items-center justify-center rounded-xl bg-white/50 border-indigo-200 text-indigo-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95 shadow-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  ขยายตลาดไปยัง Facebook และ Instagram
                  พร้อมรับการแจ้งเตือนและการตลาดอัตโนมัติ
                </p>
                <a href="/api/auth/facebook/login" className="w-full">
                  <Button className="w-full h-12 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 text-white font-black hover:opacity-90 shadow-md shadow-indigo-100">
                    Connect Meta
                  </Button>
                </a>
              </div>
            )}

            {/* Manual Token Input Accordion */}
            <div className="pt-2 border-t border-slate-100/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowManualInput(!showManualInput)}
                className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-0 h-auto font-bold"
              >
                {showManualInput ? "✕ ปิดหน้าจอระบุ Token เอง" : "✎ กรอก Page Access Token ด้วยตนเอง (Manual)"}
              </Button>

              {showManualInput && (
                <div className="mt-4 space-y-3 p-4 rounded-2xl bg-white/60 border border-slate-200/60 shadow-inner">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Facebook Page Access Token (Long-life)</label>
                    <Input
                      type="password"
                      placeholder="EAA..."
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      className="h-10 text-xs rounded-xl bg-white border-slate-200"
                    />
                  </div>
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={handleSaveManualToken}
                    className="w-full h-9 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm active:scale-95 transition-all"
                  >
                    {isPending ? "กำลังบันทึกและตรวจสอบ..." : "บันทึกและเชื่อมต่อ"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div id="social-automation" className="mt-8">
        <SocialAutomationSettings
          lineBotInfo={lineBotInfo}
          initialSettings={allSettings}
          mode="social"
        />
      </div>
    </div>
  );
}
