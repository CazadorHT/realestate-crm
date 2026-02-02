import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import type { Metadata } from "next";
import Link from "next/link";
import { Scale, FileText, AlertCircle, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "ข้อตกลงและเงื่อนไขการใช้งาน (Terms of Service)",
  description: "ข้อตกลงและเงื่อนไขการใช้งานเว็บไซต์",
};

export default function TermsPage() {
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
              { label: "ข้อตกลงการใช้งาน", href: "/terms" },
            ]}
            className="text-slate-400 my-6 "
          />
          <div className="max-w-4xl mx-auto text-center space-y-4 ">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-500/10 text-blue-400 mb-2">
              <Scale className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              ข้อตกลงและเงื่อนไข
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              โปรดอ่านข้อกำหนดเหล่านี้อย่างละเอียดก่อนใช้งานเว็บไซต์
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-16 pb-20">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          {/* Content Header */}
          <div className="p-6 md:p-10 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FileText className="w-4 h-4" />
              <span>อัปเดตล่าสุด: {lastUpdated}</span>
            </div>
          </div>

          <div className="p-6 md:p-10 prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-strong:text-slate-700">
            <section className="mb-10 last:mb-0">
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg mb-6 not-prose">
                <p className="text-blue-900 font-medium">
                  ยินดีต้อนรับสู่เว็บไซต์ของเรา
                  การเข้าใช้เว็บไซต์นี้ถือว่าคุณยอมรับข้อตกลงและเงื่อนไขที่ระบุไว้ในหน้านี้ทั้งหมด
                </p>
              </div>
              <h2 className="text-2xl mb-4">1. ข้อตกลงทั่วไป</h2>
              <p>
                เงื่อนไขเหล่านี้มีผลบังคับใช้กับผู้ใช้บริการทุกคน
                ไม่ว่าจะเป็นผู้เข้าชมทั่วไป สมาชิก หรือลูกค้า
                หากคุณไม่ยอมรับเงื่อนไขข้อใดข้อหนึ่ง กรุณาระงับการใช้งานเว็บไซต์
              </p>
            </section>

            <section className="mb-10 last:mb-0">
              <h2 className="text-2xl mb-4">2. ทรัพย์สินทางปัญญา</h2>
              <p>
                เนื้อหา รูปภาพ วิดีโอ โลโก้
                และข้อมูลทั้งหมดที่ปรากฏบนเว็บไซต์นี้
                ถือเป็นทรัพย์สินทางปัญญาของบริษัทหรือเจ้าของสิทธิ์ที่ได้รับอนุญาต
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mt-4 not-prose">
                <div className="p-4 border border-slate-200 rounded-xl">
                  <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="text-red-500">✕</span> สิ่งที่ทำไม่ได้
                  </h5>
                  <ul className="text-sm text-slate-600 space-y-1 list-disc pl-4">
                    <li>ห้ามคัดลอกรูปภาพไปใช้เชิงพาณิชย์</li>
                    <li>ห้ามดัดแปลงบทความหรือเนื้อหา</li>
                    <li>ห้ามแอบอ้างสิทธิ์ความเป็นเจ้าของ</li>
                  </ul>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl">
                  <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="text-green-500">✓</span> สิ่งที่ทำได้
                  </h5>
                  <ul className="text-sm text-slate-600 space-y-1 list-disc pl-4">
                    <li>แชร์ลิงก์หน้าเว็บไปยัง Social Media</li>
                    <li>อ้างอิงข้อมูลโดยให้เครดิตชัดเจน</li>
                    <li>ติดต่อสอบถามข้อมูลเพื่อการซื้อ-ขาย</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-10 last:mb-0">
              <h2 className="text-2xl mb-4">3. ข้อควรระวังเกี่ยวกับข้อมูล</h2>
              <div className="flex items-start gap-4 p-5 bg-amber-50 rounded-xl not-prose">
                <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-amber-900">
                    การเปลี่ยนแปลงข้อมูล
                  </h4>
                  <p className="text-sm text-amber-800/80 leading-relaxed">
                    ราคาและรายละเอียดทรัพย์อาจมีการเปลี่ยนแปลงโดยเจ้าของทรัพย์
                    หรืออาจมีการขาย/เช่าไปแล้ว
                    โดยที่เราอาจยังไม่ได้อัปเดตข้อมูลบนเว็บไซต์ทันที
                    <br />
                    <b>
                      *ผู้ใช้งานควรตรวจสอบข้อมูลกับทางเจ้าหน้าที่ของเราอีกครั้งก่อนตัดสินใจ
                    </b>
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-10 last:mb-0">
              <h2 className="text-2xl mb-4">4. กฎหมายที่ใช้บังคับ</h2>
              <p>
                ข้อตกลงนี้อยู่ภายใต้บังคับของกฎหมายแห่งราชอาณาจักรไทย
                การระงับข้อพิพาทใดๆ ให้เป็นไปตามกระบวนการทางกฎหมายของไทย
              </p>
            </section>

            <div className="mt-12 p-8 bg-slate-50 rounded-2xl border border-slate-100 text-center not-prose">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-sm mb-4 text-slate-400">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                มีข้อสงสัยเพิ่มเติม?
              </h3>
              <p className="text-slate-500 mb-6">
                หากต้องการสอบถามรายละเอียดเกี่ยวกับเงื่อนไขการใช้งาน
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
              >
                ติดต่อฝ่ายกฎหมาย
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
