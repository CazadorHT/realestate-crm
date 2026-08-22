"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings, Building2, ChevronRight } from "lucide-react";
import type { Profile } from "@/lib/supabase/getCurrentProfile";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useTenant } from "@/components/providers/TenantProvider";
import { ROLE_LABELS } from "@/lib/auth-shared";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface UserNavProps {
  profile: Profile | null;
}

export function UserNav({ profile }: UserNavProps) {
  const router = useRouter();
  const supabase = createClient();
  const { language } = useLanguage();
  const isEn = language === "en";

  const { tenants, activeTenant, setTenantId, isMultiTenantEnabled } =
    useTenant();

  const handleSignOut = async () => {
    // ออกจากระบบผ่าน Supabase Auth
    await supabase.auth.signOut();
    router.push("/auth/login"); // เด้งกลับไปหน้า Login
    router.refresh();
  };

  const [open, setOpen] = useState(false);

  // สร้างตัวย่อจากชื่อ (เช่น "Somchai Jaiudee" -> "SJ") กรณีไม่มีรูป Avatar
  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <div className="flex items-center gap-2">
      {/* Desktop Dropdown */}
      <div className="hidden lg:flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full border border-slate-200 bg-white shadow-2xs hover:bg-slate-50 transition-all flex items-center justify-center p-0 overflow-hidden"
            >
              <Avatar className="h-full w-full border-none">
                <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || ""} />
                <AvatarFallback className="bg-primary/5 font-bold text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none truncate">
                  {profile?.full_name || (isEn ? "User" : "ผู้ใช้งาน")}
                </p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {profile?.email}
                </p>
                {profile?.role && (
                  <span className="inline-flex w-fit items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    {profile.role ? (ROLE_LABELS[profile.role] || profile.role) : ""}
                  </span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/protected/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>{isEn ? "Profile" : "โปรไฟล์"}</span>
                </Link>
              </DropdownMenuItem>

              {isMultiTenantEnabled && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer">
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>{isEn ? "Switch Branch" : "สลับสาขา"}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    {tenants.map((t) => {
                      const isActive = activeTenant?.id === t.id;
                      return (
                        <DropdownMenuItem
                          key={t.id}
                          disabled={isActive}
                          className="flex items-center justify-between"
                          onClick={() => !isActive && setTenantId(t.id)}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "text-slate-400"}`} />
                            <span className={isActive ? "font-medium text-primary" : ""}>
                              {t.name}
                            </span>
                          </div>
                          {isActive && (
                            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                              {isEn ? "Active" : "ปัจจุบัน"}
                            </span>
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}

              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/protected/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{isEn ? "Settings" : "ตั้งค่า"}</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isEn ? "Sign Out" : "ออกจากระบบ"}</span>
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
              <Avatar className="h-full w-full border-none">
                <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || ""} />
                <AvatarFallback className="bg-primary/5 font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[90vh] p-0 overflow-y-auto rounded-t-[2.5rem] border-t-0 shadow-2xl">
            <SheetHeader className="p-6 text-left border-b border-slate-200 bg-slate-50/50">
              <SheetTitle className="text-lg font-bold">{isEn ? "User Profile" : "ข้อมูลผู้ใช้งาน"}</SheetTitle>
              <SheetDescription className="sr-only">
                {isEn ? "Account settings and management" : "เมนูจัดการข้อมูลส่วนตัวและตั้งค่าบัญชีสำหรับผู้ใช้งาน"}
              </SheetDescription>
              <div className="flex items-center gap-4 mt-4">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || ""} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-bold truncate text-slate-900">{profile?.full_name || (isEn ? "Anonymous" : "ไม่ระบุชื่อ")}</p>
                  <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
                  {profile?.role && (
                    <span className="mt-1 inline-flex w-fit items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 uppercase border border-blue-100">
                      {profile.role ? (ROLE_LABELS[profile.role] || profile.role) : ""}
                    </span>
                  )}
                </div>
              </div>
            </SheetHeader>

            <div className="p-4 space-y-6 pb-12 mb-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">{isEn ? "My Account" : "บัญชีของฉัน"}</p>
                <Link
                  href="/protected/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <User className="h-5 w-5 text-slate-400" />
                  {isEn ? "Profile" : "โปรไฟล์"}
                </Link>
                <Link
                  href="/protected/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <Settings className="h-5 w-5 text-slate-400" />
                  {isEn ? "Settings" : "ตั้งค่า"}
                </Link>
              </div>

              {isMultiTenantEnabled && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">{isEn ? "Switch Branch" : "สลับสาขา"}</p>
                  <div className="grid gap-2">
                    {tenants.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTenantId(t.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between px-3 py-3 rounded-xl border text-left transition-all",
                          activeTenant?.id === t.id
                            ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                            : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Building2 className={cn("h-4 w-4 shrink-0", activeTenant?.id === t.id ? "text-blue-600" : "text-slate-400")} />
                          <span className="text-sm font-medium truncate">{t.name}</span>
                        </div>
                        {activeTenant?.id === t.id && <ChevronRight className="h-4 w-4 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200">
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-start gap-3 px-3 py-6 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  {isEn ? "Sign Out" : "ออกจากระบบ"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
