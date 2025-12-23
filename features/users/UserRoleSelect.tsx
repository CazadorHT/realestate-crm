"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { updateUserRoleAction } from "./actions/updateUserRoleAction";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { type UserRole } from "@/lib/auth-shared";

interface UserRoleSelectProps {
  userId: string;
  currentRole: UserRole;
  disabled?: boolean;
}

export function UserRoleSelect({
  userId,
  currentRole,
  disabled,
}: UserRoleSelectProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = async (newRole: UserRole) => {
    if (newRole === currentRole) return;

    setSelectedRole(newRole);
    setIsLoading(true);

    try {
      const result = await updateUserRoleAction(userId, newRole);

      if (result.success) {
        toast.success("อัปเดตบทบาทสำเร็จ");
        router.refresh();
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาดในการอัปเดตบทบาท");
        setSelectedRole(currentRole); // Revert on error
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดตบทบาท");
      setSelectedRole(currentRole); // Revert on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedRole}
        onValueChange={(value) => handleRoleChange(value as UserRole)}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ADMIN">ADMIN</SelectItem>
          <SelectItem value="AGENT">AGENT</SelectItem>
          <SelectItem value="USER">USER</SelectItem>
        </SelectContent>
      </Select>

      {isLoading && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
