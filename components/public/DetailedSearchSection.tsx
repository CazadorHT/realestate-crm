import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";

export function DetailedSearchSection() {
  return (
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
            {/* Left: Form */}
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
                      type="button"
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

            {/* Right: CTA */}
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
  );
}
