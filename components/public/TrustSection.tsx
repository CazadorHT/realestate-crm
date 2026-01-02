import { Shield, CheckCircle2, Clock, Star } from "lucide-react";

export function TrustSection() {
  return (
    <section id="trust" className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold text-slate-900">ทำไมต้อง PropertyHub</h2>
          <p className="text-xl text-slate-600">
            เราออกแบบประสบการณ์ให้ “ตัดสินใจง่าย” และ “มั่นใจได้จริง”
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-5">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">ข้อมูลตรวจสอบแล้ว</h3>
            <p className="text-slate-600 leading-relaxed">
              คัดกรองทรัพย์ก่อนแสดงผล ลดความเสี่ยงจากข้อมูลไม่ครบหรือไม่ตรงปก
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">ปลอดภัยทุกขั้นตอน</h3>
            <p className="text-slate-600 leading-relaxed">
              ชัดเจนเรื่องเอกสาร เงื่อนไข และขั้นตอนการทำธุรกรรม พร้อมคำแนะนำจากทีมงาน
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-5">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">ตอบกลับไว</h3>
            <p className="text-slate-600 leading-relaxed">
              ระบบช่วยคัดกรองความต้องการ และทีมงานติดต่อกลับเพื่อพาคุณไปสู่คำตอบที่เร็วที่สุด
            </p>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center gap-2 text-slate-600">
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">ความพึงพอใจจากลูกค้าจริง</span>
        </div>
      </div>
    </section>
  );
}
