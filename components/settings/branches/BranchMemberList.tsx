"use client";

import { m, AnimatePresence } from "framer-motion";
import { Users2, Search, ArrowRightLeft, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TenantMember {
  id: string;
  profile_id: string;
  role: string | null;
  profiles: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

interface BranchMemberListProps {
  members: TenantMember[];
  onTransfer: (member: TenantMember) => void;
  onRemove: (member: TenantMember) => void;
}

export function BranchMemberList({
  members,
  onTransfer,
  onRemove,
}: BranchMemberListProps) {
  const [memberSearch, setMemberSearch] = useState("");

  const filteredMembers = members.filter(
    (m) =>
      m.profiles?.full_name
        ?.toLowerCase()
        .includes(memberSearch.toLowerCase()) ||
      m.profiles?.email?.toLowerCase().includes(memberSearch.toLowerCase()),
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
              className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white/40 border border-slate-100/50 rounded-[24px] hover:bg-white hover:shadow-xl hover:shadow-indigo-200/20 transition-all duration-300 gap-4"
            >
              <div className="flex items-center gap-5 italic">
                <div className="relative">
                  <Avatar className="h-14 w-14 border-2 border-white shadow-sm ring-1 ring-slate-100 group-hover:ring-indigo-200 transition-all">
                    <AvatarImage
                      src={member.profiles?.avatar_url || undefined}
                    />
                    <AvatarFallback className="bg-slate-50 text-slate-400 font-semibold">
                      {member.profiles?.full_name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                    <span className="animate-ping absolute h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-lg">
                    {member.profiles?.full_name}
                  </p>
                  <p className="text-xs text-slate-400 font-mono tracking-tight font-semibold">
                    {member.profiles?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
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
