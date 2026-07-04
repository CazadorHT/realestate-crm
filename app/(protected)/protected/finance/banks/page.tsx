"use client";

import { useEffect, useState, startTransition } from "react";
import {
  getAllBanksAction,
  createBankAction,
  updateBankAction,
  deleteBankAction,
} from "@/features/finance/bank-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Building2, Plus, Edit2, Trash2, ShieldCheck, Loader2 } from "lucide-react";

type Bank = {
  id: number;
  code: string;
  name_th: string;
  name_en: string;
  is_active: boolean;
  created_at?: string;
};

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchBanks = async () => {
    setLoading(true);
    const res = await getAllBanksAction();
    if (res.success && res.data) {
      setBanks(res.data as Bank[]);
    } else {
      toast.error(res.error || "ไม่สามารถดึงข้อมูลธนาคารได้");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleOpenAdd = () => {
    setEditingBank(null);
    setCode("");
    setNameTh("");
    setNameEn("");
    setIsActive(true);
    setDialogOpen(true);
  };

  const handleOpenEdit = (bank: Bank) => {
    setEditingBank(bank);
    setCode(bank.code);
    setNameTh(bank.name_th);
    setNameEn(bank.name_en);
    setIsActive(bank.is_active);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !nameTh || !nameEn) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setSubmitting(true);
    if (editingBank) {
      const res = await updateBankAction(editingBank.id, {
        code,
        name_th: nameTh,
        name_en: nameEn,
        is_active: isActive,
      });
      if (res.success) {
        toast.success("แก้ไขข้อมูลธนาคารสำเร็จ ✨");
        setDialogOpen(false);
        fetchBanks();
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
      }
    } else {
      const res = await createBankAction({
        code,
        name_th: nameTh,
        name_en: nameEn,
        is_active: isActive,
      });
      if (res.success) {
        toast.success("เพิ่มข้อมูลธนาคารใหม่สำเร็จ ✨");
        setDialogOpen(false);
        fetchBanks();
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาดในการเพิ่มธนาคาร");
      }
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบธนาคารนี้?")) return;
    const res = await deleteBankAction(id);
    if (res.success) {
      toast.success("ลบธนาคารสำเร็จ");
      fetchBanks();
    } else {
      toast.error(res.error || "ไม่สามารถลบธนาคารได้");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-400" />
            <h1 className="text-2xl font-black tracking-tight">ระบบจัดการธนาคาร (Bank Management)</h1>
          </div>
          <p className="text-xs text-slate-300">
            จัดการข้อมูลธนาคารไทยมาตรฐาน เพื่อใช้สำหรับการโอนเงินและรับคอมมิชชั่นของเอเจ้นท์
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl gap-2 font-bold transition-all transform active:scale-95 shadow-lg shadow-indigo-500/20"
        >
          <Plus className="h-4 w-4" />
          เพิ่มธนาคาร
        </Button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg">รายชื่อธนาคารทั้งหมด ({banks.length})</h2>
          <Badge className="bg-emerald-100 text-emerald-800 border-none rounded-lg text-xs flex gap-1 items-center">
            <ShieldCheck className="h-3.5 w-3.5" /> Agent สามารถจัดการข้อมูลได้
          </Badge>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <span className="text-sm font-medium">กำลังโหลดข้อมูลธนาคาร...</span>
          </div>
        ) : banks.length === 0 ? (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <Building2 className="h-12 w-12 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600">ยังไม่มีข้อมูลธนาคาร</p>
            <p className="text-xs">กดปุ่ม "เพิ่มธนาคาร" ด้านบนเพื่อเพิ่มข้อมูลแรก</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow>
                  <TableHead className="w-24 font-bold text-slate-500 text-xs pl-6">รหัสย่อ (Code)</TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs">ชื่อภาษาไทย</TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs">ชื่อภาษาอังกฤษ</TableHead>
                  <TableHead className="w-32 font-bold text-slate-500 text-xs text-center">สถานะการใช้งาน</TableHead>
                  <TableHead className="w-28 font-bold text-slate-500 text-xs text-right pr-6">เครื่องมือ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banks.map((bank) => (
                  <TableRow key={bank.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6 font-black text-slate-800 text-sm">{bank.code}</TableCell>
                    <TableCell className="font-semibold text-slate-700 text-sm">{bank.name_th}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{bank.name_en}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          bank.is_active
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-100 rounded-full"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-100 border border-slate-200 rounded-full"
                        }
                      >
                        {bank.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(bank)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 rounded-lg"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(bank.id)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <ResponsiveDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingBank ? "แก้ไขข้อมูลธนาคาร" : "เพิ่มธนาคารใหม่"}
        description="กรอกข้อมูลธนาคารหลักให้ถูกต้องและครบถ้วน"
        className="sm:max-w-md bg-white"
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 ml-0.5">รหัสย่อธนาคาร (เช่น KBANK, SCB)</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="เช่น KBANK"
              disabled={submitting}
              className="rounded-xl h-11 border-slate-200"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 ml-0.5">ชื่อธนาคาร (ภาษาไทย)</label>
            <Input
              value={nameTh}
              onChange={(e) => setNameTh(e.target.value)}
              placeholder="เช่น ธนาคารกสิกรไทย"
              disabled={submitting}
              className="rounded-xl h-11 border-slate-200"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 ml-0.5">ชื่อธนาคาร (ภาษาอังกฤษ)</label>
            <Input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="เช่น Kasikornbank"
              disabled={submitting}
              className="rounded-xl h-11 border-slate-200"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-700">เปิดใช้งานระบบ</p>
              <p className="text-[10px] text-slate-400">อนุญาตให้เลือกใช้งานธนาคารนี้ได้ในหน้าธุรกรรม</p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={submitting}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
              className="rounded-xl h-11 border-slate-200"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-11 px-6 font-bold"
            >
              {submitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </Button>
          </div>
        </form>
      </ResponsiveDialog>
    </div>
  );
}
