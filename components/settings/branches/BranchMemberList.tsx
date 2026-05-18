"use client";

import { m, AnimatePresence } from "framer-motion";
import { Users2, Search, ArrowRightLeft, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface BranchMemberV3 {
  id: string; // tenant_member_id
  identity_id: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "AGENT" | "VIEWER" | string;
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
}

interface BranchMemberListProps {
  members: BranchMemberV3[];
  onTransfer: (member: BranchMemberV3) => void;
  onRemove: (member: BranchMemberV3) => void;
}

export function BranchMemberList({
  members,
  onTransfer,
  onRemove,
}: BranchMemberListProps) {
  const [memberSearch, setMemberSearch] = useState("");

  const filteredMembers = members.filter(
    (m) =>
      m.identity?.display_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.identity?.full_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.identity?.nickname?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.identity?.email?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.identity?.phone?.toLowerCase().includes(memberSearch.toLowerCase()),
  );

  return (
    <div className="bg-white/50 backdrop-blur-md border border-slate-200/60 rounded-[32px] p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 italic">
        <div>
          <h3 className="text-2xl font-semibold text-slate-800 flex items-center gap-2.5">
            <Users2 size={24} className="text-indigo-600" />
            รายชื่อพนักงาน{" "}
            <span className="text-slate-400 font-normal hidden sm:block">(Branch Members)</span>
          </h3>
          <p className="text-[13px] text-slate-500 mt-1 font-medium">
            จัดการรายชื่อและสิทธิ์การเข้าถึงทรัพย์ในสาขานี้
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="ค้นหาพนักงาน (Search)..."
            className="pl-10 h-11 text-sm! font-normal rounded-2xl bg-white border-slate-200 focus-visible:ring-indigo-500 transition-all shadow-sm"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredMembers.map((member) => (
            <m.div
              layout
              key={member.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className={cn(
                "group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border rounded-[24px] transition-all duration-300 gap-4",
                member.identity?.is_active === false 
                  ? "bg-slate-50/50 border-slate-100 opacity-60 grayscale" 
                  : "bg-white/40 border-slate-100/50 hover:bg-white hover:shadow-xl hover:shadow-indigo-200/20"
              )}
            >
              <div className="flex items-center gap-5 italic">
                <div className="relative">
                  <Avatar className="h-14 w-14 border-2 border-white shadow-sm ring-1 ring-slate-100 group-hover:ring-indigo-200 transition-all">
                    <AvatarImage
                      src={member.identity?.avatar_url || undefined}
                    />
                    <AvatarFallback className="bg-slate-50 text-slate-400 font-semibold">
                      {(member.identity?.display_name || member.identity?.full_name)?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 h-5 w-5 border-2 border-white rounded-full flex items-center justify-center shadow-sm transition-colors",
                    member.identity?.is_active !== false ? "bg-emerald-500" : "bg-slate-300"
                  )}>
                    {member.identity?.is_active !== false && (
                      <span className="animate-ping absolute h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-lg">
                      {member.identity?.display_name || member.identity?.full_name}
                      {member.identity?.nickname && (
                        <span className="ml-2 text-sm text-slate-400 font-normal">
                          ({member.identity.nickname})
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-1 ml-2">
                      {member.identity?.line_id && (
                        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center" title="LINE Linked">
                          <span className="text-[8px] text-white font-bold">L</span>
                        </div>
                      )}
                      {member.identity?.whatsapp_user_id && (
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center" title="WhatsApp Linked">
                          <span className="text-[8px] text-white font-bold">W</span>
                        </div>
                      )}
                      {member.identity?.wechat_user_id && (
                        <div className="w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center" title="WeChat Linked">
                          <span className="text-[8px] text-white font-bold">C</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 font-mono tracking-tight font-semibold">
                    {member.identity?.email} {member.identity?.phone && `• ${member.identity.phone}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    className={cn(
                      "px-4 py-1.5 rounded-xl uppercase text-[10px] tracking-widest shadow-xs font-semibold border italic",
                      member.role === "OWNER" || member.role === "ADMIN"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                        : member.role === "MANAGER"
                          ? "bg-blue-50 text-blue-700 border-blue-100"
                          : "bg-slate-50 text-slate-600 border-slate-100",
                    )}
                  >
                    {member.role}
                  </Badge>
                  {member.identity?.is_active === false && (
                    <span className="text-[9px] text-rose-500 font-bold uppercase tracking-tighter">Deactivated</span>
                  )}
                </div>

                {member.role !== "OWNER" && (
                  <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 md:translate-x-2 group-hover:translate-x-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all shadow-sm border border-transparent hover:border-indigo-100"
                      title="ย้ายสาขา (Transfer)"
                      onClick={() => onTransfer(member)}
                    >
                      <ArrowRightLeft size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all shadow-sm border border-transparent hover:border-rose-100"
                      onClick={() => onRemove(member)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                )}
              </div>
            </m.div>
          ))}
        </AnimatePresence>

        {filteredMembers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200">
            <Users2 className="h-16 w-16 mb-4 opacity-10" />
            <p className="text-[13px] font-semibold italic px-4">
              ไม่พบรายชื่อพนักงานที่ระบุ (No members found)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
