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
} from "lucide-react";
import { isStaff, isAdmin, type UserRole } from "@/lib/auth-shared";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function MobileNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(["crm", "public"]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

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
      title: "ดีล",
      href: "/protected/deals",
      icon: LayoutDashboard,
      active: pathname?.startsWith("/protected/deals") ?? false,
    },
    {
      title: "ปฏิทิน",
      href: "/protected/calendar",
      icon: CalendarDays,
      active: pathname?.startsWith("/protected/calendar") ?? false,
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
      title: "บทความ (Blog)",
      href: "/protected/blogs",
      icon: LayoutTemplate,
      active: pathname?.startsWith("/protected/blogs") ?? false,
    },
    {
      title: "บริการ (Services)",
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

  const settingsItems: NavItem[] = [
    {
      title: "โปรไฟล์",
      href: "/protected/profile",
      icon: UserCircle,
      active: pathname === "/protected/profile",
    },
    {
      title: "AI Monitor",
      href: "/protected/ai-monitor",
      icon: Activity,
      active: pathname?.startsWith("/protected/ai-monitor") ?? false,
      roles: ["ADMIN", "AGENT"],
    },
    {
      title: "ตั้งค่าเว็บไซต์",
      href: "/protected/settings",
      icon: Settings,
      active: pathname === "/protected/settings",
      roles: ["ADMIN", "AGENT"],
    },
    {
      title: "SmartMatch Config",
      href: "/protected/settings/smart-match",
      icon: Sparkles,
      active: pathname?.startsWith("/protected/settings/smart-match") ?? false,
      roles: ["ADMIN"],
    },
    {
      title: "จัดการผู้ใช้",
      href: "/protected/settings/users",
      icon: Shield,
      active: pathname?.startsWith("/protected/settings/users") ?? false,
      roles: ["ADMIN"],
    },
    {
      title: "Audit Logs",
      href: "/protected/admin/audit-logs",
      icon: History,
      active: pathname?.startsWith("/protected/admin/audit-logs") ?? false,
      roles: ["ADMIN"],
    },
    {
      title: "Line Manager",
      href: "/protected/line-manager",
      icon: MessageSquare,
      active: pathname?.startsWith("/protected/line-manager") ?? false,
      roles: ["ADMIN"],
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
        <Button variant="ghost" size="icon" className="sm:hidden">
          <Menu className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[300px] p-0 overflow-y-auto border-r border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl"
      >
        <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-linear-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/40 transform transition-transform group-hover:scale-105">
              <Building2 className="text-white h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 uppercase leading-none">
                OMA ASSET
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 font-black mt-1">
                Real Estate CRM
              </p>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 p-4 pb-12">
          <Link
            href="/protected"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-4 rounded-xl px-4 py-4 transition-all duration-300 font-bold text-sm relative overflow-hidden group",
              pathname === "/protected"
                ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-[0_4px_12px_-2px_rgba(59,130,246,0.12)] border border-blue-100/50 dark:border-blue-900/20"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm",
            )}
          >
            {pathname === "/protected" && (
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-r-full shadow-[2px_0_8px_rgba(37,99,235,0.4)]" />
            )}
            <div
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
                pathname === "/protected"
                  ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-500",
              )}
            >
              <BarChart3 className="h-5 w-5" />
            </div>
            แดชบอร์ด
          </Link>

          {filteredGroups.map((group) => {
            const isOpen = openGroups.includes(group.id);
            const hasActiveItem = group.items.some((item) => item.active);

            return (
              <div key={group.id} className="space-y-1">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 transition-all duration-300 font-bold text-[10px] uppercase tracking-[0.15em]",
                    hasActiveItem
                      ? "bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-6 w-6 rounded flex items-center justify-center transition-colors",
                        hasActiveItem ? "text-blue-600" : "text-slate-400",
                      )}
                    >
                      <group.icon className="h-4 w-4" />
                    </div>
                    {group.title}
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  ) : (
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  )}
                </button>

                {isOpen && (
                  <div className="space-y-1 ml-3 pl-3 border-l border-slate-100 dark:border-slate-800">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-300 text-sm relative overflow-hidden group",
                          item.active
                            ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 font-bold shadow-sm border border-blue-50/50"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 font-semibold",
                        )}
                      >
                        {item.active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-blue-600 rounded-r-full shadow-[1px_0_4px_rgba(37,99,235,0.4)]" />
                        )}
                        <item.icon
                          className={cn(
                            "h-4 w-4 transition-colors shrink-0",
                            item.active
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-slate-400 group-hover:text-blue-500",
                          )}
                        />
                        {item.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
