"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import {
  FaFacebook,
  FaLine,
  FaInstagram,
  FaTiktok,
  FaWhatsapp,
  FaWeixin,
} from "react-icons/fa";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { siteConfig } from "@/lib/site-config";
import { useSiteConfig } from "@/components/providers/SiteConfigProvider";
import { buildLineUrl, buildWhatsAppUrl } from "@/lib/social-links";
import type { ElementType } from "react";

interface SidebarSocialItem {
  icon: ElementType;
  name: string;
  href?: string;
  onClick?: () => void;
  color: string;
  badge?: string;
}

export function ContactSidebar() {
  const { t, language } = useLanguage();
  const settings = useSiteConfig();

  const facebookUrl = settings.facebook_url || siteConfig.links.facebook;
  const lineUrl =
    buildLineUrl(settings.line_url, settings.line_id) || siteConfig.links.line;
  const line2Url = buildLineUrl(settings.line_url_2, settings.line_id_2);
  const instagramUrl = settings.instagram_url || siteConfig.links.instagram;
  const tiktokUrl = settings.tiktok_url || siteConfig.links.tiktok;
  const whatsappUrl = buildWhatsAppUrl(settings.whatsapp_number);
  const wechatId = settings.wechat_id?.trim() || "";

  const line1ButtonLabel =
    settings.line_label?.trim() || t("contact.sidebar_line_button");
  const line2ButtonLabel =
    settings.line_label_2?.trim() ||
    (language === "th"
      ? `แอด LINE สำรอง${settings.line_id_2 ? ` (${settings.line_id_2})` : " (คุยง่าย ไม่ซับซ้อน)"}`
      : language === "cn"
        ? `备用 LINE 快捷联系${settings.line_id_2 ? ` (${settings.line_id_2})` : ""}`
        : language === "ru"
          ? `Резервный LINE${settings.line_id_2 ? ` (${settings.line_id_2})` : ""}`
          : `Direct LINE${settings.line_id_2 ? ` (${settings.line_id_2})` : " (Quick Chat)"}`);

  const socialLinks: SidebarSocialItem[] = [
    {
      icon: FaFacebook,
      name: "Facebook",
      href: facebookUrl,
      color:
        "text-[#1877F2] bg-[#1877F2]/10 hover:bg-[#1877F2] hover:text-white",
    },
    {
      icon: FaLine,
      name: settings.line_label?.trim() || "LINE Official",
      href: lineUrl,
      color:
        "text-[#06C755] bg-[#06C755]/10 hover:bg-[#06C755] hover:text-white",
      badge: line2Url ? "OA" : undefined,
    },
    ...(line2Url
      ? [
          {
            icon: FaLine,
            name:
              settings.line_label_2?.trim() ||
              (language === "th" ? "LINE สำรอง" : "Direct LINE"),
            href: line2Url,
            color:
              "text-teal-600 bg-teal-500/10 hover:bg-teal-600 hover:text-white",
            badge: "2",
          },
        ]
      : []),
    ...(whatsappUrl
      ? [
          {
            icon: FaWhatsapp,
            name: "WhatsApp",
            href: whatsappUrl,
            color:
              "text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366] hover:text-white",
          },
        ]
      : []),
    ...(wechatId
      ? [
          {
            icon: FaWeixin,
            name: `WeChat: ${wechatId}`,
            onClick: () => {
              navigator.clipboard.writeText(wechatId);
              toast.success(
                language === "th"
                  ? `คัดลอก WeChat ID เรียบร้อย (${wechatId})`
                  : language === "cn"
                    ? `已复制微信号 (${wechatId})`
                    : `Copied WeChat ID (${wechatId})`,
              );
            },
            color:
              "text-[#07C160] bg-[#07C160]/10 hover:bg-[#07C160] hover:text-white",
          },
        ]
      : []),
    {
      icon: FaInstagram,
      name: "Instagram",
      href: instagramUrl,
      color:
        "text-[#E4405F] bg-[#E4405F]/10 hover:bg-[#E4405F] hover:text-white",
    },
    {
      icon: FaTiktok,
      name: "TikTok",
      href: tiktokUrl,
      color: "text-[#000000] bg-slate-100 hover:bg-black hover:text-white",
    },
  ];

  const businessHours = [
    { day: t("contact.sidebar_mon_fri"), hours: "09:00 - 18:00" },
    { day: t("contact.sidebar_sat"), hours: "10:00 - 16:00" },
    {
      day: t("contact.sidebar_sun_holiday"),
      hours: t("contact.sidebar_closed"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Business Hours */}
      <Card className="border-slate-100 bg-white shadow-lg shadow-slate-100/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-800 text-lg">
              {t("contact.sidebar_hours")}
            </h3>
          </div>
          <div className="space-y-4">
            {businessHours.map((schedule, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm group"
              >
                <span className="text-slate-500 group-hover:text-slate-800 transition-colors">
                  {schedule.day}
                </span>
                <span className="font-semibold text-slate-800 bg-slate-50 px-3 py-1 rounded-full">
                  {schedule.hours}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card className="border-slate-100 bg-white shadow-lg shadow-slate-100/50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-800 text-lg mb-6">
            {t("contact.sidebar_follow")}
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {socialLinks.map((social, index) =>
              social.onClick ? (
                <button
                  key={index}
                  type="button"
                  onClick={social.onClick}
                  title={social.name}
                  aria-label={social.name}
                  className={`relative aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer ${social.color}`}
                >
                  <social.icon className="h-6 w-6" />
                </button>
              ) : (
                <a
                  key={index}
                  href={social.href || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.name}
                  aria-label={social.name}
                  className={`relative aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg ${social.color}`}
                >
                  <social.icon className="h-6 w-6" />
                  {social.badge && (
                    <span className="absolute -top-1 -right-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-900 text-white leading-none shadow-xs">
                      {social.badge}
                    </span>
                  )}
                </a>
              ),
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Contact CTA (Official + Backup Line Style) */}
      <Card className="bg-[#06C755] text-white border-none shadow-xl shadow-green-500/20 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />

        <CardContent className="p-6 relative z-10 text-center">
          <div className="w-12 h-12 bg-white/25 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
            <FaLine className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-semibold text-xl mb-2">
            {t("contact.sidebar_quick_title")}
          </h3>
          <p className="text-white/90 text-sm mb-6 leading-relaxed">
            {t("contact.sidebar_quick_desc1")}
            <br />
            {t("contact.sidebar_quick_desc2")}
          </p>
          <div className="space-y-2.5">
            <a
              href={lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full bg-white text-[#06C755] hover:bg-white/90 font-semibold h-12 rounded-xl shadow-lg border-2 border-transparent hover:border-white/50 transition-all">
                <FaLine className="mr-2 h-5 w-5 shrink-0" />
                <span className="truncate">{line1ButtonLabel}</span>
              </Button>
            </a>

            {line2Url && (
              <a
                href={line2Url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button
                  variant="outline"
                  className="w-full bg-black/15 hover:bg-black/25 text-white hover:text-white border-white/35 font-semibold h-11 rounded-xl transition-all"
                >
                  <FaLine className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate text-xs sm:text-sm">
                    {line2ButtonLabel}
                  </span>
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
