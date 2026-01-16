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
} from "lucide-react";
import { isStaff, type UserRole } from "@/lib/auth-shared";
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
        : [...prev, groupId]
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
      title: "สิ่งอำนวยความสะดวก",
      href: "/protected/features",
      icon: Box,
      active: pathname?.startsWith("/protected/features") ?? false,
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
      title: "จัดการผู้ใช้",
      href: "/protected/settings/users",
      icon: Shield,
      active: pathname?.startsWith("/protected/settings/users") ?? false,
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
      <SheetContent side="left" className="w-[300px] p-0 overflow-y-auto">
        <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
              <Building2 className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-medium tracking-tight text-slate-700 dark:text-slate-200 uppercase">
                SabaiCaza
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
                Real Estate CRM
              </p>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          <Link
            href="/protected"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-4 rounded-xl px-4 py-3.5 transition-all duration-300 font-bold text-sm relative overflow-hidden group",
              pathname === "/protected"
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            {pathname === "/protected" && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-blue-600 rounded-r-full" />
            )}
            <BarChart3
              className={cn(
                "h-5 w-5 transition-colors",
                pathname === "/protected"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
              )}
            />
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
                    "w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all duration-300 font-semibold text-xs uppercase tracking-wider",
                    hasActiveItem
                      ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <group.icon className="h-4 w-4" />
                    {group.title}
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {isOpen && (
                  <div className="space-y-1 ml-2">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-300 text-sm relative overflow-hidden group",
                          item.active
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                        )}
                      >
                        {item.active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 bg-blue-600 rounded-r-full" />
                        )}
                        <item.icon
                          className={cn(
                            "h-4 w-4 transition-colors",
                            item.active
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
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
