"use client";

import { Mail, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TenantInvitation {
  id: string;
  email: string | null;
  role: string | null;
  status: string | null;
  created_at: string;
}

interface BranchInvitationListProps {
  invitations: TenantInvitation[];
  onCancel: (invite: TenantInvitation) => void;
}

export function BranchInvitationList({ invitations, onCancel }: BranchInvitationListProps) {
  if (invitations.length === 0) return null;

  return (
    <div className="mt-16 space-y-6 pt-10 border-t border-slate-100">
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center">
          <Mail className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 underline underline-offset-8 decoration-indigo-200 decoration-2">
            คำเชิญที่รอการตอบรับ
          </h3>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">
            Pending Invitations ({invitations.length})
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {invitations.map((inv) => {
          const isExpiring = new Date().getTime() - new Date(inv.created_at).getTime() > 1000 * 60 * 60 * 24 * 7;
          return (
            <div 
              key={inv.id} 
              className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl group transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-100"
            >
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 bg-white rounded-full flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform">
                  <Mail size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{inv.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-white border-slate-200 text-slate-500 font-bold text-[9px] h-5 shadow-none uppercase">{inv.role}</Badge>
                    <span className="text-[10px] text-slate-400">เชิญเมื่อ: {new Date(inv.created_at).toLocaleDateString("th-TH")}</span>
                    {isExpiring && (
                      <Badge className="bg-rose-50 text-rose-600 border-rose-100 font-bold text-[9px] h-5">Expiring Soon</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl px-4 h-10 transition-all"
                onClick={() => onCancel(inv)}
              >
                <Trash2 size={16} className="mr-2" />
                ยกเลิกคำเชิญ
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
