"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Plus, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { createPopularAreaAction } from "@/features/admin/popular-areas-actions";
import { ProvinceSelector } from "./ProvinceSelector";

export function CreatePopularAreaButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemNameEn, setItemNameEn] = useState("");
  const [itemNameCn, setItemNameCn] = useState("");
  const [itemProvince, setItemProvince] = useState("กรุงเทพมหานคร");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSuccessFeedback = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("success", "true");
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  };

  const handleSave = async () => {
    if (!itemName.trim()) return toast.error("ชื่อทำเลห้ามว่าง");

    setIsLoading(true);
    const res = await createPopularAreaAction(
      itemName,
      itemProvince,
      itemNameEn,
      itemNameCn,
    );
    setIsLoading(false);

    if (res?.success === false) {
      toast.error(res.message || "เกิดข้อผิดพลาด");
    } else {
      toast.success(res.message || "เพิ่มทำเลสำเร็จ");
      setIsDialogOpen(false);
      setItemName("");
      setItemNameEn("");
      setItemNameCn("");
      setItemProvince("กรุงเทพมหานคร");
      handleSuccessFeedback();
    }
  };

  return (
    <ResponsiveDialog
      open={isDialogOpen}
      onOpenChange={(open: boolean) => setIsDialogOpen(open)}
      title="เพิ่มทำเลใหม่"
      description="ระบุชื่อทำเลและจังหวัดให้ถูกต้องเพื่อการแสดงผลในระบบ"
      className="md:max-w-md"
      trigger={
        <Button
          size="lg"
          className="bg-white text-slate-800 hover:bg-slate-50 shadow-lg hover:shadow-xl transition-all duration-300 font-bold rounded-2xl h-12 border border-slate-100"
        >
          <Plus className="mr-2 h-5 w-5 text-indigo-600" />
          เพิ่มทำเลใหม่
        </Button>
      }
    >
      <div className="space-y-5 py-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">จังหวัด</label>
            <ProvinceSelector
              value={itemProvince}
              onChange={setItemProvince}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">ชื่อทำเล (ไทย)</label>
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="เช่น สุขุมวิท, ทองหล่อ"
              className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500/10 transition-all font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Name (English)</label>
            <Input
              value={itemNameEn}
              onChange={(e) => setItemNameEn(e.target.value)}
              placeholder="e.g. Sukhumvit, Thong Lo"
              className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500/10 transition-all text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">名称 (Chinese)</label>
            <Input
              value={itemNameCn}
              onChange={(e) => setItemNameCn(e.target.value)}
              placeholder="例如：素坤逸, 通罗"
              className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500/10 transition-all text-sm"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button 
            variant="ghost" 
            onClick={() => setIsDialogOpen(false)}
            className="flex-1 rounded-xl h-11 font-bold text-slate-500 hover:bg-slate-100"
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !itemName.trim() || !itemProvince.trim()}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 transition-all active:scale-95 px-8 rounded-xl h-11 font-bold"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            บันทึกข้อมูล
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
