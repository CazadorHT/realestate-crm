"use client";

import Link from "next/link";
import Image from "next/image";
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
  Box,
  History,
  CalendarDays,
  MessageSquare,
  Activity,
  Layout,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Cpu,
  Bell,
  Handshake,
  Headset,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { FaLine } from "react-icons/fa";
import { isStaff, isAdmin, type UserRole } from "@/lib/auth-shared";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isFeatureEnabled } from "@/lib/features";

export function SidebarNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<string[]>([
    "crm",
    "documents",
    "public",
    "settings",
    "support",
  ]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Initialize collapse state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

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

  // Core CRM Group
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

  // Documents Group
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

  // Public Content Group
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

  // Support Group
  const supportItems: NavItem[] = [
    {
      title: "LINE Support",
      href: siteConfig.links.line,
      icon: FaLine,
      active: false,
    },
    {
      title: "โทรแจ้งปัญหา",
      href: `tel:${siteConfig.contact.phone}`,
      icon: Phone,
      active: false,
    },
    {
      title: "SLA Agreement",
      href: "/protected/support/sla",
      icon: ShieldCheck,
      active: pathname === "/protected/support/sla",
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
    {
      id: "support",
      title: "ความช่วยเหลือ",
      icon: Headset,
      items: supportItems,
    },
  ];

  const filterItems = (items: NavItem[]) => {
    return items.filter((item) => {
      // Role Check
      if (item.roles && item.roles.length > 0) {
        if (!role || !item.roles.includes(role)) return false;
      }

      // Feature Gating Checks
      if (
        item.href.includes("line-manager") &&
        !isFeatureEnabled("line_integration")
      )
        return false;
      if (
        item.href.includes("ai-monitor") &&
        !isFeatureEnabled("ai_smart_summary")
      )
        return false;
      if (
        item.href.includes("smart-match") &&
        !isFeatureEnabled("ai_smart_summary")
      )
        return false;

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
        // Only show group if it has items and user has permission
        if (group.items.length === 0) return false;
        if (group.roles && group.roles.length > 0) {
          if (!role || !group.roles.includes(role)) return false;
        }
        return isStaff(role);
      });
  };

  const filteredGroups = filterGroups(groups);

  const NavItemContent = ({
    item,
    isCollapsed,
  }: {
    item: NavItem;
    isCollapsed: boolean;
  }) => (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-300 text-sm relative overflow-hidden group",
        item.active
          ? "bg-blue-50 text-blue-700 font-semibold"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium",
        isCollapsed && "justify-center px-0",
      )}
    >
      {item.active && (
        <div
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 bg-blue-600 rounded-r-full",
            isCollapsed && "h-8 w-1",
          )}
        />
      )}
      <item.icon
        className={cn(
          "h-4 w-4 transition-colors shrink-0",
          item.active
            ? "text-blue-600"
            : "text-slate-400 group-hover:text-slate-600",
        )}
      />
      {!isCollapsed && <span>{item.title}</span>}
    </Link>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "hidden flex-col border-r border-slate-100 bg-white sm:flex shadow-sm z-40 h-screen sticky top-0 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-24" : "w-72",
        )}
      >
        <div
          className={cn(
            "p-8 pb-4 relative",
            isCollapsed && "p-4 flex justify-center",
          )}
        >
          <div className="flex items-center gap-3">
            <Image
              src={siteConfig.logo}
              alt={`${siteConfig.name} Logo`}
              width={70}
              height={70}
              className="rounded-lg object-contain"
            />
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="text-xl font-medium tracking-tight text-slate-700 uppercase">
                  {siteConfig.name}
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
                  {siteConfig.description}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={toggleCollapse}
            className={cn(
              "absolute -right-3.5 top-16 h-7 w-7 rounded-full border border-slate-200 bg-white items-center justify-center flex text-slate-500 hover:text-blue-600 shadow-md hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 z-50 hover:scale-110 active:scale-95 group/toggle",
              isHovered
                ? "opacity-100 translate-x-0"
                : "opacity-70 -translate-x-1",
            )}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4 transition-transform group-hover/toggle:rotate-12" />
            ) : (
              <PanelLeftClose className="h-4 w-4 transition-transform group-hover/toggle:-rotate-12" />
            )}
          </button>
        </div>

        <nav className="flex flex-col gap-2 p-4 flex-1 overflow-y-auto scrollbar-hide">
          {/* Dashboard - Top Level */}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/protected"
                  className={cn(
                    "flex items-center justify-center rounded-xl h-12 w-full transition-all duration-300 font-bold text-sm relative overflow-hidden group",
                    pathname === "/protected"
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
                  )}
                >
                  {pathname === "/protected" && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-blue-600 rounded-r-full" />
                  )}
                  <BarChart3
                    className={cn(
                      "h-5 w-5 transition-colors",
                      pathname === "/protected"
                        ? "text-blue-600"
                        : "text-slate-400 group-hover:text-slate-600",
                    )}
                  />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">แดชบอร์ด</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/protected"
              className={cn(
                "flex items-center gap-4 rounded-xl px-4 py-3.5 transition-all duration-300 font-bold text-sm relative overflow-hidden group",
                pathname === "/protected"
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
              )}
            >
              {pathname === "/protected" && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-blue-600 rounded-r-full" />
              )}
              <BarChart3
                className={cn(
                  "h-5 w-5 transition-colors",
                  pathname === "/protected"
                    ? "text-blue-600"
                    : "text-slate-400 group-hover:text-slate-600",
                )}
              />
              แดชบอร์ด
            </Link>
          )}

          {/* Grouped Menus */}
          {filteredGroups.map((group) => {
            const isOpen = openGroups.includes(group.id);
            const hasActiveItem = group.items.some((item) => item.active);

            if (isCollapsed) {
              return (
                <div key={group.id} className="space-y-1 mb-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className={cn(
                          "w-full flex items-center justify-center rounded-xl h-12 transition-all duration-300 font-semibold text-xs uppercase tracking-wider relative",
                          hasActiveItem
                            ? "bg-blue-100 text-blue-700"
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50",
                        )}
                      >
                        <group.icon className="h-4 w-4" />
                        {hasActiveItem && (
                          <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{group.title}</TooltipContent>
                  </Tooltip>

                  {isOpen && (
                    <div className="space-y-1 bg-slate-50 rounded-xl p-1 mx-1 border border-slate-100 shadow-inner">
                      {group.items.map((item) => (
                        <Tooltip key={item.href}>
                          <TooltipTrigger asChild>
                            <div>
                              <NavItemContent item={item} isCollapsed={true} />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {item.title}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={group.id} className="space-y-1">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all duration-300 font-semibold text-xs uppercase tracking-wider",
                    hasActiveItem
                      ? "bg-blue-100 text-blue-700"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50",
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

                {/* Group Items */}
                {isOpen && (
                  <div className="space-y-1 ml-2">
                    {group.items.map((item) => (
                      <NavItemContent
                        key={item.href}
                        item={item}
                        isCollapsed={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
