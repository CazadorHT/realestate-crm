"use client";

import React from "react";
import { useTenant } from "@/components/providers/TenantProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Check,
  ChevronDown,
  ShieldCheck,
  ShieldAlert,
  User,
  Shield,
} from "lucide-react";
import { FaBuilding } from "react-icons/fa";

const roleMapping: Record<string, { label: string; color: string; icon: any }> =
  {
    OWNER: {
      label: "เจ้าของ",
      color: "text-purple-600 bg-purple-50 border-purple-100",
      icon: ShieldCheck,
    },
    ADMIN: {
      label: "แอดมิน",
      color: "text-blue-600 bg-blue-50 border-blue-100",
      icon: ShieldAlert,
    },
    MANAGER: {
      label: "ผู้จัดการ",
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
      icon: Shield,
    },
    AGENT: {
      label: "พนักงานขาย",
      color: "text-green-600 bg-green-50 border-green-100",
      icon: User,
    },
    VIEWER: {
      label: "ผู้เข้าชม",
      color: "text-slate-500 bg-slate-50 border-slate-100",
      icon: User,
    },
  };

export function TenantSwitcher() {
  const {
    activeTenant,
    tenants,
    setTenantId,
    isLoading,
    isMultiTenantEnabled,
  } = useTenant();

  // If multi-tenant is disabled, show a static branch indicator
  if (!isMultiTenantEnabled) {
    const roleInfo = activeTenant?.userRole
      ? roleMapping[activeTenant.userRole]
      : null;

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm">
        <FaBuilding className="h-4 w-4 text-slate-400" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-700 truncate max-w-[150px]">
            {activeTenant?.name || "ยังไม่ได้ตั้งชื่อสาขา"}
          </span>
        </div>
          {roleInfo && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${roleInfo.color}`}
            >
              {roleInfo.label}
            </span>
          )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <Button variant="outline" className="w-[200px] justify-start" disabled>
        <Building2 className="mr-2 h-4 w-4 animate-pulse" />
        <span className="truncate">กำลังโหลด...</span>
      </Button>
    );
  }

  if (tenants.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-10 min-w-[200px] justify-between border-slate-200 bg-white hover:bg-slate-50 rounded-xl shadow-sm px-3"
        >
          <div className="flex items-center overflow-hidden gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
            <div className="flex flex-col items-start min-w-0 leading-tight">
              <span className="truncate text-xs font-bold text-slate-900">
                {activeTenant?.name || "เลือกสาขา"}
              </span>
              {activeTenant?.userRole && (
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                  {roleMapping[activeTenant.userRole]?.label ||
                    activeTenant.userRole}
                </span>
              )}
            </div>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-30" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]" align="start">
        <DropdownMenuLabel className="text-xs text-slate-500">
          สาขาของฉัน
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((tenant) => {
          const roleInfo = tenant.userRole
            ? roleMapping[tenant.userRole]
            : null;
          return (
            <DropdownMenuItem
              key={tenant.id}
              onClick={() => setTenantId(tenant.id)}
              className="flex items-center justify-between py-2 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate max-w-[140px]">
                    {tenant.name}
                  </span>
                  {roleInfo && (
                    <span className="text-[10px] text-slate-400">
                      ตำแหน่ง: {roleInfo.label}
                    </span>
                  )}
                </div>
              </div>
              {activeTenant?.id === tenant.id && (
                <Check className="h-4 w-4 text-green-500 shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-xs text-blue-600 hover:text-blue-700">
          + เพิ่มสาขาใหม่ / แฟรนไชส์
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
