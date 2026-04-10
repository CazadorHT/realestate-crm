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
  Layers,
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
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 🦴 Shimmer Loading Grid for Elite UX
 */
function BranchCardSkeleton() {
  return (
    <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm animate-pulse">
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 bg-slate-200 rounded-xl" />
        <div className="w-8 h-8 bg-slate-100 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-6 bg-slate-200 rounded-md w-3/4" />
        <div className="h-4 bg-slate-100 rounded-md w-1/2" />
      </div>
      <div className="pt-4 flex justify-between items-center">
        <div className="h-4 bg-slate-100 rounded-md w-24" />
        <div className="h-4 bg-slate-200 rounded-full w-4" />
      </div>
    </div>
  );
}

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
    <div className="space-y-0">
      <SettingsHeader
        title="จัดการสาขา & แฟรนไชส์"
        description="บริหารจัดการโครงสร้างองค์กรและสิทธิ์การเข้าถึงรายสาขา"
        subPath={[{ label: "System Control", href: "/protected/settings" }, { label: "จัดการสาขา" }]}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 px-6 shadow-lg shadow-slate-200 transition-all active:scale-95">
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มสาขาใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-slate-100 sm:max-w-[425px] overflow-hidden">
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-slate-900">เพิ่มสาขาใหม่</DialogTitle>
                  <DialogDescription className="text-slate-500">
                    กรอกข้อมูลพื้นฐานเพื่อเริ่มต้นสาขาใหม่ในระบบ
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-8">
                  <div className="grid gap-3">
                    <Label htmlFor="name" className="text-sm font-semibold text-slate-700">ชื่อสาขา</Label>
                    <Input
                      id="name"
                      placeholder="เช่น สาขาเชียงใหม่, Real Estate Plus"
                      className="h-12 rounded-xl border-slate-200 focus:ring-slate-900"
                      value={newBranch.name}
                      onChange={(e) =>
                        setNewBranch({ ...newBranch, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="slug" className="text-sm font-semibold text-slate-700">Slug (URL)</Label>
                    <Input
                      id="slug"
                      placeholder="เช่น chiang-mai"
                      className="h-12 rounded-xl border-slate-200 focus:ring-slate-900 font-mono text-sm"
                      value={newBranch.slug}
                      onChange={(e) =>
                        setNewBranch({
                          ...newBranch,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                        })
                      }
                      required
                    />
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <Layers size={12} className="text-blue-500" />
                      ใช้สำหรับระบุตัวตนสาขาในระบบ เช่น /t/chiang-mai
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-xl h-12 text-slate-500 hover:bg-slate-50"
                    onClick={() => setOpen(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isCreating}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 px-8 shadow-lg shadow-slate-200 transition-all"
                  >
                    {isCreating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Building2 className="mr-2 h-4 w-4" />
                    )}
                    สร้างสาขา
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="p-8 pt-4">

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <BranchCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {branches.map((branch) => (
              <motion.div
                key={branch.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative"
              >
                <Link href={`/protected/settings/branches/${branch.id}`}>
                  <div className="bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-6 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300 group hover:-translate-y-1 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-2xl group-hover:bg-slate-900 transition-colors duration-300 shadow-inner">
                          <Building2 className="h-6 w-6 text-slate-400 group-hover:text-white" />
                        </div>
                        <div className="flex items-center gap-3">
                          {/* 📡 Status Pulse */}
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Active
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-xl hover:bg-slate-100 transition-colors"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <MoreVertical className="h-4 w-4 text-slate-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 p-2 min-w-[160px] shadow-xl">
                              <DropdownMenuItem
                                className="rounded-xl cursor-pointer py-2.5"
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
                                <Edit2 className="mr-3 h-4 w-4 text-slate-500" />
                                <span className="font-medium text-slate-700">แก้ไขข้อมูล</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="rounded-xl cursor-pointer py-2.5 text-red-600 focus:text-red-700 focus:bg-red-50"
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
                                <Trash2 className="mr-3 h-4 w-4" />
                                <span className="font-medium">ลบสาขา</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {branch.name}
                      </h3>
                      <p className="text-slate-400 text-sm font-mono flex items-center gap-1">
                        <Layers size={14} className="opacity-50" />
                        {branch.slug}
                      </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {[1, 2].map((i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                              <Users size={14} className="text-slate-400" />
                            </div>
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-slate-500">
                          {branch.memberCount} พนักงาน
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>

          {branches.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full flex flex-col items-center justify-center py-20 px-6 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200"
            >
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-slate-200 mb-6">
                <Building2 className="h-10 w-10 text-slate-200" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">ยังไม่มีสาขาในระบบ</h4>
              <p className="text-slate-500 text-center max-w-sm mb-8">
                เริ่มต้นสร้างสาขาหรือแฟรนไชส์ของคุณ เพื่อแยกการบริหารจัดการข้อมูลและพนักงาน
              </p>
              <Button 
                onClick={() => setOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-14 px-8 shadow-xl shadow-slate-200"
              >
                <Plus className="mr-2 h-5 w-5" />
                สร้างสาขาแรกของคุณ
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Edit Branch Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-[32px] border-slate-100 sm:max-w-[425px] overflow-hidden">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">แก้ไขข้อมูลสาขา</DialogTitle>
              <DialogDescription className="text-slate-500">
                อัปเดตชื่อสาขาหรือ Slug ของคุณเพื่อให้ข้อมูลเป็นปัจจุบัน
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-8">
              <div className="grid gap-3">
                <Label htmlFor="edit-name" className="text-sm font-semibold text-slate-700">ชื่อสาขา</Label>
                <Input
                  id="edit-name"
                  className="h-12 rounded-xl border-slate-200 focus:ring-slate-900"
                  value={editBranch.name}
                  onChange={(e) =>
                    setEditBranch({ ...editBranch, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="edit-slug" className="text-sm font-semibold text-slate-700">Slug (URL)</Label>
                <Input
                  id="edit-slug"
                  className="h-12 rounded-xl border-slate-200 focus:ring-slate-900 font-mono text-sm"
                  value={editBranch.slug}
                  onChange={(e) =>
                    setEditBranch({
                      ...editBranch,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                    })
                  }
                  required
                />
              </div>
            </div>
            <DialogFooter className="bg-slate-50/50 -mx-6 -mb-6 p-6 px-10">
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl h-12 text-slate-500 hover:bg-white"
                onClick={() => setEditOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button 
                type="submit" 
                disabled={isProcessing}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 px-8 shadow-lg shadow-slate-200"
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Edit2 className="mr-2 h-4 w-4" />
                )}
                บันทึกการเปลี่ยนแปลง
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Branch Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-[32px] border-slate-100 sm:max-w-md overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-red-600">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center relative">
                <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-red-400 opacity-20"></span>
                <AlertTriangle size={20} className="relative" />
              </div>
              ยืนยันการลบสาขา
            </DialogTitle>
            <DialogDescription className="text-slate-600 pt-4 leading-relaxed">
              คุณแน่ใจหรือไม่ว่าต้องการลบสาขา{" "}
              <strong className="text-slate-900 text-lg">"{branchToDelete?.name}"</strong>?
              <br />
              <div className="mt-4 p-4 bg-red-50/50 rounded-2xl border border-red-100/50">
                <span className="text-red-600 font-bold flex items-center gap-2 mb-1">
                  <AlertTriangle size={14} /> ⚠️ คำเตือน:
                </span>{" "}
                ข้อมูลทั้งหมดที่เกี่ยวข้องกับสาขานี้ (Leads, Properties, สัญญา)
                จะหายไปและไม่สามารถกู้คืนได้
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 -mx-6 -mb-6 p-6 px-10 bg-slate-50/50">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl h-12 text-slate-500 hover:bg-white"
              onClick={() => setDeleteOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isProcessing}
              className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-red-100"
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
    </div>
  );
}
