"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MessageCircle } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { siteConfig } from "@/lib/site-config";

export function ContactInfoCards() {
  const { t } = useLanguage();

  const contactInfo = [
    {
      icon: Phone,
      title: t("contact.info_phone"),
      value: siteConfig.contact.phone,
      subtitle: t("contact.info_phone_sub"),
      href: `tel:${siteConfig.contact.phone.replace(/[^0-9+]/g, "")}`,
      color: "bg-blue-100 text-blue-600",
      borderColor: "group-hover:border-blue-200",
    },
    {
      icon: Mail,
      title: t("contact.info_email"),
      value: siteConfig.contact.email,
      subtitle: t("contact.info_email_sub"),
      href: `mailto:${siteConfig.contact.email}`,
      color: "bg-purple-100 text-purple-600",
      borderColor: "group-hover:border-purple-200",
    },
    {
      icon: MessageCircle,
      title: t("contact.info_line"),
      value: siteConfig.contact.lineId,
      subtitle: t("contact.info_line_sub"),
      href: siteConfig.links.line,
      color: "bg-green-100 text-green-600",
      borderColor: "group-hover:border-green-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      {contactInfo.map((info, index) => (
        <a
          key={index}
          href={info.href}
          target={info.href.startsWith("http") ? "_blank" : undefined}
          rel={info.href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="block group"
        >
          <Card className="h-full border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white/60 backdrop-blur-md">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-16 h-16 ${info.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}
                >
                  <info.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-primary transition-colors">
                  {info.title}
                </h3>
                <p className="text-primary font-medium text-lg mb-2">
                  {info.value}
                </p>
                <p className="text-sm text-slate-500 font-light tracking-wide">
                  {info.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        </a>
      ))}
    </div>
  );
}
