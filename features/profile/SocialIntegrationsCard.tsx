"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FaTiktok } from "react-icons/fa6";
import { disconnectUserIntegrationAction } from "./actions";
import { toast } from "sonner";
import { CheckCircle2, Link2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface SocialIntegrationsCardProps {
  metadata: any;
}

export function SocialIntegrationsCard({ metadata }: SocialIntegrationsCardProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const tiktokToken = metadata?.tiktok_auth_token;
  const isConnected = !!tiktokToken;

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const res = await disconnectUserIntegrationAction("tiktok");
      if (res.success) {
        toast.success(isEn ? "Disconnected TikTok successfully" : res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(isEn ? "Failed to disconnect account" : "เกิดข้อผิดพลาดในการยกเลิกการเชื่อมต่อ");
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Card className="border-slate-100 shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden bg-white/60 backdrop-blur-md">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">
              {isEn ? "Social Media Integrations" : "การเชื่อมต่อบัญชีโซเชียลมีเดีย"}
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              {isEn
                ? "Connect your marketing accounts for direct publishing and synchronization"
                : "เชื่อมต่อกับแพลตฟอร์มต่างๆ เพื่อเข้าถึงฟังก์ชันการตลาดโดยตรง"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3.5 rounded-2xl text-white shadow-lg relative group transition-all duration-300 animate-in fade-in zoom-in-90",
              isConnected ? "bg-slate-900 shadow-slate-200" : "bg-slate-100 text-slate-400 shadow-none"
            )}>
              <FaTiktok className="h-6 w-6 relative z-10 animate-in fade-in" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">TikTok Marketing</span>
                {isConnected && (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    <CheckCircle2 className="h-3 w-3 mr-1 inline-block" /> {isEn ? "Connected" : "เชื่อมต่อแล้ว"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {isConnected 
                  ? (isEn ? `Connected to: ${tiktokToken.display_name || "Unknown"}` : `เชื่อมต่อกับบัญชี: ${tiktokToken.display_name || "ไม่ทราบชื่อ"}`)
                  : (isEn ? "Connect your TikTok channel to share listing videos directly" : "เชื่อมต่อช่อง TikTok ของคุณเพื่อแชร์วิดีโอและโพสต์ขายทรัพย์ได้โดยตรง")}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            {isConnected ? (
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="w-full sm:w-auto border-rose-200 text-rose-600! hover:bg-rose-50 hover:border-rose-300 rounded-xl h-11 px-5 font-bold text-xs transition-all active:scale-95 cursor-pointer"
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEn ? "Disconnecting..." : "กำลังยกเลิก..."}
                  </>
                ) : (
                  isEn ? "Disconnect Account" : "ยกเลิกการเชื่อมต่อ"
                )}
              </Button>
            ) : (
              <a href="/api/auth/tiktok/login" className="block w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white rounded-xl h-11 px-6 font-bold text-xs shadow-lg shadow-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer">
                  {isEn ? "Connect TikTok" : "เชื่อมต่อ TikTok"}
                </Button>
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
