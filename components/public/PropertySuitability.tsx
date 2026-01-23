import { Wallet, Briefcase, TrendingUp } from "lucide-react";

interface PropertySuitabilityProps {
  listingType: "SALE" | "RENT" | "SALE_AND_RENT";
  price: number | null;
  rentalPrice: number | null;
}

export function PropertySuitability({
  listingType,
  price,
  rentalPrice,
}: PropertySuitabilityProps) {
  // Logic for rental yield if both prices exist
  const rentalYield =
    price && rentalPrice ? ((rentalPrice * 12) / price) * 100 : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="font-bold text-slate-800 text-lg">หลังนี้เหมาะกับใคร?</h3>

      <div className="flex flex-col gap-4">
        {/* For Renters */}
        {(listingType === "RENT" || listingType === "SALE_AND_RENT") && (
          <div className="flex gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
            <div className="bg-blue-100 p-2 rounded-lg h-fit text-blue-600">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-blue-700 text-sm mb-1">
                เหมาะเช่า
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                ผู้บริหาร / ครอบครัว Expat
                ที่ต้องการความยืดหยุ่นและการดูแลครบวงจร
              </p>
            </div>
          </div>
        )}

        {/* For Buyers */}
        {(listingType === "SALE" || listingType === "SALE_AND_RENT") && (
          <div className="flex gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
            <div className="bg-emerald-100 p-2 rounded-lg h-fit text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-emerald-700 text-sm mb-1">
                เหมาะซื้อ
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                อยู่อาศัยระยะยาว หรือลงทุนปล่อยเช่าเพื่อสร้าง Passive Income
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Yield Calculation */}
      {rentalYield && (
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-700 text-sm">
              โอกาสทองในการลงทุน
            </p>
            <p className="text-xs text-slate-500">
              ราคาเช่า ฿{rentalPrice?.toLocaleString()}/เดือน คิดเป็นผลตอบแทน{" "}
              <span className="font-bold text-amber-600">
                ~{rentalYield.toFixed(1)}% ต่อปี
              </span>{" "}
              จากราคาขาย
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
