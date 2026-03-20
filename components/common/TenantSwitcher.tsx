"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/components/providers/TenantProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { FaBuilding, FaUser } from "react-icons/fa";

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

  const [open, setOpen] = useState(false);

  // If multi-tenant is disabled, hide the switcher entirely
  if (!isMultiTenantEnabled) {
    return null;
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
    <>
      {/* Desktop Dropdown */}
      <div className="hidden lg:flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
             <Button
          className="h-10 min-w-[200px] justify-between border-slate-200 bg-white  hover:bg-slate-100 rounded-xl shadow-sm px-3"
        >
          <div className="flex items-center overflow-hidden gap-2">
            <FaUser className="h-4 w-4 shrink-0 text-blue-400" />
            <div className="flex flex-col items-start min-w-0 leading-tight">
              <span className="truncate text-xs font-medium text-slate-900">
                {activeTenant?.name || "เลือกสาขา"}
              </span>
              {activeTenant?.userRole && (
                <span className="text-[11px] font-normal text-blue-400 uppercase tracking-tighter">
                  {roleMapping[activeTenant.userRole]?.label ||
                    activeTenant.userRole}
                </span>
              )}
            </div>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
        </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[200px]" align="start">
            <DropdownMenuLabel className="text-xs text-slate-500">
              สาขาของฉัน
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {tenants.map((tenant) => {
              const roleInfo = tenant.userRole ? roleMapping[tenant.userRole] : null;
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
      </div>

      {/* Mobile Sheet */}
      <div className="flex items-center lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center p-0 overflow-hidden"
            >
              <Building2 className="h-5 w-5 text-slate-500" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[90vh] p-0 overflow-y-auto rounded-t-[2.5rem] border-t-0 shadow-2xl">
            <SheetHeader className="p-6 text-left border-b bg-slate-50/50">
              <SheetTitle className="text-lg font-bold">เลือกสาขา / แฟรนไชส์</SheetTitle>
              <p className="text-xs text-slate-500 mt-1">สลับไปยังสาขาที่คุณต้องการจัดการข้อมูล</p>
            </SheetHeader>

            <div className="p-4 space-y-2 pb-12 mb-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">สาขาทั้งหมด ({tenants.length})</p>
              <div className="grid gap-2">
                {tenants.map((tenant) => {
                  const roleInfo = tenant.userRole ? roleMapping[tenant.userRole] : null;
                  const isActive = activeTenant?.id === tenant.id;
                  return (
                    <button
                      key={tenant.id}
                      onClick={() => {
                        setTenantId(tenant.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between px-4 py-4 rounded-xl border text-left transition-all group",
                        isActive
                          ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                          : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                          isActive ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                        )}>
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold truncate">{tenant.name}</span>
                          {roleInfo && (
                            <span className="text-[10px] text-slate-400">ตำแหน่ง: {roleInfo.label}</span>
                          )}
                        </div>
                      </div>
                      {isActive && <Check className="h-5 w-5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 mt-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto py-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl"
                >
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <span className="text-lg font-bold">+</span>
                  </div>
                  <span className="text-sm font-medium">เพิ่มสาขาใหม่ / แฟรนไชส์</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
