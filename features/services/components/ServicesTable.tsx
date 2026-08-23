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
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
import { ServiceForm } from "@/features/admin/components/ServiceForm";
import { useLanguage } from "@/lib/i18n/language-context";

interface ServicesTableProps {
  services: ServiceRow[];
}

export function ServicesTable({ services }: ServicesTableProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSuccessFeedback = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("success", "true");
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await deleteService(deletingId);
      if (res.success) {
        toast.success(isEn ? "Deleted successfully" : "ลบบริการเรียบร้อยแล้ว");
        handleSuccessFeedback();
      } else {
        toast.error((isEn ? "Failed to delete: " : "เกิดข้อผิดพลาดในการลบ: ") + res.message);
      }
    } catch (error: any) {
      toast.error((isEn ? "Error: " : "ข้อผิดพลาด: ") + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSuccess = () => {
    setEditingService(null);
    handleSuccessFeedback();
  };

  return (
    <>
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[50px] text-center">#</TableHead>
              <TableHead>{isEn ? "Service Info" : "ข้อมูลบริการ"}</TableHead>
              <TableHead>{isEn ? "Price Range" : "ช่วงราคา"}</TableHead>
              <TableHead className="text-center">{isEn ? "Status" : "สถานะ"}</TableHead>
              <TableHead className="text-right">{isEn ? "Actions" : "จัดการ"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-slate-500"
                >
                  {isEn ? "No services found. Add your first service!" : "ไม่พบบริการ เริ่มต้นเพิ่มบริการแรกของคุณ!"}
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow
                  key={service.id}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="text-center text-slate-400 font-mono text-xs">
                    <div className="flex items-center justify-center gap-2">
                      <span>{service.sort_order}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-16 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0 relative">
                        {service.cover_image ? (
                          <Image
                            src={service.cover_image}
                            alt={service.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                            {isEn ? "No Img" : "ไม่มีภาพ"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900">
                          {service.title}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-slate-500 font-mono">
                            /{service.slug}
                          </div>
                          {service.gallery_images && service.gallery_images.length > 0 && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1 bg-slate-50 border-slate-200 text-slate-400">
                              +{service.gallery_images.length} {isEn ? "imgs" : "รูป"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-600 font-medium">
                      {service.price_range || (isEn ? "Inquire for price" : "สอบถามราคา")}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {service.is_active ? (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      >
                        <Eye className="w-3 h-3 mr-1" /> {isEn ? "Active" : "แสดงผล"}
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-slate-100 text-slate-500 hover:bg-slate-200"
                      >
                        <EyeOff className="w-3 h-3 mr-1" /> {isEn ? "Hidden" : "ซ่อน"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <Dialog
                        open={!!editingService}
                        onOpenChange={(open) =>
                          !open && setEditingService(null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                            onClick={() => setEditingService(service)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{isEn ? "Edit Service" : "แก้ไขบริการ"}</DialogTitle>
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
                        className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                        onClick={() => setDeletingId(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isEn ? "Are you sure?" : "ยืนยันการลบ?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isEn 
                ? "This action cannot be undone. This will permanently delete the service and its data." 
                : "การกระทำนี้ไม่สามารถย้อนกลับได้ บริการและข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบอย่างถาวร"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isEn ? "Cancel" : "ยกเลิก"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isEn ? "Delete" : "ลบข้อมูล"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
