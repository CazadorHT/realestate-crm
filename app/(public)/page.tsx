import { SmartMatchWizard } from "@/components/public/SmartMatchWizard";
import { HeroTitle } from "@/components/public/HeroTitle";
import { PropertyTypeGrid } from "@/components/public/PropertyTypeGrid";
import {
  Search,
  MapPin,
  Home,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Home className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PropertyHub
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a
                href=""
                className="text-slate-600 hover:text-blue-600 transition-colors"
              >
                ทรัพย์สิน
              </a>
              <a
                href="#how-it-works"
                className="text-slate-600 hover:text-blue-600 transition-colors"
              >
                วิธีการทำงาน
              </a>
              <a
                href="#trust"
                className="text-slate-600 hover:text-blue-600 transition-colors"
              >
                เกี่ยวกับเรา
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Visual Priority */}
      <section className="py-40 max-w-screen-2xl mx-auto  ">
        <div className=" px-4 sm:px-6 lg:px-8  ">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 items-center align-middle ">
            {/* Left: Value Proposition */}
            <div className="space-y-6 animate-in fade-in-0 duration-700 slide-in-from-bottom-4 lg:col-span-2">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                <span>ค้นหาพื้นที่ในฝันของคุณได้ง่ายขึ้น</span>
              </div>

              <HeroTitle />

              <p className="text-xl text-slate-600 leading-relaxed">
                เราช่วยคุณค้นหาทรัพย์สินในฝันด้วยเทคโนโลยีที่ทันสมัย
                และทีมงานมืออาชีพที่คอยดูแลคุณตลอดทุกขั้นตอน
              </p>

              {/* Trust Signals */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-slate-600">
                    ตรวจสอบแล้ว 100%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-slate-600">
                    ปลอดภัยทุกการทำธุรกรรม
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <span className="text-sm text-slate-600">
                    ตอบกลับภายใน 24 ชม.
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Smart Match Wizard */}
            <SmartMatchWizard />
          </div>
        </div>
      </section>

      {/* Property Categories - Categorical Choice */}
      <PropertyTypeGrid />

      {/* Detailed Search Section - The "Progressive Form" returned as a standalone section */}
      <section className="py-20 px-4 bg-white border-y border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              ค้นหาแบบละเอียด
            </h2>
            <p className="text-xl text-slate-600">
              ระบุความต้องการของคุณเพื่อผลลัพธ์ที่แม่นยำยิ่งขึ้น
            </p>
          </div>

          <div className="bg-slate-50 rounded-3xl p-8 md:p-12 shadow-inner border border-slate-100">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column: Form Fields */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    พื้นที่ที่ต้องการ
                  </label>
                  <Input
                    placeholder="เช่น สุขุมวิท, ทองหล่อ, อารีย์..."
                    className="h-12 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    ประเภทการถือครอง
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["ขาย", "เช่า"].map((item) => (
                      <button
                        key={item}
                        className="px-4 py-3 border-2 border-white bg-white rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all font-medium text-slate-600 shadow-sm"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    งบประมาณ
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="ต่ำสุด"
                      type="number"
                      className="h-12 bg-white"
                    />
                    <Input
                      placeholder="สูงสุด"
                      type="number"
                      className="h-12 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Visual CTA */}
              <div className="flex flex-col justify-center space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="p-4 bg-blue-50 rounded-full w-fit">
                  <Search className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    เริ่มค้นหาตอนนี้
                  </h3>
                  <p className="text-slate-600 mt-2">
                    เรามีทรัพย์สินมากกว่า 500+ รายการที่รอให้คุณเป็นเจ้าของ
                  </p>
                </div>
                <Button className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl">
                  แสดงทรัพย์สินทั้งหมด
                </Button>
                <p className="text-xs text-slate-400 text-center">
                  💡 การระบุงบประมาณช่วยลดการตัดสินใจ (Reduce Decision Fatigue)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Trust UX */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div className="space-y-2">
              <div className="text-4xl font-bold">500+</div>
              <div className="text-blue-100">ทรัพย์สินให้เลือก</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">1,200+</div>
              <div className="text-blue-100">ลูกค้าที่พึงพอใจ</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">98%</div>
              <div className="text-blue-100">ความสำเร็จ</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">24/7</div>
              <div className="text-blue-100">พร้อมให้บริการ</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Progressive Reveal */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-slate-900">วิธีการทำงาน</h2>
            <p className="text-xl text-slate-600">
              3 ขั้นตอนง่ายๆ ที่จะนำคุณไปสู่บ้านในฝัน
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: Search,
                title: "ค้นหาทรัพย์สิน",
                desc: "เลือกทำเลและประเภททรัพย์ที่คุณต้องการ ระบบจะคัดกรองตัวเลือกที่เหมาะกับคุณที่สุด",
                color: "blue",
              },
              {
                step: "2",
                icon: MapPin,
                title: "นัดชมทรัพย์",
                desc: "Agent ของเราจะติดต่อกลับภายใน 24 ชม. จัดนัดชมพร้อมให้คำปรึกษาฟรี",
                color: "purple",
              },
              {
                step: "3",
                icon: CheckCircle2,
                title: "ปิดดีลสำเร็จ",
                desc: "ช่วยดูแลทุกขั้นตอนจนปิดการขาย พร้อมดูแลเรื่องเอกสารให้ครบถ้วน",
                color: "green",
              },
            ].map((item, idx) => (
              <div key={idx} className="relative group">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 hover:shadow-2xl transition-all hover:-translate-y-2 duration-300">
                  {/* Step Number */}
                  <div
                    className={`absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg`}
                  >
                    {item.step}
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-16 h-16 bg-${item.color}-50 rounded-xl flex items-center justify-center mb-6`}
                  >
                    <item.icon className={`h-8 w-8 text-${item.color}-600`} />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">{item.desc}</p>

                  {/* Emotional Micro UX */}
                  <div className="mt-4 text-sm text-blue-600 font-medium flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    เริ่มขั้นตอนนี้เลย <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Trust UX + Emotional Connection */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-slate-900">
              ความคิดเห็นจากลูกค้า
            </h2>
            <p className="text-xl text-slate-600">
              พวกเขาเชื่อใจเรา คุณก็ทำได้เช่นกัน
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "คุณสมชาย ใจดี",
                role: "เจ้าของคอนโด",
                comment:
                  "ทีมงานมืออาชีพมาก ช่วยดูแลตั้งแต่ต้นจนจบ ขายได้ภายใน 2 สัปดาห์!",
                image: "👨‍💼",
              },
              {
                name: "คุณสมหญิง สวยงาม",
                role: "ผู้เช่าคอนโด",
                comment:
                  "หาคอนโดเช่าได้รวดเร็ว Agent ใจดี ตอบทุกคำถาม ประทับใจมากค่ะ",
                image: "👩‍💼",
              },
              {
                name: "คุณวีระ นักลงทุน",
                role: "นักลงทุน",
                comment: "ระบบดี ข้อมูลครบ ค้นหาง่าย ปิดดีลได้หลายโครงการแล้ว",
                image: "👔",
              },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 leading-relaxed">
                  "{testimonial.comment}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{testimonial.image}</div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-slate-500">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
            พร้อมที่จะเริ่มต้นหรือยัง?
          </h2>
          <p className="text-xl text-slate-600">
            เริ่มค้นหาบ้านในฝันของคุณวันนี้ ไม่มีค่าใช้จ่าย
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl"
            >
              <Search className="h-5 w-5 mr-2" />
              เริ่มค้นหาเลย
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-2"
            >
              ติดต่อ Agent
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white">
                <Home className="h-6 w-6" />
                <span className="text-xl font-bold">PropertyHub</span>
              </div>
              <p className="text-sm">แพลตฟอร์มอสังหาริมทรัพย์ที่คุณไว้วางใจ</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">บริการ</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    ซื้อ-ขาย
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    เช่า
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    ประเมินราคา
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">เกี่ยวกับ</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    เกี่ยวกับเรา
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    ทีมงาน
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    ติดต่อเรา
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">ติดตาม</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Facebook
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Line @
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-sm">
            © 2025 PropertyHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
