"use client";

import React, { useEffect, useState, use } from "react";
import {
  getTenantMembersAction,
  addTenantMemberAction,
  removeTenantMemberAction,
  transferTenantMemberAction,
  getTenantsAction,
  getAllProfilesAction,
  getTenantInvitationsAction,
  cancelTenantInvitationAction,
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
  UserPlus,
  Trash2,
  ArrowLeft,
  Loader2,
  Building2,
  Mail,
  ShieldCheck,
  User,
  ShieldAlert,
  UserCircle,
  Link,
  ArrowRightLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/components/providers/TenantProvider";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function BranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [branch, setBranch] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [open, setOpen] = useState(false);
  const [newMember, setNewMember] = useState({ email: "", role: "AGENT" });
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferData, setTransferData] = useState<{
    profileId: string;
    role: string;
    name: string;
  } | null>(null);
  const [targetTenantId, setTargetTenantId] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const { refresh: refreshTenants } = useTenant();

  const fetchData = async () => {
    setIsLoading(true);

    // 1. Fetch all tenants to find this specific one
    const bRes = await getTenantsAction();
    const current = bRes.data?.find((t: any) => t.id === id);
    setBranch(current);
    setBranches(bRes.data || []);

    // 2. Fetch members
    const mRes = await getTenantMembersAction(id);
    if (mRes.data) {
      setMembers(mRes.data);
    } else {
      toast.error(mRes.error || "ไม่สามารถโหลดรายชื่อสมาชิกได้");
    }

    // 3. Fetch all profiles for the selection list
    const pRes = await getAllProfilesAction();
    setAllProfiles(pRes.data || []);

    // 4. Fetch pending invitations
    const iRes = await getTenantInvitationsAction(id);
    setInvitations(iRes.data || []);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    const res = await addTenantMemberAction({
      tenantId: id,
      email: newMember.email,
      role: newMember.role as any,
    });

    if (res.success) {
      toast.success("เพิ่มสมาชิกเรียบร้อย");
      setOpen(false);
      setNewMember({ email: "", role: "AGENT" });
      await fetchData();
      await refreshTenants();
    } else {
      toast.error(res.error || "ไม่สามารถเพิ่มสมาชิกได้");
    }
    setIsAdding(false);
  };

  const handleRemoveMember = async (profileId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบสมาชิกรายนี้ออกจากสาขา?")) return;

    const res = await removeTenantMemberAction(id, profileId);
    if (res.success) {
      toast.success("ลบสมาชิกเรียบร้อย");
      await fetchData();
      await refreshTenants();
    } else {
      toast.error(res.error || "ไม่สามารถลบสมาชิกได้");
    }
  };

  const handleCancelInvitation = async (inviteId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำเชิญนี้?")) return;

    const res = await cancelTenantInvitationAction(inviteId);
    if (res.success) {
      toast.success("ยกเลิกคำเชิญเรียบร้อย");
      await fetchData();
    } else {
      toast.error(res.error || "ไม่สามารถยกเลิกคำเชิญได้");
    }
  };

  const handleTransferMember = async () => {
    if (!transferData || !targetTenantId) return;
    setIsTransferring(true);

    const res = await transferTenantMemberAction({
      profileId: transferData.profileId,
      fromTenantId: id,
      toTenantId: targetTenantId,
      role: transferData.role as any,
    });

    if (res.success) {
      toast.success("ย้ายสาขาเรียบร้อย");
      setTransferOpen(false);
      setTransferData(null);
      setTargetTenantId("");
      await fetchData();
      await refreshTenants();
    } else {
      toast.error(res.error || "ไม่สามารถย้ายสาขาได้");
    }
    setIsTransferring(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/protected/settings/branches">
          <Button variant="outline" size="icon" className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {branch?.name || "โหลดข้อมูล..."}
          </h1>
          <p className="text-slate-500 text-sm">
            จัดการสมาชิกและสิทธิ์การเข้าถึงข้อมูลของสาขานี้
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch Info Card */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">ข้อมูลสาขา</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Building2 className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">ชื่อทางการ</p>
                <p className="text-sm font-semibold">{branch?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Slug ID</p>
                <p className="text-sm font-mono">{branch?.slug}</p>
              </div>
            </div>
            <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-2">
                สิทธิ์การจัดการ
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                เฉพาะ Admin
                ของระบบเท่านั้นที่สามารถเพิ่มหรือย้ายพนักงานข้ามสาขาได้
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Members List Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">พนักงานในสังกัด</CardTitle>
              <CardDescription>
                จัดการพนักงานและสิทธิ์การเข้าถึงข้อมูลของสาขานี้
              </CardDescription>
            </div>

            <div className="flex gap-2">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="mr-2 h-4 w-4" />
                    เพิ่มพนักงาน
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleAddMember}>
                    <DialogHeader>
                      <DialogTitle>เพิ่มพนักงานเข้าสู่สาขา</DialogTitle>
                      <DialogDescription>
                        ระบุอีเมลของพนักงานที่สมัครสมาชิกในระบบแล้ว
                        เพื่อดึงเข้าสู่สาขา
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="user-select">
                          เลือกพนักงานจากรายชื่อ
                        </Label>
                        <Select
                          onValueChange={(email) => {
                            setNewMember({ ...newMember, email });
                            setSearchQuery("");
                          }}
                        >
                          <SelectTrigger
                            id="user-select"
                            className="w-full px-3 py-6"
                          >
                            <SelectValue placeholder="ค้นหาหรือเลือกพนักงานจากรายชื่อ..." />
                          </SelectTrigger>
                          <SelectContent className="z-200 w-full min-w-(--radix-select-trigger-width) max-h-64 overflow-y-auto">
                            <div className="flex flex-col gap-1 p-1">
                              {allProfiles
                                .filter(
                                  (p) =>
                                    !members.some((m) => m.profile_id === p.id),
                                )
                                .map((p) => (
                                  <SelectItem
                                    key={p.id}
                                    value={p.email}
                                    className="w-full"
                                  >
                                    <div className="flex items-center gap-3 w-full py-1">
                                      <Avatar className="h-10 w-10 border border-slate-200 shrink-0">
                                        <AvatarImage src={p.avatar_url} />
                                        <AvatarFallback className="text-xs bg-blue-50">
                                          {p.full_name?.[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-bold truncate">
                                            {p.full_name}
                                          </span>
                                          <span
                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                                              p.role === "ADMIN"
                                                ? "bg-purple-50 text-purple-600 border-purple-100"
                                                : p.role === "MANAGER"
                                                  ? "bg-blue-50 text-blue-600 border-blue-100"
                                                  : p.role === "AGENT"
                                                    ? "bg-green-50 text-green-600 border-green-100"
                                                    : "bg-slate-50 text-slate-500 border-slate-100"
                                            }`}
                                          >
                                            {p.role}
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 truncate">
                                          {p.email}
                                        </span>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              {allProfiles.filter(
                                (p) =>
                                  !members.some((m) => m.profile_id === p.id),
                              ).length === 0 && (
                                <p className="p-2 text-center text-[10px] text-slate-400 italic">
                                  พนักงานทุกคนอยู่ในสาขานี้แล้ว
                                </p>
                              )}
                            </div>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2 py-1">
                        <div className="h-px bg-slate-100 flex-1" />
                        <span className="text-[10px] text-slate-300 uppercase font-bold tracking-widest">
                          หรือ
                        </span>
                        <div className="h-px bg-slate-100 flex-1" />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="email">ค้นหา หรือ ใส่อีเมลโดยตรง</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="email"
                            placeholder="พิมพ์เพื่อค้นหาชื่อ หรือใส่ example@email.com"
                            className="pl-10 text-sm"
                            value={searchQuery || newMember.email}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setNewMember({
                                ...newMember,
                                email: e.target.value,
                              });
                            }}
                            required
                          />
                        </div>

                        {/* Search Suggestions */}
                        {searchQuery && (
                          <div className="mt-1 border border-slate-100 rounded-lg max-h-[150px] overflow-y-auto bg-slate-50 shadow-inner">
                            {allProfiles
                              .filter(
                                (p) =>
                                  (p.full_name
                                    ?.toLowerCase()
                                    .includes(searchQuery.toLowerCase()) ||
                                    p.email
                                      ?.toLowerCase()
                                      .includes(searchQuery.toLowerCase())) &&
                                  !members.some((m) => m.profile_id === p.id),
                              )
                              .map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setNewMember({
                                      ...newMember,
                                      email: p.email,
                                    });
                                    setSearchQuery("");
                                  }}
                                  className="w-full flex items-center gap-3 p-2 hover:bg-white text-left transition-colors border-b border-slate-100 last:border-0"
                                >
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={p.avatar_url} />
                                    <AvatarFallback className="text-[10px] bg-blue-100">
                                      {p.full_name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-xs font-bold">
                                      {p.full_name}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                      {p.email}
                                    </p>
                                  </div>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="role">ตำแหน่งภายในสาขา</Label>
                        <Select
                          value={newMember.role}
                          onValueChange={(val) =>
                            setNewMember({ ...newMember, role: val })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกตำแหน่ง" />
                          </SelectTrigger>
                          <SelectContent className="z-200">
                            <SelectItem value="AGENT">
                              พนักงานขาย (AGENT)
                            </SelectItem>
                            <SelectItem value="MANAGER">
                              ผู้จัดการสาขา (MANAGER)
                            </SelectItem>
                            <SelectItem value="ADMIN">
                              ผู้ดูแลระบบ (ADMIN)
                            </SelectItem>
                            <SelectItem value="VIEWER">
                              ผู้เข้าชม (VIEWER)
                            </SelectItem>
                          </SelectContent>
                        </Select>
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
                      <Button type="submit" disabled={isAdding}>
                        {isAdding && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        ยืนยันการเพิ่ม
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={member.profiles?.avatar_url} />
                      <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">
                        {member.profiles?.full_name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {member.profiles?.full_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {member.profiles?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full">
                      {member.role === "OWNER" || member.role === "ADMIN" ? (
                        <ShieldCheck className="h-3 w-3 text-red-500" />
                      ) : (
                        <User className="h-3 w-3 text-blue-500" />
                      )}
                      <span className="text-[10px] font-bold uppercase text-slate-600">
                        {member.role}
                      </span>
                    </div>

                    {member.role !== "OWNER" && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                          title="ย้ายสาขา"
                          onClick={() => {
                            setTransferData({
                              profileId: member.profile_id,
                              role: member.role,
                              name: member.profiles?.full_name,
                            });
                            setTransferOpen(true);
                          }}
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleRemoveMember(member.profile_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {members.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <UserCircle className="h-12 w-12 mb-2 opacity-20" />
                  <p className="text-sm">ยังไม่มีสมาชิกในสาขานี้</p>
                </div>
              )}
            </div>

            {/* Invitations Table */}
            {invitations.length > 0 && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <h3 className="font-bold text-slate-800">
                    คำเชิญที่รอการตอบรับ ({invitations.length})
                  </h3>
                </div>
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                      <tr>
                        <th className="text-left py-3 px-4">อีเมล</th>
                        <th className="text-left py-3 px-4">ตำแหน่งที่เชิญ</th>
                        <th className="text-left py-3 px-4">วันที่เชิญ</th>
                        <th className="text-right py-3 px-4">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {invitations.map((inv) => (
                        <tr
                          key={inv.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium text-slate-700">
                            {inv.email}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={`${
                                inv.role === "ADMIN"
                                  ? "bg-red-50 text-red-700 border-red-100"
                                  : inv.role === "MANAGER"
                                    ? "bg-amber-50 text-amber-700 border-amber-100"
                                    : "bg-blue-50 text-blue-700 border-blue-100"
                              } border font-bold h-6`}
                            >
                              {inv.role}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {new Date(inv.created_at).toLocaleDateString(
                              "th-TH",
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg h-8 px-2"
                              onClick={() => handleCancelInvitation(inv.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              ยกเลิก
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transfer Member Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ย้ายสาขาพนักงาน</DialogTitle>
            <DialogDescription>
              พนักงานจะถูกย้ายจากสาขา <strong>{branch?.name}</strong>{" "}
              ไปยังสาขาที่คุณเลือก
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-2">
              <p className="text-xs text-slate-500 uppercase font-bold mb-2">
                พนักงานที่ต้องการย้าย
              </p>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-[10px] font-bold">
                    {transferData?.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold">{transferData?.name}</p>
                  <p className="text-[10px] text-slate-400">
                    สิทธิ์พนักงาน: {transferData?.role}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>เลือกสาขาปลายทาง</Label>
              <Select value={targetTenantId} onValueChange={setTargetTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสาขาปลายทาง..." />
                </SelectTrigger>
                <SelectContent className="z-200">
                  {branches
                    .filter((b) => b.id !== id)
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  {branches.filter((b) => b.id !== id).length === 0 && (
                    <p className="p-2 text-center text-xs text-slate-400">
                      ไม่พบสาขาอื่นในระบบ
                    </p>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!targetTenantId || isTransferring}
              onClick={handleTransferMember}
            >
              {isTransferring && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              ยืนยันการย้าย
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
