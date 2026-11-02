"use client";

import { Phone, Mail, Copy } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { siteConfig } from "@/lib/site-config";
import { m, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { FaLine, FaWhatsapp, FaWeixin } from "react-icons/fa6";
import { toast } from "sonner";
import { useSiteConfig } from "@/components/providers/SiteConfigProvider";
import { buildLineUrl, buildWhatsAppUrl } from "@/lib/social-links";
import type { ElementType } from "react";

interface ContactCardItem {
  icon: ElementType;
  title: string;
  value: string;
  subtitle: string;
  href?: string;
  onClick?: () => void;
  iconColor: string;
  iconBg: string;
  glowBorder: string;
  badge?: string;
}

export function ContactInfoCards() {
  const { t, language } = useLanguage();
  const settings = useSiteConfig();

  const phone = settings.contact_phone || siteConfig.contact.phone;
  const email = settings.contact_email || siteConfig.contact.email;
  const lineId = settings.line_id || siteConfig.contact.lineId;
  const lineUrl =
    buildLineUrl(settings.line_url, settings.line_id) || siteConfig.links.line;

  const lineId2 = settings.line_id_2?.trim() || "";
  const lineUrl2 = buildLineUrl(settings.line_url_2, lineId2);
  const whatsappRaw = settings.whatsapp_number?.trim() || "";
  const whatsappUrl = buildWhatsAppUrl(whatsappRaw);
  const wechatId = settings.wechat_id?.trim() || "";

  const contactInfo: ContactCardItem[] = [
    {
      icon: Phone,
      title: t("contact.info_phone"),
      value: phone,
      subtitle: t("contact.info_phone_sub"),
      href: `tel:${phone.replace(/[^0-9+]/g, "")}`,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/15",
      glowBorder: "group-hover:border-blue-500/30",
    },
    {
      icon: FaLine,
      title: settings.line_label?.trim() || t("contact.info_line"),
      value: lineId,
      subtitle: t("contact.info_line_sub"),
      href: lineUrl,
      iconColor: "text-green-400",
      iconBg: "bg-green-500/15",
      glowBorder: "group-hover:border-green-500/30",
      badge: lineUrl2 ? "Official" : undefined,
    },
  ];

  if (lineUrl2) {
    contactInfo.push({
      icon: FaLine,
      title:
        settings.line_label_2?.trim() ||
        (language === "th"
          ? "LINE ติดต่อด่วน"
          : language === "cn"
            ? "备用 LINE 快捷联系"
            : language === "ru"
              ? "Резервный LINE"
              : "Direct LINE"),
      value: lineId2 || "LINE Chat",
      subtitle:
        language === "th"
          ? "แชทคุยกับทีมงานโดยตรง ไม่ซับซ้อน"
          : language === "cn"
            ? "直接与客服一对一沟通"
            : language === "ru"
              ? "Прямой чат со специалистом"
              : "Direct chat — quick & easy",
      href: lineUrl2,
      iconColor: "text-teal-400",
      iconBg: "bg-teal-500/15",
      glowBorder: "group-hover:border-teal-500/30",
      badge: language === "th" ? "ติดต่อด่วน" : "Direct",
    });
  }

  if (whatsappUrl) {
    contactInfo.push({
      icon: FaWhatsapp,
      title: "WhatsApp",
      value: whatsappRaw.startsWith("http") ? "WhatsApp Chat" : whatsappRaw,
      subtitle:
        language === "th"
          ? "คลิกเพื่อเริ่มแชทผ่าน WhatsApp"
          : language === "cn"
            ? "点击通过 WhatsApp 联系"
            : language === "ru"
              ? "Нажмите для чата в WhatsApp"
              : "Click to chat on WhatsApp",
      href: whatsappUrl,
      iconColor: "text-[#25D366]",
      iconBg: "bg-[#25D366]/15",
      glowBorder: "group-hover:border-[#25D366]/30",
    });
  }

  if (wechatId) {
    contactInfo.push({
      icon: FaWeixin,
      title: "WeChat",
      value: wechatId,
      subtitle:
        language === "th"
          ? "คลิกเพื่อคัดลอก WeChat ID"
          : language === "cn"
            ? "点击复制微信号"
            : language === "ru"
              ? "Нажмите, чтобы скопировать WeChat ID"
              : "Click to copy WeChat ID",
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
      iconColor: "text-[#07C160]",
      iconBg: "bg-[#07C160]/15",
      glowBorder: "group-hover:border-[#07C160]/30",
    });
  }

  contactInfo.push({
    icon: Mail,
    title: t("contact.info_email"),
    value: email,
    subtitle: t("contact.info_email_sub"),
    href: `mailto:${email}`,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/15",
    glowBorder: "group-hover:border-purple-500/30",
  });

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "circOut" } },
  };

  const gridColsClass =
    contactInfo.length === 4
      ? "grid-cols-2 lg:grid-cols-4"
      : "grid-cols-2 sm:grid-cols-3";

  return (
    <m.div
      variants={container}
      initial="hidden"
      animate="show"
      className={cn("grid gap-4 lg:gap-6", gridColsClass)}
    >
      {contactInfo.map((info, index) => {
        const isOddLastOnMobile =
          contactInfo.length % 2 === 1 && index === contactInfo.length - 1;
        const cardInner = (
          <div
            className={cn(
              "h-full rounded-2xl lg:rounded-3xl p-6 lg:p-8 relative",
              "bg-slate-900/90 border border-white/10 shadow-2xl",
              "transition-all duration-500 group-hover:-translate-y-1 group-hover:bg-white/20",
              info.glowBorder,
            )}
          >
            {info.badge && (
              <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-emerald-300 border border-emerald-400/20">
                {info.badge}
              </span>
            )}
            <div className="flex flex-col items-center text-center gap-4">
              <div
                className={cn(
                  "w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110",
                  info.iconBg,
                )}
              >
                <info.icon
                  className={cn("h-7 w-7 lg:h-8 lg:w-8", info.iconColor)}
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-white/40 uppercase tracking-[0.2em]">
                  {info.title}
                </p>
                <p className="text-sm lg:text-xl font-medium text-white tracking-tight break-all flex items-center justify-center gap-1.5">
                  <span>{info.value}</span>
                  {info.onClick && (
                    <Copy className="h-3.5 w-3.5 text-white/40 group-hover:text-white transition-colors shrink-0" />
                  )}
                </p>
                <p className="text-xs text-white/30">{info.subtitle}</p>
              </div>
            </div>
          </div>
        );

        if (info.onClick) {
          return (
            <m.button
              key={info.title}
              type="button"
              variants={item}
              onClick={info.onClick}
              className={cn(
                "block group h-full text-left cursor-pointer",
                isOddLastOnMobile ? "col-span-2 sm:col-span-1" : "col-span-1",
              )}
            >
              {cardInner}
            </m.button>
          );
        }

        return (
          <m.a
            key={info.title}
            variants={item}
            href={info.href}
            target={info.href?.startsWith("http") ? "_blank" : undefined}
            rel={
              info.href?.startsWith("http") ? "noopener noreferrer" : undefined
            }
            className={cn(
              "block group h-full",
              isOddLastOnMobile ? "col-span-2 sm:col-span-1" : "col-span-1",
            )}
          >
            {cardInner}
          </m.a>
        );
      })}
    </m.div>
  );
}
