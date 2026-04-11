"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateUserTeamAction } from "@/features/teams/actions/teamActions";
import { Users, Loader2, Search, Check, ChevronDown, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface UserTeamSelectProps {
  userId: string;
  currentTeamId: string | null;
  teams: { id: string; name: string }[];
  disabled?: boolean;
  className?: string;
}

export function UserTeamSelect({
  userId,
  currentTeamId,
  teams,
  disabled,
  className,
}: UserTeamSelectProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTeams = useMemo(() => {
    return teams.filter((team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teams, searchQuery]);

  const handleTeamChange = async (newTeamId: string) => {
    const teamIdValue = newTeamId === "none" ? null : newTeamId;

    if (teamIdValue === currentTeamId) {
      setOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateUserTeamAction(userId, teamIdValue);
      if (result.success) {
        toast.success("อัปเดตทีมเรียบร้อยแล้ว");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาดในการอัปเดตทีม");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการดําเนินการ");
    } finally {
      setIsLoading(false);
    }
  };

  const currentTeam = teams.find((t) => t.id === currentTeamId);

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="สังกัดทีม (Team Assignment)"
        description="เลือกทีมที่พนักงานคนนี้สังกัดอยู่ เพื่อจัดการสิทธิ์และรายงานผล"
        trigger={
          <Button
            variant="outline"
            disabled={disabled || isLoading}
            className={cn(
              "h-10 px-3 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm transition-all duration-300 flex items-center gap-2.5 group hover:border-slate-300",
              className
            )}
          >
            <div className={cn(
              "p-1 rounded-lg transition-transform group-hover:scale-110 bg-slate-100 text-slate-500",
              currentTeam && "bg-indigo-50 text-indigo-600"
            )}>
              <Users className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-slate-700 text-sm truncate max-w-[100px]">
              {currentTeam?.name || "ไม่มีทีม"}
            </span>
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            )}
          </Button>
        }
      >
        <div className="flex flex-col h-full max-h-[60vh]">
          {/* 🔍 Sticky Search Bar */}
          <div className="sticky top-0 z-30 p-4 bg-white/80 backdrop-blur-xl border-b border-slate-100 italic">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="ค้นหาชื่อทีม..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/5 transition-all text-sm font-semibold"
              />
            </div>
          </div>

          {/* 📋 Team Grid/List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {/* None Option */}
            <TeamItem
              id="none"
              name="--- ไม่มีทีมสังกัด ---"
              isActive={currentTeamId === null}
              onSelect={() => handleTeamChange("none")}
              disabled={isLoading}
              isSpecial
            />

            {filteredTeams.map((team) => (
              <TeamItem
                key={team.id}
                id={team.id}
                name={team.name}
                isActive={currentTeamId === team.id}
                onSelect={() => handleTeamChange(team.id)}
                disabled={isLoading}
              />
            ))}

            {filteredTeams.length === 0 && searchQuery && (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Search size={32} className="opacity-20" />
                <p className="text-sm font-semibold italic">ไม่พบทีมที่คุณค้นหา</p>
              </div>
            )}
          </div>
        </div>
      </ResponsiveDialog>
    </div>
  );
}

function TeamItem({ 
  id, 
  name, 
  isActive, 
  onSelect, 
  disabled,
  isSpecial 
}: { 
  id: string, 
  name: string, 
  isActive: boolean, 
  onSelect: () => void,
  disabled: boolean,
  isSpecial?: boolean
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 text-left",
        isActive
          ? "bg-indigo-50/50 border-indigo-200 text-indigo-700 shadow-xs"
          : isSpecial 
            ? "border-slate-100 bg-slate-50/50 text-slate-400 hover:bg-slate-100 italic"
            : "border-transparent bg-white hover:bg-slate-50 text-slate-700"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center bg-white border shadow-xs transition-colors",
          isActive ? "border-indigo-200 text-indigo-600" : "border-slate-100 text-slate-400"
        )}>
          {isSpecial ? <XCircle className="h-5 w-5" /> : <Users className="h-5 w-5" />}
        </div>
        <div>
          <p className={cn(
            "font-semibold text-sm tracking-tight",
            isActive ? "text-indigo-900" : "text-slate-800"
          )}>
            {name}
          </p>
          {!isSpecial && (
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
              Organization Squad
            </p>
          )}
        </div>
      </div>
      {isActive && (
        <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
          <Check className="h-3.5 w-3.5" />
        </div>
      )}
    </motion.button>
  );
}
