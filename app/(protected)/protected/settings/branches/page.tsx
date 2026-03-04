"use client";

import React, { useEffect, useState } from "react";
import {
  getTenantsAction,
  createTenantAction,
  updateTenantAction,
  deleteTenantAction,
} from "@/lib/actions/tenant-management";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Building2,
  Users,
  ChevronRight,
  Loader2,
  Edit2,
  Trash2,
  AlertTriangle,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: "", slug: "" });
  const [editOpen, setEditOpen] = useState(false);
  const [editBranch, setEditBranch] = useState({ id: "", name: "", slug: "" });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchBranches = async () => {
    setIsLoading(true);
    const res = await getTenantsAction();
    if (res.data) {
      setBranches(res.data);
    } else {
      toast.error(res.error || "ไม่สามารถโหลดข้อมูลสาขาได้");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    const res = await createTenantAction(newBranch);
    if (res.data) {
      toast.success("สร้างสาขาสำเร็จ");
      setOpen(false);
      setNewBranch({ name: "", slug: "" });
      fetchBranches();
    } else {
      toast.error(res.error || "ไม่สามารถสร้างสาขาได้");
    }
    setIsCreating(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const res = await updateTenantAction(editBranch.id, {
      name: editBranch.name,
      slug: editBranch.slug,
    });
    if (res.data) {
      toast.success("อัปเดตสาขาสำเร็จ");
      setEditOpen(false);
      fetchBranches();
    } else {
      toast.error(res.error || "ไม่สามารถอัปเดตสาขาได้");
    }
    setIsProcessing(false);
  };

  const handleDelete = async () => {
    if (!branchToDelete) return;
    setIsProcessing(true);
    const res = await deleteTenantAction(branchToDelete.id);
    if (res.success) {
      toast.success("ลบสาขาสำเร็จ");
      setDeleteOpen(false);
      setBranchToDelete(null);
      fetchBranches();
    } else {
      toast.error(res.error || "ไม่สามารถลบสาขาได้");
    }
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จัดการสาขา</h1>
          <p className="text-slate-500 text-sm">
            แสดงรายการและบริหารจัดการสาขา/แฟรนไชส์ทั้งหมดในระบบ
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มสาขาใหม่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>เพิ่มสาขาใหม่</DialogTitle>
                <DialogDescription>
                  กรอกข้อมูลพื้นฐานเพื่อเริ่มต้นสาขาใหม่ในระบบ
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">ชื่อสาขา</Label>
                  <Input
                    id="name"
                    placeholder="เช่น สาขาเชียงใหม่, Real Estate Plus"
                    value={newBranch.name}
                    onChange={(e) =>
                      setNewBranch({ ...newBranch, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    placeholder="เช่น chiang-mai (ภาษาอังกฤษเท่านั้น)"
                    value={newBranch.slug}
                    onChange={(e) =>
                      setNewBranch({
                        ...newBranch,
                        slug: e.target.value.toLowerCase().replace(/ /g, "-"),
                      })
                    }
                    required
                  />
                  <p className="text-[10px] text-slate-400">
                    ใช้สำหรับระบุตัวตนสาขาใน URL เช่น /t/chiang-mai
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  สร้างสาขา
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <div key={branch.id} className="relative group">
              <Link href={`/protected/settings/branches/${branch.id}`}>
                <Card className="hover:border-blue-300 transition-all group overflow-hidden h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-600 transition-colors">
                        <Building2 className="h-5 w-5 text-blue-600 group-hover:text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-slate-100"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <MoreVertical className="h-4 w-4 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditBranch({
                                  id: branch.id,
                                  name: branch.name,
                                  slug: branch.slug,
                                });
                                setEditOpen(true);
                              }}
                            >
                              <Edit2 className="mr-2 h-4 w-4" />
                              <span>แก้ไขข้อมูล</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600 focus:text-red-600"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setBranchToDelete({
                                  id: branch.id,
                                  name: branch.name,
                                });
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>ลบสาขา</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <CardTitle className="mt-4">{branch.name}</CardTitle>
                    <CardDescription>Slug: {branch.slug}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        <span>{branch.memberCount} พนักงาน</span>
                      </div>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}

          {branches.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center h-64 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <Building2 className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">ยังไม่มีสาขาในระบบ</p>
              <Button variant="link" onClick={() => setOpen(true)}>
                เพิ่มสาขาแรกของคุณ
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Edit Branch Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>แก้ไขข้อมูลสาขา</DialogTitle>
              <DialogDescription>
                อัปเดตชื่อสาขาหรือ Slug ของคุณ
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">ชื่อสาขา</Label>
                <Input
                  id="edit-name"
                  value={editBranch.name}
                  onChange={(e) =>
                    setEditBranch({ ...editBranch, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-slug">Slug (URL)</Label>
                <Input
                  id="edit-slug"
                  value={editBranch.slug}
                  onChange={(e) =>
                    setEditBranch({
                      ...editBranch,
                      slug: e.target.value.toLowerCase().replace(/ /g, "-"),
                    })
                  }
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                บันทึกการเปลี่ยนแปลง
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Branch Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              ยืนยันการลบสาขา
            </DialogTitle>
            <DialogDescription className="text-slate-600 pt-2">
              คุณแน่ใจหรือไม่ว่าต้องการลบสาขา{" "}
              <strong>"{branchToDelete?.name}"</strong>?
              <br />
              <br />
              <span className="text-red-500 font-bold">⚠️ คำเตือน:</span>{" "}
              ข้อมูลทั้งหมดที่เกี่ยวข้องกับสาขานี้ (Leads, Properties, สัญญา)
              อาจจะไม่สามารถเข้าถึงได้อีก
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isProcessing}
              onClick={handleDelete}
            >
              {isProcessing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              ยืนยันการลบข้อมูล
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
