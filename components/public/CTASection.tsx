import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function CTASection() {
  return (
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
  );
}
