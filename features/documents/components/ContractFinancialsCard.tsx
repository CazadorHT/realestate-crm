import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText } from "lucide-react";

interface ContractFinancialsCardProps {
  reservationFee: string;
  setReservationFee: (val: string) => void;
  securityDeposit: string;
  setSecurityDeposit: (val: string) => void;
  bookingAmount: string;
  setBookingAmount: (val: string) => void;
  contractDueDate: string;
  setContractDueDate: (val: string) => void;
  unitNumberOverride: string;
  setUnitNumberOverride: (val: string) => void;
  floorOverride: string;
  setFloorOverride: (val: string) => void;
  dealRentalPrice: number | null;
  showOverridePrice: boolean;
  setShowOverridePrice: (val: boolean) => void;
}

export function ContractFinancialsCard({
  reservationFee,
  setReservationFee,
  securityDeposit,
  setSecurityDeposit,
  bookingAmount,
  setBookingAmount,
  contractDueDate,
  setContractDueDate,
  unitNumberOverride,
  setUnitNumberOverride,
  floorOverride,
  setFloorOverride,
  dealRentalPrice,
  showOverridePrice,
  setShowOverridePrice,
}: ContractFinancialsCardProps) {
  return (
    <div className="p-6 rounded-3xl border border-slate-100 bg-white space-y-5 shadow-sm">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="p-2.5 bg-blue-50/80 text-blue-600 rounded-xl">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-800 tracking-tight">2. มูลค่ามัดจำ ประกัน และยูนิตห้อง</h4>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">ระบุยอดเงินมัดจำจอง เงินประกัน กำหนดการ และข้อมูลห้อง</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="reservationFee" className="text-xs font-semibold text-slate-500 ml-1">เงินมัดจำ / ค่าจอง</Label>
          <Input
            id="reservationFee"
            placeholder="ระบุค่าจอง (เช่น 5000)"
            value={reservationFee}
            onChange={(e) => setReservationFee(e.target.value)}
            className="h-10 rounded-xl border-slate-200 bg-white text-xs"
          />
          <div className="flex gap-1 mt-1">
            {[1, 2, 3].map((m) => (
              <Button
                key={m}
                type="button"
                variant="outline"
                className="h-6 text-[10px] px-2 py-0 rounded-lg border-slate-200 text-slate-500! hover:bg-slate-50 transition-colors"
                onClick={() => {
                  if (dealRentalPrice) {
                    setReservationFee(String(dealRentalPrice * m));
                  }
                }}
                disabled={!dealRentalPrice}
              >
                {m} เดือน
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="securityDeposit" className="text-xs font-semibold text-slate-500 ml-1">เงินประกัน</Label>
          <Input
            id="securityDeposit"
            placeholder="ระบุเงินประกัน (เช่น 20000)"
            value={securityDeposit}
            onChange={(e) => setSecurityDeposit(e.target.value)}
            className="h-10 rounded-xl border-slate-200 bg-white text-xs"
          />
          <div className="flex gap-1 mt-1">
            {[1, 2, 3].map((m) => (
              <Button
                key={m}
                type="button"
                variant="outline"
                className="h-6 text-[10px] px-2 py-0 rounded-lg border-slate-200 text-slate-500! hover:bg-slate-50 transition-colors"
                onClick={() => {
                  if (dealRentalPrice) {
                    setSecurityDeposit(String(dealRentalPrice * m));
                  }
                }}
                disabled={!dealRentalPrice}
              >
                {m} เดือน
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Price Override Box */}
      <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/80">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="toggleOverridePrice" className="text-xs font-semibold text-slate-700">ต้องการแก้ไขราคาอสังหาฯ / ค่าเช่า</Label>
            <p className="text-[10px] text-slate-400 font-medium">เปิดใช้งานเมื่อต้องการระบุราคาอื่นที่ไม่ตรงกับดีล</p>
          </div>
          <Checkbox
            id="toggleOverridePrice"
            checked={showOverridePrice}
            onCheckedChange={(checked) => {
              setShowOverridePrice(!!checked);
              if (!checked) setBookingAmount("");
            }}
          />
        </div>
        
        {showOverridePrice && (
          <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <Input
              id="bookingAmount"
              placeholder="ระบุราคาอสังหาฯ (เช่น 23000)"
              value={bookingAmount}
              onChange={(e) => setBookingAmount(e.target.value)}
              className="h-10 rounded-xl border-slate-200 bg-white text-xs"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="contractDueDate" className="text-xs font-semibold text-slate-500 ml-1">กำหนดวันทำสัญญา</Label>
          <Input
            id="contractDueDate"
            placeholder="เช่น 15th July 2026"
            value={contractDueDate}
            onChange={(e) => setContractDueDate(e.target.value)}
            className="h-10 rounded-xl border-slate-200 bg-white text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unitNumberOverride" className="text-xs font-semibold text-slate-500 ml-1">เลขที่ห้อง</Label>
          <Input
            id="unitNumberOverride"
            placeholder="เช่น 123/45"
            value={unitNumberOverride}
            onChange={(e) => setUnitNumberOverride(e.target.value)}
            className="h-10 rounded-xl border-slate-200 bg-white text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="floorOverride" className="text-xs font-semibold text-slate-500 ml-1">ชั้นที่</Label>
          <Input
            id="floorOverride"
            placeholder="เช่น 18"
            value={floorOverride}
            onChange={(e) => setFloorOverride(e.target.value)}
            className="h-10 rounded-xl border-slate-200 bg-white text-xs"
          />
        </div>
      </div>
    </div>
  );
}
