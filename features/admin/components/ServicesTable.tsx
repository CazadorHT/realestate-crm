"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { deleteService, type ServiceRow } from "@/features/services/actions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ServiceForm } from "./ServiceForm";

interface ServicesTableProps {
  services: ServiceRow[];
}

export function ServicesTable({ services }: ServicesTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await deleteService(deletingId);
      if (res.success) {
        toast.success("ลบข้อมูลสำเร็จ");
        window.location.reload();
      } else {
        toast.error("ลบข้อมูลไม่สำเร็จ: " + res.message);
      }
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSuccess = () => {
    setEditingService(null);
    window.location.reload();
  };

  return (
    <>
      <div className="space-y-4">
        {/* Desktop Table View */}
        <div className="hidden lg:block rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[60px] text-center">ลำดับ</TableHead>
                <TableHead>ข้อมูลบริการ</TableHead>
                <TableHead>ช่วงราคา</TableHead>
                <TableHead className="text-center">สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-slate-400"
                  >
                    ไม่พบข้อมูลบริการ เริ่มต้นสร้างบริการแรกของคุณ!
                  </TableCell>
                </TableRow>
              ) : (
                services.map((service) => (
                  <TableRow
                    key={service.id}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell className="text-center text-slate-400 font-mono text-xs">
                      {service.sort_order}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-20 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                          {service.cover_image ? (
                            <img
                              src={service.cover_image}
                              alt={service.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px] text-center p-1">
                              ไม่มีรูป
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">
                            {service.title}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-1">
                            /{service.slug}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600 font-medium">
                        {service.price_range || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {service.is_active ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> แสดงผล
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-slate-50 text-slate-400 hover:bg-slate-100 border-slate-100"
                        >
                          <EyeOff className="w-3.5 h-3.5 mr-1.5" /> ซ่อนอยู่
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog
                          open={
                            !!editingService && editingService.id === service.id
                          }
                          onOpenChange={(open) =>
                            !open && setEditingService(null)
                          }
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-blue-600 hover:bg-blue-50 md:opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setEditingService(service)}
                            >
                              <Edit className="h-4.5 w-4.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-7xl! max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>แก้ไขข้อมูลบริการ</DialogTitle>
                            </DialogHeader>
                            {editingService && (
                              <ServiceForm
                                initialData={editingService}
                                onSuccess={handleEditSuccess}
                                onCancel={() => setEditingService(null)}
                              />
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-rose-600 hover:bg-rose-50 md:opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setDeletingId(service.id)}
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile & Tablet Card View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
          {services.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-400">
              ไม่พบข้อมูลบริการ
            </div>
          ) : (
            services.map((service) => (
              <div
                key={service.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 active:scale-[0.98] transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="h-16 w-24 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                    {service.cover_image ? (
                      <img
                        src={service.cover_image}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px]">
                        ไม่มีรูป
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        #{service.sort_order}
                      </span>
                      {service.is_active ? (
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] h-5 px-1.5 py-0">
                          แสดงผล
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-50 text-slate-400 border-slate-100 text-[10px] h-5 px-1.5 py-0">
                          ซ่อน
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 mt-1 truncate">
                      {service.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      /{service.slug}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      ช่วงราคา
                    </span>
                    <p className="text-sm font-semibold text-slate-700">
                      {service.price_range || "-"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Dialog
                      open={
                        !!editingService && editingService.id === service.id
                      }
                      onOpenChange={(open) => !open && setEditingService(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-50"
                          onClick={() => setEditingService(service)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          แก้ไข
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-7xl! max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>แก้ไขข้อมูลบริการ</DialogTitle>
                        </DialogHeader>
                        {editingService && (
                          <ServiceForm
                            initialData={editingService}
                            onSuccess={handleEditSuccess}
                            onCancel={() => setEditingService(null)}
                          />
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 text-rose-600 border-rose-100 bg-rose-50/50 hover:bg-rose-50"
                      onClick={() => setDeletingId(service.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent className="w-[95%] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>คุณแน่ใจหรือไม่?</AlertDialogTitle>
            <AlertDialogDescription>
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
              ข้อมูลบริการนี้จะถูกลบออกอย่างถาวร
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="w-full sm:w-auto rounded-xl">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 rounded-xl"
            >
              ยืนยันการลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
