"use client";

import React, { useState, useEffect, use } from "react";
import {
  getTenantMembersAction,
  addTenantMemberAction,
  removeTenantMemberAction,
  transferTenantMemberAction,
  getTenantsAction,
  getAllProfilesAction,
  getTenantInvitationsAction,
  cancelTenantInvitationAction,
  getBranchStatsAction,
  updateTenantAction,
  createTenantInvitationAction,
} from "@/lib/actions/tenant-management";
import { Database } from "@/lib/database.types.generated";
import { toast } from "sonner";
import { useTenant } from "@/components/providers/TenantProvider";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { Button } from "@/components/ui/button";
import { UserPlus, Settings2 } from "lucide-react";

// 🧩 Elite Components
import { BranchStatsDashboard } from "@/components/settings/branches/BranchStatsDashboard";
import { BranchInfoSidebar } from "@/components/settings/branches/BranchInfoSidebar";
import { BranchMemberList } from "@/components/settings/branches/BranchMemberList";
import { BranchInvitationList } from "@/components/settings/branches/BranchInvitationList";
import { AddMemberDialog } from "@/components/settings/branches/AddMemberDialog";
import { TransferMemberDialog } from "@/components/settings/branches/TransferMemberDialog";
import { EditBranchDialog } from "@/components/settings/branches/EditBranchDialog";
import { DeleteConfirmationDialog } from "@/components/settings/branches/DeleteConfirmationDialog";

/**
 * 🦴 Elite Split-Skeleton
 */
function BranchDetailSkeleton() {
  return (
    <div className="space-y-8 animate-pulse p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-[32px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 h-[400px] bg-white/50 border border-slate-200 rounded-[32px]" />
        <div className="lg:col-span-2 h-[600px] bg-white/50 border border-slate-200 rounded-[32px]" />
      </div>
    </div>
  );
}

// 🏷️ Types
type TenantBranch = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string | null;
  memberCount: number;
};

// V3 Identity Engine
type IdentityV3 = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
};

type TenantMember = {
  id: string; // tenant_member_id
  identity_id: string;
  role: string;
  joined_at: string | null;
  identity: {
    id: string;
    display_name: string | null;
    full_name: string | null;
    nickname: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    is_active: boolean | null;
    line_id?: string | null;
    whatsapp_user_id?: string | null;
    wechat_user_id?: string | null;
  } | null;
};

type TenantInvitation = {
  id: string;
  email: string | null;
  role: string | null;
  status: string | null;
  created_at: string;
  expires_at?: string;
  invited_by?: string | null;
  tenant_id?: string;
  token?: string | null;
};
type BranchRole = "OWNER" | "ADMIN" | "MANAGER" | "AGENT" | "VIEWER";

