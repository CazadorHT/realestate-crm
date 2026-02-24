"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateUserTeamAction } from "./actions/updateUserTeamAction";
import { Users, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const [isLoading, setIsLoading] = useState(false);

  const handleTeamChange = async (newTeamId: string) => {
    const teamIdValue = newTeamId === "none" ? null : newTeamId;

    if (teamIdValue === currentTeamId) return;

    setIsLoading(true);
    try {
      const result = await updateUserTeamAction(userId, teamIdValue);
      if (result.success) {
        toast.success("อัปเดตทีมเรียบร้อยแล้ว");
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

  return (
    <Select
      value={currentTeamId || "none"}
      onValueChange={handleTeamChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2 truncate">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500 shrink-0" />
          ) : (
            <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          )}
          <SelectValue placeholder="เลือกทีม" />
        </div>
      </SelectTrigger>
      <SelectContent className="rounded-xl border-slate-200">
        <SelectItem value="none">--- ไม่มีทีม ---</SelectItem>
        {teams.map((team) => (
          <SelectItem key={team.id} value={team.id}>
            {team.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
