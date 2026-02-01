"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MessageCircle, MapPin } from "lucide-react";

const contactInfo = [
  {
    icon: Phone,
    title: "โทรศัพท์",
    value: "02-XXX-XXXX",
    subtitle: "จันทร์-ศุกร์ 9:00-18:00",
    href: "tel:02XXXXXXX",
  },
  {
    icon: Mail,
    title: "อีเมล",
    value: "contact@yourdomain.com",
    subtitle: "ตอบภายใน 24 ชม.",
    href: "mailto:contact@yourdomain.com",
  },
  {
    icon: MessageCircle,
    title: "LINE Official",
    value: "@your-line-id",
    subtitle: "ตอบเร็วที่สุด",
    href: "https://line.me/R/ti/p/@your-line-id",
  },
  {
    icon: MapPin,
    title: "สำนักงาน",
    value: "123 ถนนสุขุมวิท",
    subtitle: "เขตวัฒนา กรุงเทพฯ 10110",
    href: "https://maps.google.com",
  },
];

export function ContactInfoCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
      {contactInfo.map((info, index) => (
        <Card
          key={index}
          className="hover:shadow-lg transition-shadow duration-300"
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <info.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">
                {info.title}
              </h3>
              {info.href ? (
                <a
                  href={info.href}
                  target={info.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    info.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="text-blue-600 hover:text-blue-700 font-medium mb-1 hover:underline"
                >
                  {info.value}
                </a>
              ) : (
                <p className="text-blue-600 font-medium mb-1">{info.value}</p>
              )}
              <p className="text-xs text-slate-500">{info.subtitle}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
