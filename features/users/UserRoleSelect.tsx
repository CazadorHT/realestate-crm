"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ShieldHalf,
  Sparkles,
  Activity,
  User,
  Check,
  ChevronDown,
  Crown,
} from "lucide-react";
import { updateUserRoleAction } from "./actions/updateUserRoleAction";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { type UserRole } from "@/lib/auth-shared";
import { cn } from "@/lib/utils";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { m } from "framer-motion";
import { useLanguage } from "@/lib/i18n/language-context";

interface UserRoleSelectProps {
  userId: string;
  currentRole: UserRole;
  disabled?: boolean;
  className?: string;
}

export function UserRoleSelect({
  userId,
  currentRole,
  disabled,
  className,
}: UserRoleSelectProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    {
      id: "OWNER",
      label: "OWNER",
      icon: Crown,
      color: "bg-indigo-500",
      lightColor: "bg-indigo-50",
      textColor: "text-indigo-600",
      description: isEn ? "Branch Owner with full administrative rights" : "เจ้าของสาขา มีสิทธิ์สูงสุดในสาขา",
    },
    {
      id: "ADMIN",
      label: "ADMIN",
      icon: ShieldHalf,
      color: "bg-rose-500",
      lightColor: "bg-rose-50",
      textColor: "text-rose-600",
      description: isEn ? "Full system control & configuration" : "ควบคุมทุกอย่างในระบบ",
    },
    {
      id: "MANAGER",
      label: "MANAGER",
      icon: Sparkles,
      color: "bg-amber-500",
      lightColor: "bg-amber-50",
      textColor: "text-amber-600",
      description: isEn ? "Branch supervision & agent management" : "ดูแลสาขาและพนักงาน",
    },
    {
      id: "AGENT",
      label: "AGENT",
      icon: Activity,
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
      description: isEn ? "Property listings & lead workflows" : "จัดการทรัพย์และลีด",
    },
    {
      id: "USER",
      label: "USER",
      icon: User,
      color: "bg-slate-500",
      lightColor: "bg-slate-50",
      textColor: "text-slate-600",
      description: isEn ? "Standard member (Waiting role assignment)" : "สมาชิกทั่วไป",
    },
  ];

  const handleRoleChange = async (newRole: UserRole) => {
    if (newRole === currentRole) {
      setOpen(false);
      return;
    }

    setSelectedRole(newRole);
    setIsLoading(true);

    try {
      const result = await updateUserRoleAction(userId, newRole);

      if (result.success) {
        toast.success(isEn ? "Role updated successfully" : "อัปเดตบทบาทสำเร็จ");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message || (isEn ? "Failed to update role" : "เกิดข้อผิดพลาดในการอัปเดตบทบาท"));
        setSelectedRole(currentRole);
      }
    } catch {
      toast.error(isEn ? "Failed to update role" : "เกิดข้อผิดพลาดในการอัปเดตบทบาท");
      setSelectedRole(currentRole);
    } finally {
      setIsLoading(false);
    }
  };

  const normalizedSelectedRole = (selectedRole?.toUpperCase() as UserRole) || "USER";
  const currentRoleData = roles.find((r) => r.id === normalizedSelectedRole) || roles[4];

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={isEn ? "Change User Role" : "เปลี่ยนบทบาทผู้ใช้ (Change Role)"}
        description={isEn ? "Select a new role to change system access permissions" : "เลือกบทบาทใหม่เพื่อเปลี่ยนสิทธิ์การเข้าถึงระบบ"}
        trigger={
          <Button
            variant="outline"
            disabled={disabled || isLoading}
            className={cn(
              "h-10 px-3 rounded-xl border-slate-200 bg-white/50! backdrop-blur-sm transition-all duration-300 flex items-center gap-2.5 group hover:border-slate-300",
              className,
            )}
          >
            <div
              className={cn(
                "p-1 rounded-lg transition-transform group-hover:scale-110",
                currentRoleData.lightColor,
                currentRoleData.textColor,
              )}
            >
              <currentRoleData.icon className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-700 text-sm">
              {selectedRole}
            </span>
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            )}
          </Button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 md:p-6">
          {roles.map((role) => {
            const isActive = normalizedSelectedRole === role.id;
            const Icon = role.icon;
            return (
              <m.button
                key={role.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleRoleChange(role.id as UserRole)}
                disabled={isLoading}
                className={cn(
                  "relative flex items-center gap-4 p-4 rounded-3xl border border-slate-200 text-left transition-all duration-300",
                  isActive
                    ? `bg-white border border-slate-200 shadow-xl shadow-slate-200`
                    : "bg-slate-50/50 border-transparent hover:bg-white hover:border-slate-200",
                )}
              >
                {/* 🎨 Icon Container */}
                <div
                  className={cn(
                    "h-12 w-12 shrink-0 rounded-2xl shadow-sm flex items-center justify-center",
                    role.color,
                    "text-white",
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>

                {/* 📝 Label & Description */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-semibold text-base mb-0.5 tracking-tight truncate",
                      isActive ? "text-slate-950" : "text-slate-800",
                    )}
                  >
                    {role.label}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500 italic truncate">
                    {role.description}
                  </p>
                </div>

                {/* ✅ Checkbox Indicator */}
                <div className="shrink-0 ml-auto">
                  {isActive ? (
                    <div className="h-6 w-6 rounded-full bg-slate-900 flex items-center justify-center text-white">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-slate-200 bg-white/50" />
                  )}
                </div>

                {isActive && (
                  <m.div
                    layoutId="active-indicator"
                    className="absolute -inset-px border border-slate-200 rounded-3xl pointer-events-none"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </m.button>
            );
          })}
        </div>
      </ResponsiveDialog>
    </div>
  );
}

