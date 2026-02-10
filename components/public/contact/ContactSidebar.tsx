"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { FaFacebook, FaLine, FaInstagram, FaTiktok } from "react-icons/fa";
import { useLanguage } from "@/components/providers/LanguageProvider";

const socialLinks = [
  {
    icon: FaFacebook,
    name: "Facebook",
    href: "https://facebook.com/yourpage",
    color: "text-[#1877F2] bg-[#1877F2]/10 hover:bg-[#1877F2] hover:text-white",
  },
  {
    icon: FaLine,
    name: "Line",
    href: "https://line.me/R/ti/p/@your-line-id",
    color: "text-[#06C755] bg-[#06C755]/10 hover:bg-[#06C755] hover:text-white",
  },
  {
    icon: FaInstagram,
    name: "Instagram",
    href: "https://instagram.com/yourpage",
    color: "text-[#E4405F] bg-[#E4405F]/10 hover:bg-[#E4405F] hover:text-white",
  },
  {
    icon: FaTiktok,
    name: "TikTok",
    href: "https://tiktok.com/@yourpage",
    color: "text-[#000000] bg-slate-100 hover:bg-black hover:text-white",
  },
];

export function ContactSidebar() {
  const { t } = useLanguage();

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
            <h3 className="font-bold text-slate-800 text-lg">
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
          <h3 className="font-bold text-slate-800 text-lg mb-6">
            {t("contact.sidebar_follow")}
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg ${social.color}`}
                aria-label={social.name}
              >
                <social.icon className="h-6 w-6" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Contact CTA (Official Line Style) */}
      <Card className="bg-[#06C755] text-white border-none shadow-xl shadow-green-500/20 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />

        <CardContent className="p-6 relative z-10 text-center">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
            <FaLine className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-bold text-xl mb-2">
            {t("contact.sidebar_quick_title")}
          </h3>
          <p className="text-white/90 text-sm mb-6 leading-relaxed">
            {t("contact.sidebar_quick_desc1")}
            <br />
            {t("contact.sidebar_quick_desc2")}
          </p>
          <a
            href="https://line.me/R/ti/p/@your-line-id"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button className="w-full bg-white text-[#06C755] hover:bg-white/90 font-bold h-12 rounded-xl shadow-lg border-2 border-transparent hover:border-white/50 transition-all">
              <FaLine className="mr-2 h-5 w-5" />
              {t("contact.sidebar_line_button")}
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