export default function BranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { refresh: refreshTenants } = useTenant();

  // --- States ---
  const [branch, setBranch] = useState<TenantBranch | null>(null);
  const [branches, setBranches] = useState<TenantBranch[]>([]);
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [invitations, setInvitations] = useState<TenantInvitation[]>([]);
  const [allProfiles, setAllProfiles] = useState<IdentityV3[]>([]);
  const [stats, setStats] = useState({ memberCount: 0, inviteCount: 0, propertyCount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // --- Dialog States ---
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferMember, setTransferMember] = useState<{
    profileId: string;
    name: string;
    role: string;
    avatarUrl?: string | null;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ 
    open: boolean; 
    type: "MEMBER" | "INVITE"; 
    data: TenantMember | TenantInvitation | null 
  }>({
    open: false,
    type: "MEMBER",
    data: null,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bRes, sRes, mRes, pRes, iRes] = await Promise.all([
        getTenantsAction(),
        getBranchStatsAction(id),
        getTenantMembersAction(id),
        getAllProfilesAction(),
        getTenantInvitationsAction(id)
      ]);

      if (bRes.data) {
        const current = bRes.data.find((t) => t.id === id);
        setBranch(current || null);
        setBranches(bRes.data.filter(b => b.id !== id));
      }
      if (sRes.data) setStats(sRes.data);
      if (mRes.data) setMembers(mRes.data as unknown as TenantMember[]);
      if (pRes.data) setAllProfiles(pRes.data as unknown as IdentityV3[]);
      if (iRes.data) setInvitations(iRes.data as unknown as TenantInvitation[]);
      
    } catch (err) {
      toast.error("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // --- Handlers ---
  const handleUpdateBranch = async (data: { name: string; slug: string }) => {
    const res = await updateTenantAction(id, data);
    if (res.data) {
      toast.success("อัปเดตข้อมูลสาขาสำเร็จ");
      setEditOpen(false);
      fetchData();
    } else {
      toast.error(res.error || "ไม่สามารถอัปเดตข้อมูลได้");
    }
  };

  const handleAddMember = async (data: { email: string; role: string }, isExisting: boolean) => {
    let res;
    
    if (isExisting) {
      // 1. Add existing user directly
      res = await addTenantMemberAction({
        tenantId: id,
        email: data.email,
        role: data.role as BranchRole,
      });
    } else {
      // 2. Create invitation for new user
      res = await createTenantInvitationAction({
        tenantId: id,
        email: data.email,
        role: data.role as "ADMIN" | "MANAGER" | "AGENT" | "VIEWER",
      });
    }

    if (res.success) {
      toast.success(isExisting ? "เพิ่มสมาชิกเรียบร้อย" : "ส่งคำเชิญเรียบร้อย (พนักงานยังไม่มีบัญชี)");
      setAddOpen(false);
      fetchData();
      refreshTenants();
    } else {
      toast.error(res.error || "ไม่สามารถดำเนินการได้");
    }
  };

  const handleTransferMember = async (targetTenantId: string) => {
    if (!transferMember) return;
    const res = await transferTenantMemberAction({
      profileId: transferMember.profileId,
      fromTenantId: id,
      toTenantId: targetTenantId,
      role: transferMember.role as BranchRole,
    });
    if (res.success) {
      toast.success("ย้ายสาขาเรียบร้อย");
      setTransferOpen(false);
      fetchData();
      refreshTenants();
    } else {
      toast.error(res.error || "ไม่สามารถย้ายสาขาได้");
    }
  };

  const handleConfirmDelete = async () => {
    const { type, data } = deleteConfirm;
    if (!data) return;

    if (type === "MEMBER") {
      const member = data as TenantMember;
      const res = await removeTenantMemberAction(id, member.identity_id);
      if (res.success) {
        toast.success("ลบสมาชิกเรียบร้อย");
        fetchData();
        refreshTenants();
      } else toast.error(res.error || "ล้มเหลว");
    } else {
      const invite = data as TenantInvitation;
      const res = await cancelTenantInvitationAction(invite.id);
      if (res.success) {
        toast.success("ยกเลิกคำเชิญเรียบร้อย");
        fetchData();
      } else toast.error(res.error || "ล้มเหลว");
    }
    setDeleteConfirm({ ...deleteConfirm, open: false });
  };

  return (
    <div className="min-h-screen bg-slate-50/30">
      <SettingsHeader
        title={branch?.name || "กำลังโหลด..."}
        description="บริหารจัดการสมาชิกและสิทธิ์การเข้าถึงข้อมูลรายสาขา"
        subPath={[
          { label: "System Control", href: "/protected/settings" },
          { label: "จัดการสาขา", href: "/protected/settings/branches" },
          { label: branch?.name || "..." }
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              className="bg-white/50! backdrop-blur-sm border-slate-200 rounded-xl h-11 px-4 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all font-semibold"
              onClick={() => setEditOpen(true)}
            >
              <Settings2 className="mr-2 h-4 w-4" />
              ตั้งค่าสาขา
            </Button>
            <Button 
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 px-6 shadow-lg shadow-slate-200 transition-all active:scale-95 font-bold"
              onClick={() => setAddOpen(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              เพิ่มพนักงาน
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <BranchDetailSkeleton />
      ) : (
        <div className="pt-4 space-y-10">
          <BranchStatsDashboard 
            memberCount={stats.memberCount} 
            inviteCount={stats.inviteCount} 
            propertyCount={stats.propertyCount} 
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            <div className="lg:col-span-1">
              <BranchInfoSidebar 
                branch={branch ? {
                  name: branch.name,
                  slug: branch.slug,
                  created_at: branch.created_at || new Date().toISOString()
                } : null} 
                onEdit={() => setEditOpen(true)} 
              />
            </div>

            <div className="lg:col-span-2 space-y-10">
              <BranchMemberList 
                members={members} 
                onTransfer={(m) => {
                  setTransferMember({ 
                    profileId: m.identity_id, 
                    role: m.role || "AGENT", 
                    name: m.identity?.display_name || m.identity?.full_name || "ไม่ระบุชื่อ", 
                    avatarUrl: m.identity?.avatar_url
                  });
                  setTransferOpen(true);
                }}
                onRemove={(m) => setDeleteConfirm({ open: true, type: "MEMBER", data: m })}
              />
              
              <BranchInvitationList 
                invitations={invitations} 
                onCancel={(inv) => setDeleteConfirm({ open: true, type: "INVITE", data: inv })}
              />
            </div>
          </div>
        </div>
      )}

      {/* --- Modals --- */}
      <AddMemberDialog 
        open={addOpen} 
        onOpenChange={setAddOpen} 
        allProfiles={allProfiles} 
        currentMembers={members.map(m => ({ identity_id: m.identity_id }))}
        branchName={branch?.name || ""}
        onAdd={handleAddMember}
      />

      {branch && (
        <EditBranchDialog 
          open={editOpen} 
          onOpenChange={setEditOpen} 
          branch={branch} 
          onUpdate={handleUpdateBranch} 
        />
      )}

      <TransferMemberDialog 
        open={transferOpen} 
        onOpenChange={setTransferOpen}
        member={transferMember}
        branches={branches}
        currentBranchName={branch?.name || ""}
        onTransfer={handleTransferMember}
      />

      <DeleteConfirmationDialog 
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        title={deleteConfirm.type === "MEMBER" ? "ลบพนักงานออกจากสาขา" : "ยกเลิกคำเชิญพนักงาน"}
        description={
            deleteConfirm.type === "MEMBER" 
            ? `คุณแน่ใจหรือไม่ว่าต้องการลบ ${(deleteConfirm.data as TenantMember)?.identity?.display_name || (deleteConfirm.data as TenantMember)?.identity?.full_name} ออกจากสาขานี้?` 
            : `คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำเชิญของ ${(deleteConfirm.data as TenantInvitation)?.email}?`
        }
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
