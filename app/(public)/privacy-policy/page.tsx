import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import type { Metadata } from "next";
import { Shield, Lock, FileText, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว (Privacy Policy)",
  description:
    "นโยบายความเป็นส่วนตัวและมาตรการคุ้มครองข้อมูลส่วนบุคคลของเว็บไซต์",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Background */}
      <div className="bg-linear-to-r from-slate-900 to-slate-800 text-white pb-24 pt-12 md:pt-16">
        <div className="container mx-auto px-4 md:px-6">
          <AppBreadcrumbs
            variant="on-dark"
            items={[
              { label: "หน้าแรก", href: "/" },
              { label: "นโยบายความเป็นส่วนตัว", href: "/privacy-policy" },
            ]}
            className="text-slate-400 my-6 "
          />
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-500/10 text-blue-400 mb-2">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              นโยบายความเป็นส่วนตัว
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              เราให้ความสำคัญกับข้อมูลส่วนบุคคลของคุณ
              เพื่อความมั่นใจและปลอดภัยในการใช้งาน
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-16 pb-20">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          {/* Content Header */}
          <div className="p-6 md:p-10 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Info className="w-4 h-4" />
              <span>อัปเดตล่าสุด: {lastUpdated}</span>
            </div>
          </div>

          <div className="p-6 md:p-10 prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-strong:text-slate-700">
            <section className="mb-10 last:mb-0">
              <h2 className="flex items-center gap-3 text-2xl mb-4 group">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  1
                </span>
                บทนำ
              </h2>
              <p>
                บริษัทให้ความสำคัญอย่างยิ่งต่อการคุ้มครองข้อมูลส่วนบุคคลของคุณ
                นโยบายความเป็นส่วนตัวนี้อธิบายถึงวิธีการที่เรารวบรวม ใช้ เปิดเผย
                และปกป้องข้อมูลส่วนบุคคลของคุณเมื่อคุณเข้าเยี่ยมชมหรือใช้บริการเว็บไซต์ของเรา
                ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
              </p>
            </section>

            <section className="mb-10 last:mb-0">
              <h2 className="flex items-center gap-3 text-2xl mb-4 group">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  2
                </span>
                ข้อมูลที่เราจัดเก็บ
              </h2>
              <p>เราอาจรวบรวมข้อมูลส่วนบุคคลประเภทต่างๆ ดังนี้:</p>
              <div className="grid sm:grid-cols-2 gap-4 mt-4 not-prose">
                {[
                  {
                    title: "ข้อมูลระบุตัวตน",
                    desc: "เช่น ชื่อ, นามสกุล",
                    icon: FileText,
                  },
                  {
                    title: "ข้อมูลการติดต่อ",
                    desc: "อีเมล, เบอร์โทรศัพท์, Line ID",
                    icon: Phone,
                  },
                  {
                    title: "ข้อมูลทางเทคนิค",
                    desc: "IP Address, Cookies, Log",
                    icon: Lock,
                  },
                  {
                    title: "ข้อมูลธุรกรรม",
                    desc: "ประวัติการค้นหา, รายการที่สนใจ",
                    icon: Info,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <item.icon className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm">
                          {item.title}
                        </h4>
                        <p className="text-slate-500 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-10 last:mb-0">
              <h2 className="flex items-center gap-3 text-2xl mb-4 group">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  3
                </span>
                วัตถุประสงค์การใช้ข้อมูล
              </h2>
              <ul>
                <li>
                  ติดต่อกลับและนำเสนอข้อมูลทรัพย์สินที่คุณสนใจ (เช่น
                  การนัดหมายเข้าชมโครงการ)
                </li>
                <li>
                  ปรับปรุงและพัฒนาประสบการณ์การใช้งานเว็บไซต์ให้ดียิ่งขึ้น
                </li>
                <li>
                  วิเคราะห์ข้อมูลเชิงสถิติเพื่อการทำการตลาด
                  (ในรูปแบบข้อมูลภาพรวมที่ไม่ระบุตัวตน)
                </li>
                <li>
                  ปฏิบัติตามกฎหมายและข้อกำหนดที่เกี่ยวข้องกับธุรกิจอสังหาริมทรัพย์
                </li>
              </ul>
            </section>

            <section className="mb-10 last:mb-0">
              <h2 className="flex items-center gap-3 text-2xl mb-4 group">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  4
                </span>
                คุกกี้ (Cookies)
              </h2>
              <p>
                เว็บไซต์ของเรามีการใช้งานคุกกี้เพื่อช่วยให้การใช้งานเว็บไซต์ของคุณมีประสิทธิภาพมากยิ่งขึ้น
                คุกกี้เป็นไฟล์ข้อความขนาดเล็กที่จัดเก็บลงในอุปกรณ์ของคุณ
                คุณสามารถเลือกที่จะ "ยอมรับ" หรือ "ปฏิเสธ"
                คุกกี้ได้ผ่านแถบการตั้งค่าคุกกี้
                หรือการตั้งค่าในเบราว์เซอร์ของคุณ
              </p>
            </section>

            <section className="mb-10 last:mb-0">
              <h2 className="flex items-center gap-3 text-2xl mb-4 group">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  5
                </span>
                สิทธิ์ของคุณ
              </h2>
              <p>
                ภายใต้กฎหมาย PDPA คุณมีสิทธิ์ในการจัดการข้อมูลส่วนบุคคลของคุณ
                ดังนี้:
              </p>
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 not-prose space-y-2">
                {[
                  "สิทธิ์ในการเข้าถึงและขอรับสำเนาข้อมูลส่วนบุคคล",
                  "สิทธิ์ในการขอแก้ไขข้อมูลให้ถูกต้องและเป็นปัจจุบัน",
                  "สิทธิ์ในการขอลบ ทำลาย หรือระงับการใช้ข้อมูล",
                  "สิทธิ์ในการถอนความยินยอมที่คุณเคยให้ไว้",
                ].map((right, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-slate-700 text-sm"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {right}
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-10 last:mb-0">
              <h2 className="flex items-center gap-3 text-2xl mb-4 group">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  6
                </span>
                ติดต่อเรา
              </h2>
              <p>
                หากคุณมีข้อสงสัยหรือต้องการใช้สิทธิ์เกี่ยวกับข้อมูลส่วนบุคคล
                สามารถติดต่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลของเราได้ที่:
              </p>
              <div className="mt-4 p-5 bg-slate-50 rounded-xl border border-slate-200 not-prose flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">
                    ฝ่ายบริการลูกค้า
                  </h4>
                  <p className="text-slate-500 text-sm">
                    เราพร้อมดูแลและตอบข้อสงสัยของคุณ
                  </p>
                </div>
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
                >
                  ติดต่อสอบถาม
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Phone(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
