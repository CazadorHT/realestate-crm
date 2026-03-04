"use client";

import { useState, useEffect, useTransition } from "react";
import { useTenant } from "@/components/providers/TenantProvider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Building2, Loader2, GitBranch, Users, Globe } from "lucide-react";
import {
  getSystemConfig,
  updateSystemConfig,
  SystemConfig,
} from "@/lib/actions/system-config";
import { cn } from "@/lib/utils";

export function AdminSystemSettings() {
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    multi_tenant_enabled: false,
    default_tenant_id: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { refresh: refreshTenant } = useTenant();

  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await getSystemConfig();
        setSystemConfig(config);
      } catch (error) {
        toast.error("ไม่สามารถโหลดการตั้งค่าระบบได้");
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      try {
        const newConfig = { ...systemConfig, multi_tenant_enabled: checked };
        await updateSystemConfig(newConfig);
        setSystemConfig(newConfig);
        toast.success(
          checked
            ? "✅ เปิดใช้งานระบบหลายสาขาแล้ว"
            : "ปิดใช้งานระบบหลายสาขาแล้ว",
        );
        await refreshTenant(); // อัปเดต nav bar ทันที
      } catch (error) {
        toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    });
  };

  const isEnabled = systemConfig.multi_tenant_enabled;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50 via-white to-violet-50 p-6 shadow-sm">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-violet-200/30 blur-2xl" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Left: icon + text */}
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-md transition-all duration-300",
              isEnabled
                ? "bg-indigo-600 shadow-indigo-300"
                : "bg-white shadow-slate-200",
            )}
          >
            <Building2
              className={cn(
                "h-7 w-7 transition-colors duration-300",
                isEnabled ? "text-white" : "text-indigo-400",
              )}
            />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">
                โครงสร้างองค์กร (Multi-Branch)
              </h2>
              <Badge
                className={cn(
                  "rounded-full border-transparent px-2.5 py-0.5 text-[10px] font-semibold uppercase transition-all",
                  isEnabled
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-slate-100 text-slate-500",
                )}
              >
                {isEnabled ? "Enterprise Mode" : "Single Office"}
              </Badge>
            </div>
            <p className="max-w-lg text-sm text-slate-500">
              เปิดใช้งานเพื่อจัดการหลายสาขาพร้อมกัน ระบบจะแสดงเมนู{" "}
              <strong className="text-slate-700">"สลับสาขา"</strong>{" "}
              บนแถบนำทางโดยอัตโนมัติ
            </p>

            {/* Feature chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { icon: GitBranch, label: "Multi-Branch" },
                { icon: Users, label: "Team Isolation" },
                { icon: Globe, label: "Branch Switcher" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-300",
                    isEnabled
                      ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                      : "bg-slate-50 text-slate-400 ring-1 ring-slate-200",
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: toggle */}
        <div
          className={cn(
            "flex shrink-0 flex-col items-center gap-2 rounded-2xl border px-6 py-4 transition-all duration-300",
            isEnabled
              ? "border-indigo-200 bg-indigo-600/5"
              : "border-slate-200 bg-white",
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {isEnabled ? "ระบบกำลังทำงาน" : "เปิดใช้งาน"}
          </p>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-xs font-bold transition-colors",
                !isEnabled ? "text-slate-600" : "text-slate-300",
              )}
            >
              OFF
            </span>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            ) : (
              <Switch
                checked={isEnabled}
                onCheckedChange={handleToggle}
                disabled={isPending}
                className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-slate-300"
              />
            )}
            <span
              className={cn(
                "text-xs font-bold transition-colors",
                isEnabled ? "text-indigo-600" : "text-slate-300",
              )}
            >
              ON
            </span>
          </div>
          {isPending && (
            <span className="text-[10px] text-indigo-400 animate-pulse">
              กำลังบันทึก…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
