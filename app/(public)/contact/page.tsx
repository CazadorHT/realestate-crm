import { Metadata } from "next";
import { ContactForm } from "@/components/public/ContactForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Send,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ติดต่อเรา | Real Estate CRM - ปรึกษาผู้เชี่ยวชาญด้านอสังหาริมทรัพย์",
  description:
    "ติดต่อทีมผู้เชี่ยวชาญของเรา พร้อมให้คำปรึกษาด้านอสังหาริมทรัพย์ บ้าน คอนโด สำนักงานออฟฟิศ ตอบกลับภายใน 24 ชั่วโมง",
  keywords: [
    "ติดต่อ",
    "ปรึกษา",
    "อสังหาริมทรัพย์",
    "Real Estate",
    "บ้าน",
    "คอนโด",
    "สำนักงานออฟฟิศ",
  ],
  openGraph: {
    title: "ติดต่อเรา | Real Estate CRM",
    description:
      "ปรึกษาผู้เชี่ยวชาญด้านอสังหาริมทรัพย์ ตอบกลับภายใน 24 ชั่วโมง",
    type: "website",
  },
};

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

const businessHours = [
  { day: "จันทร์ - ศุกร์", hours: "09:00 - 18:00" },
  { day: "เสาร์", hours: "10:00 - 16:00" },
  { day: "อาทิตย์ & วันหยุดนักขัตฤกษ์", hours: "ปิดทำการ" },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-16 md:py-24">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              ติดต่อเรา
            </h1>
            <p className="text-lg sm:text-xl text-blue-50 max-w-2xl mx-auto">
              ทีมผู้เชี่ยวชาญพร้อมให้คำปรึกษาด้านอสังหาริมทรัพย์
              <br className="hidden sm:block" />
              ตอบกลับภายใน 24 ชั่วโมง
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-20">
        {/* Contact Info Cards */}
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
                      target={
                        info.href.startsWith("http") ? "_blank" : undefined
                      }
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
                    <p className="text-blue-600 font-medium mb-1">
                      {info.value}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">{info.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardContent className="p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    ส่งข้อความถึงเรา
                  </h2>
                  <p className="text-slate-600">
                    กรอกข้อมูลด้านล่าง ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง
                  </p>
                </div>
                <ContactForm />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
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
            <Card className="bg-gradient-to-br from-blue-600 to-blue-500 text-white">
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
        </div>

        {/* Map Section */}
        <div className="mt-12">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-slate-100 h-[400px] flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <MapPin className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                  <p className="font-medium">แผนที่ Google Maps</p>
                  <p className="text-sm mt-1">
                    เพิ่ม Google Maps embed code ที่นี่
                  </p>
                </div>
                {/* Replace with actual Google Maps iframe:
                <iframe
                  src="https://www.google.com/maps/embed?pb=YOUR_EMBED_CODE"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                */}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-2xl border p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            คำถามที่พบบ่อย
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                เวลาทำการของท่านคือ?
              </h3>
              <p className="text-sm text-slate-600">
                เปิดทำการวันจันทร์-ศุกร์ 09:00-18:00 น. และวันเสาร์ 10:00-16:00
                น.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                ติดต่อช่องทางไหนได้เร็วที่สุด?
              </h3>
              <p className="text-sm text-slate-600">
                แนะนำ LINE Official เพราะทีมงานตอบตลอด 24 ชั่วโมง
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                มีค่าใช้จ่ายในการปรึกษาไหม?
              </h3>
              <p className="text-sm text-slate-600">
                ไม่มีค่าใช้จ่าย! ให้คำปรึกษาฟรีทุกช่องทาง
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                สามารถนัดหมายเข้าพบได้หรือไม่?
              </h3>
              <p className="text-sm text-slate-600">
                ได้เลยครับ แจ้งล่วงหน้าอย่างน้อย 1 วันผ่านช่องทางติดต่อใดก็ได้
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
