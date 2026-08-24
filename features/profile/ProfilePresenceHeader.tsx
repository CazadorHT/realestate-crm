"use client";

import { LayoutDashboard, Zap, Trophy, ShieldCheck, Fingerprint } from "lucide-react";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileCompleteness } from "./ProfileCompleteness";
import { ROLE_LABELS } from "@/lib/auth-shared";
import { useLanguage } from "@/components/providers/LanguageProvider";

const ROLE_LABELS_EN: Record<string, string> = {
  ADMIN: "System Admin",
  OWNER: "Branch Owner",
  owner: "Branch Owner",
  MANAGER: "Manager",
  AGENT: "Sales Agent",
  USER: "Standard User",
};

interface ProfileHeaderBannerProps {
  fullName: string | null;
  score: number;
}

export function ProfileHeaderBanner({ fullName, score }: ProfileHeaderBannerProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/40 backdrop-blur-xl border border-white/40 p-8 rounded-3xl shadow-xl shadow-slate-200/50">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div className="h-10 w-[2px] bg-slate-200 rounded-full mx-1" />
          <div className="space-y-0.5">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">
              MY PROFILE
            </h1>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] pl-0.5">
              Workspace Identity
            </p>
          </div>
        </div>
        <p className="text-slate-500 font-medium max-w-md leading-relaxed">
          {isEn ? (
            <>
              Welcome, <span className="text-slate-900 font-bold underline underline-offset-4 decoration-blue-500/30">{fullName || "Agent"}</span>. Manage your workspace identity, security, and notification settings here.
            </>
          ) : (
            <>
              ยินดีต้อนรับคุณ <span className="text-slate-900 font-bold underline underline-offset-4 decoration-blue-500/30">{fullName || "Agent"}</span> จัดการข้อมูลตัวตน ความปลอดภัย และการแจ้งเตือนสิทธิ์การใช้งานของคุณได้ที่นี่
            </>
          )}
        </p>
      </div>

      {/* Completeness Gimmick */}
      <ProfileCompleteness score={score} />
    </div>
  );
}

interface ProfileIdentityCardProps {
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string | null;
  };
}

export function ProfileIdentityCard({ profile }: ProfileIdentityCardProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const roleDisplay = profile.role
    ? (isEn ? (ROLE_LABELS_EN[profile.role] || profile.role) : (ROLE_LABELS[profile.role] || profile.role))
    : (isEn ? "User" : "ผู้ใช้งาน");

  return (
    <div className="relative group rounded-3xl overflow-hidden bg-white/70 backdrop-blur-md border border-white/40 shadow-2xl shadow-slate-200/50">
      <div className="h-32 bg-linear-to-br from-blue-400 via-indigo-400 to-indigo-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Zap className="h-24 w-24 text-white" />
        </div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
      </div>
      
      <div className="px-6 pb-8 text-center relative">
        <div className="-mt-20 mb-6 inline-block">
          <ProfileAvatar
            avatarUrl={profile.avatar_url}
            fullName={profile.full_name}
          />
        </div>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-wider">
              {profile.full_name || (isEn ? "Unnamed Agent" : "ไม่ระบุชื่อ")}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">
                Verified {roleDisplay}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100/50 flex items-center gap-3 transition-all hover:bg-blue-50">
              <div className="shrink-0 p-2 rounded-xl bg-blue-100 text-blue-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                <p className="text-[11px] font-black text-blue-600 uppercase truncate">Verified</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 flex items-center gap-3 transition-all hover:bg-indigo-50">
              <div className="shrink-0 p-2 rounded-xl bg-indigo-100 text-indigo-600">
                <Fingerprint className="h-4 w-4" />
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Access</p>
                <p className="text-[11px] font-black text-indigo-600 uppercase truncate">
                  {roleDisplay}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
