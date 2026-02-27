"use client";

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
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings, Building2, ChevronRight } from "lucide-react";
import type { Profile } from "@/lib/supabase/getCurrentProfile";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useTenant } from "@/components/providers/TenantProvider";

interface UserNavProps {
  profile: Profile | null;
}

export function UserNav({ profile }: UserNavProps) {
  const router = useRouter();
  const supabase = createClient();
  const { tenants, activeTenant, setTenantId, isMultiTenantEnabled } =
    useTenant();

  const handleSignOut = async () => {
    // ออกจากระบบผ่าน Supabase Auth
    await supabase.auth.signOut();
    router.push("/auth/login"); // เด้งกลับไปหน้า Login
    router.refresh();
  };

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
    <DropdownMenu>
      {/* ปุ่ม Trigger รูป Avatar: กดแล้วจะเปิด Menu */}
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border border-border/50">
            <AvatarImage
              src={profile?.avatar_url || ""}
              alt={profile?.full_name || ""}
            />
            <AvatarFallback className="bg-primary/5 font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      {/* รายละเอียดใน Dropdown Menu */}
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile?.full_name || "ไม่ระบุชื่อ"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {profile?.email}
            </p>
            {profile?.role && (
              <span className="mt-1 inline-flex w-fit items-center rounded-sm bg-primary/10 px-1 py-0.5 text-[10px] font-medium text-primary uppercase">
                {profile.role}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href="/protected/profile">
              <User className="mr-2 h-4 w-4" />
              <span>โปรไฟล์</span>
            </Link>
          </DropdownMenuItem>

          {/* สลับสาขา */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className="cursor-pointer"
              disabled={tenants.length <= 1}
            >
              <Building2 className="mr-2 h-4 w-4" />
              <span>สลับสาขา</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                สาขาของคุณ
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {tenants.map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  className="cursor-pointer flex items-center justify-between"
                  onClick={() => setTenantId(t.id)}
                >
                  <span
                    className={
                      activeTenant?.id === t.id ? "font-bold text-primary" : ""
                    }
                  >
                    {t.name}
                  </span>
                  {activeTenant?.id === t.id && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href="/protected/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>ตั้งค่า</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
