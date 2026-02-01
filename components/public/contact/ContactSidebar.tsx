"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  MessageCircle,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react";

const businessHours = [
  { day: "จันทร์ - ศุกร์", hours: "09:00 - 18:00" },
  { day: "เสาร์", hours: "10:00 - 16:00" },
  { day: "อาทิตย์ & วันหยุดนักขัตฤกษ์", hours: "ปิดทำการ" },
];

const socialLinks = [
  {
    icon: Facebook,
    name: "Facebook",
    href: "https://facebook.com/yourpage",
    color: "hover:text-blue-600",
  },
  {
    icon: Instagram,
    name: "Instagram",
    href: "https://instagram.com/yourpage",
    color: "hover:text-pink-600",
  },
  {
    icon: Twitter,
    name: "Twitter",
    href: "https://twitter.com/yourpage",
    color: "hover:text-sky-600",
  },
];

export function ContactSidebar() {
  return (
    <div className="space-y-6">
      {/* Business Hours */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">เวลาทำการ</h3>
          </div>
          <div className="space-y-3">
            {businessHours.map((schedule, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-slate-600">{schedule.day}</span>
                <span className="font-medium text-slate-900">
                  {schedule.hours}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">ติดตามเรา</h3>
          <div className="flex gap-3">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 transition-colors ${social.color}`}
                aria-label={social.name}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Contact CTA */}
      <Card className="bg-linear-to-br from-blue-600 to-blue-500 text-white">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">ต้องการคำตอบด่วน?</h3>
          <p className="text-sm text-blue-50 mb-4">
            ติดต่อเราผ่าน LINE ได้เลย ตอบเร็วที่สุด!
          </p>
          <a
            href="https://line.me/R/ti/p/@your-line-id"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="secondary"
              className="w-full bg-white text-blue-600 hover:bg-blue-50"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              เปิด LINE
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
