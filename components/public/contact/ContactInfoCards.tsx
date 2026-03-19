"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { siteConfig } from "@/lib/site-config";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FaLine } from "react-icons/fa6";

export function ContactInfoCards() {
  const { t } = useLanguage();

  const contactInfo = [
    {
      icon: Phone,
      title: t("contact.info_phone"),
      value: siteConfig.contact.phone,
      subtitle: t("contact.info_phone_sub"),
      href: `tel:${siteConfig.contact.phone.replace(/[^0-9+]/g, "")}`,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/15",
      glowBorder: "group-hover:border-blue-500/30",
    },
    {
      icon: Mail,
      title: t("contact.info_email"),
      value: siteConfig.contact.email,
      subtitle: t("contact.info_email_sub"),
      href: `mailto:${siteConfig.contact.email}`,
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/15",
      glowBorder: "group-hover:border-purple-500/30",
    },
    {
      icon: FaLine,
      title: t("contact.info_line"),
      value: siteConfig.contact.lineId,
      subtitle: t("contact.info_line_sub"),
      href: siteConfig.links.line,
      iconColor: "text-green-400",
      iconBg: "bg-green-500/15",
      glowBorder: "group-hover:border-green-500/30",
    },
  ];

  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  const item: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "circOut" } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6"
    >
      {contactInfo.map((info, index) => (
        <motion.a
          key={index}
          variants={item}
          href={info.href}
          target={info.href.startsWith("http") ? "_blank" : undefined}
          rel={info.href.startsWith("http") ? "noopener noreferrer" : undefined}
          className={cn(
            "block group h-full",
            index === 2 ? "col-span-2 sm:col-span-1" : "col-span-1"
          )}
        >
          <div className={cn(
            "h-full rounded-2xl lg:rounded-3xl p-6 lg:p-8",
            "bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl",
            "transition-all duration-500 group-hover:-translate-y-1 group-hover:bg-white/20",
            
            info.glowBorder
          )}>
            <div className="flex flex-col items-center text-center gap-4">
              <div className={cn(
                "w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110",
                info.iconBg
              )}>
                <info.icon className={cn("h-7 w-7 lg:h-8 lg:w-8", info.iconColor)} />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-white/40 uppercase tracking-[0.2em]">
                  {info.title}
                </p>
                <p className="text-sm lg:text-xl font-medium text-white tracking-tight break-all">
                  {info.value}
                </p>
                <p className="text-xs text-white/30">
                  {info.subtitle}
                </p>
              </div>
            </div>
          </div>
        </motion.a>
      ))}
    </motion.div>
  );
}
