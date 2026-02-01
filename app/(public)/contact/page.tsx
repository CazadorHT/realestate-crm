import { Metadata } from "next";
import { ContactForm } from "@/components/public/ContactForm";
import { Card, CardContent } from "@/components/ui/card";

// Modular components
import { ContactHero } from "@/components/public/contact/ContactHero";
import { ContactInfoCards } from "@/components/public/contact/ContactInfoCards";
import { ContactSidebar } from "@/components/public/contact/ContactSidebar";
import { ContactMap } from "@/components/public/contact/ContactMap";
import { ContactFAQ } from "@/components/public/contact/ContactFAQ";

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

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      <ContactHero />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-20">
        <ContactInfoCards />

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
          <ContactSidebar />
        </div>

        <ContactMap />
        <ContactFAQ />
      </div>
    </main>
  );
}
