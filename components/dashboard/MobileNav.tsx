"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCircle,
  User,
  BarChart3,
  FileText,
  Shield,
  MapPin,
  FolderOpen,
  CircleHelp,
  Cpu,
  Globe,
  LayoutTemplate,
  ChevronDown,
  ChevronRight,
  Briefcase,
  FileStack,
  Settings,
  Menu,
  Box,
  History,
  CalendarDays,
  MessageSquare,
  Activity,
  Layout,
  Sparkles,
  Handshake,
  Bell,
  Wallet,
  BadgeDollarSign,
} from "lucide-react";
import { isStaff, isAdmin, type UserRole } from "@/lib/auth-shared";
import { cn } from "@/lib/utils";
import { 
  AnimatePresence, 
  motion 
} from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { siteConfig } from "@/lib/site-config";
import { TenantSwitcher } from "@/components/common/TenantSwitcher";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/supabase/getCurrentProfile";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { RiTeamLine } from "react-icons/ri";

export function MobileNav({ role, profile }: { role: UserRole, profile: Profile | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(["crm"]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  interface NavItem {
    title: string;
    href: string;
    icon: any;
    active: boolean;
    roles?: UserRole[];
  }

  interface NavGroup {
    id: string;
    title: string;
    icon: any;
    items: NavItem[];
    roles?: UserRole[];
  }

  // Same configuration as SidebarNav
  const crmItems: NavItem[] = [
    {
      title: "ทรัพย์สิน",
      href: "/protected/properties",
      icon: Building2,
      active: pathname?.startsWith("/protected/properties") ?? false,
    },
    {
      title: "เจ้าของทรัพย์",
      href: "/protected/owners",
      icon: User,
      active: pathname?.startsWith("/protected/owners") ?? false,
    },
    {
      title: "ลีด",
      href: "/protected/leads",
      icon: Users,
      active: pathname?.startsWith("/protected/leads") ?? false,
    },
    {
      title: "เครือข่ายคู่ค้า",
      href: "/protected/co-brokers",
      icon: RiTeamLine,
      active: pathname?.startsWith("/protected/co-brokers") ?? false,
    },
    {
      title: "กล่องข้อความ",
      href: "/protected/inbox",
      icon: MessageSquare,
      active: pathname === "/protected/inbox",
    },
    {
      title: "ดีล",
      href: "/protected/deals",
      icon: Handshake,
      active: pathname?.startsWith("/protected/deals") ?? false,
    },
    {
      title: "ปฏิทิน",
      href: "/protected/calendar",
      icon: CalendarDays,
      active: pathname?.startsWith("/protected/calendar") ?? false,
    },
    {
      title: "ข้อมูลวิเคราะห์",
      href: "/protected/admin/analytics",
      icon: BarChart3,
      active: pathname?.startsWith("/protected/admin/analytics") ?? false,
      roles: ["ADMIN"],
    },
    {
      title: "แจ้งเตือนค่าเช่า",
      href: "/protected/rent-notifications",
      icon: Bell,
      active: pathname?.startsWith("/protected/rent-notifications") ?? false,
    },
  ];

  // Finance Group (Agent Payouts & Commission Management)
  const financeItems: NavItem[] = [
    {
      title: "กระเป๋าเงินของฉัน",
      href: "/protected/wallet",
      icon: Wallet,
      active: pathname?.startsWith("/protected/wallet") ?? false,
    },
    {
      title: "เบิกจ่ายเอเยนต์",
      href: "/protected/finance/payouts",
      icon: BadgeDollarSign,
      active: pathname?.startsWith("/protected/finance/payouts") ?? false,
      roles: ["ADMIN", "MANAGER"],
    },
  ];

  const documentsItems: NavItem[] = [
    {
      title: "สัญญาเช่า",
      href: "/protected/contracts",
      icon: FileText,
      active: pathname?.startsWith("/protected/contracts") ?? false,
    },
    {
      title: "เอกสาร",
      href: "/protected/documents",
      icon: FolderOpen,
      active: pathname?.startsWith("/protected/documents") ?? false,
    },
  ];

  const publicItems: NavItem[] = [
    {
      title: "บทความและข่าวสาร",
      href: "/protected/blogs",
      icon: LayoutTemplate,
      active: pathname?.startsWith("/protected/blogs") ?? false,
    },
    {
      title: "การบริการและโซลูชัน",
      href: "/protected/services",
      icon: Layout,
      active: pathname?.startsWith("/protected/services") ?? false,
      roles: ["ADMIN", "AGENT"],
    },
    {
      title: "คำถามที่พบบ่อย",
      href: "/protected/faqs",
      icon: CircleHelp,
      active: pathname?.startsWith("/protected/faqs") ?? false,
    },
    {
      title: "พันธมิตร",
      href: "/protected/partners",
      icon: Users,
      active: pathname?.startsWith("/protected/partners") ?? false,
    },
    {
      title: "จัดการทำเล",
      href: "/protected/admin/popular-areas",
      icon: MapPin,
      active: pathname?.startsWith("/protected/admin/popular-areas") ?? false,
      roles: ["AGENT", "ADMIN"],
    },
  ];

  // Settings Group
  const settingsItems: NavItem[] = [
    {
      title: "โปรไฟล์",
      href: "/protected/profile",
      icon: UserCircle,
      active: pathname === "/protected/profile",
    },
    {
      title: "ตั้งค่าระบบ",
      href: "/protected/settings",
      icon: Settings,
      active: pathname === "/protected/settings",
      roles: ["ADMIN", "AGENT", "MANAGER"],
    },
  ];

  const groups: NavGroup[] = [
    {
      id: "crm",
      title: "ระบบ CRM",
      icon: Briefcase,
      items: crmItems,
    },
    {
      id: "finance",
      title: "การเงิน",
      icon: BadgeDollarSign,
      items: financeItems,
    },
    {
      id: "documents",
      title: "เอกสาร",
      icon: FileStack,
      items: documentsItems,
    },
    {
      id: "public",
      title: "เนื้อหาสาธารณะ",
      icon: Globe,
      items: publicItems,
    },
    {
      id: "settings",
      title: "ตั้งค่า",
      icon: Settings,
      items: settingsItems,
    },
    {
      id: "executive",
      title: "รายงานผู้บริหาร",
      icon: BarChart3,
      items: [
        {
          title: "รายงานและข้อมูลวิเคราะห์",
          href: "/protected/dashboard/executive",
          icon: Sparkles,
          active: pathname === "/protected/dashboard/executive",
          roles: ["ADMIN", "MANAGER"],
        },
        {
          title: "ภาพรวมทุกสาขา",
          href: "/protected/admin/executive",
          icon: Globe,
          active: pathname === "/protected/admin/executive",
          roles: ["ADMIN"],
        },
        {
          title: "คลังทรัพย์สินรวม",
          href: "/protected/admin/inventory",
          icon: Box,
          active: pathname === "/protected/admin/inventory",
          roles: ["ADMIN"],
        },
      ],
      roles: ["ADMIN", "MANAGER"],
    },
  ];

  const filterItems = (items: NavItem[]) => {
    return items.filter((item) => {
      if (item.roles && item.roles.length > 0) {
        if (!role || !item.roles.includes(role)) return false;
      }
      return true;
    });
  };

  const filterGroups = (groups: NavGroup[]) => {
    return groups
      .map((group) => ({
        ...group,
        items: filterItems(group.items),
      }))
      .filter((group) => {
        if (group.items.length === 0) return false;
        if (group.roles && group.roles.length > 0) {
          if (!role || !group.roles.includes(role)) return false;
        }
        return isStaff(role);
      });
  };

  const filteredGroups = filterGroups(groups);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="sm:hidden hover:bg-slate-100/50 rounded-full transition-all">
          <Menu className="h-5 w-5 text-slate-700" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-80 p-0 flex flex-col border-r border-slate-200 bg-white/95 backdrop-blur-xl"
      >
        <SheetTitle className="sr-only">เมนูหลัก</SheetTitle>
        
        {/* 1. Header & Branding (Compact Inline) */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-white/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
              <span className="text-white font-bold text-sm">{siteConfig.name?.charAt(0)}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 uppercase truncate">
                {siteConfig.name}
              </h1>
              <p className="text-[9px] uppercase tracking-wider text-blue-600 font-bold leading-none">
                Elite CRM
              </p>
            </div>
          </div>
          <div className="shrink-0 scale-90 origin-right">
            <TenantSwitcher />
          </div>
        </div>

        {/* 2. Navigation List (Main Content) */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          <Link
            href="/protected"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-[14px] px-3.5 h-11 transition-all duration-300 font-medium text-sm group relative",
              pathname === "/protected"
                ? "bg-blue-600/10 text-blue-700 active-glow"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
            )}
          >
            <div
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                pathname === "/protected"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                  : "bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-blue-600 group-hover:shadow-sm",
              )}
            >
              <BarChart3 className="h-4 w-4" />
            </div>
            แดชบอร์ด
          </Link>

          {filteredGroups.map((group) => {
            const isOpen = openGroups.includes(group.id);
            const hasActiveItem = group.items.some((item) => item.active);

            return (
              <div key={group.id} className="pt-2">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 rounded-lg px-3.5 py-2 transition-all duration-300",
                    hasActiveItem
                      ? "text-blue-700 bg-blue-50/30"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <group.icon className={cn("h-4 w-4", hasActiveItem ? "text-blue-600" : "text-slate-400")} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {group.title}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1 mt-1 ml-2 border-l-2 border-slate-100 pl-2">
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-4 h-11 transition-all duration-300 text-sm font-medium",
                              item.active
                                ? "bg-blue-600/10 text-blue-700 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.1)] active-glow"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
                            )}
                          >
                            <item.icon
                              className={cn(
                                "h-4 w-4 shrink-0 transition-colors",
                                item.active
                                  ? "text-blue-600 scale-110"
                                  : "text-slate-400",
                              )}
                            />
                            {item.title}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* 3. Sticky Footer (User Info & Logout - Thumb Zone) */}
        <div className="p-4 border-t border-slate-100 bg-white/80 backdrop-blur-md">
          <div className="bg-slate-50 rounded-[20px] p-3 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-9 w-9 border-2 border-white shadow-sm shrink-0">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-blue-600 text-white font-bold text-xs uppercase">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate leading-tight">
                  {profile?.full_name || "Guest"}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                    {profile?.role || "USER"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="h-9 w-9 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 flex items-center justify-center transition-all active:scale-90 shrink-0"
              title="ออกจากระบบ"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
