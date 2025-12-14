"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { updateUserRoleAction } from "./actions/updateUserRoleAction";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UserRoleSelectProps {
  userId: string;
  currentRole: "ADMIN" | "AGENT";
  disabled?: boolean;
}

export function UserRoleSelect({ userId, currentRole, disabled }: UserRoleSelectProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"ADMIN" | "AGENT">(currentRole);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = async (newRole: "ADMIN" | "AGENT") => {
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
        onValueChange={(value) => handleRoleChange(value as "ADMIN" | "AGENT")}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ADMIN">ADMIN</SelectItem>
          <SelectItem value="AGENT">AGENT</SelectItem>
        </SelectContent>
      </Select>
      
      {isLoading && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
