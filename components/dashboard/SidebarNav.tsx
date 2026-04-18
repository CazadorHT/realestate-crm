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
  Wallet,
  BadgeDollarSign
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
import { RiTeamLine } from "react-icons/ri";

export function SidebarNav({ 
  role, 
  initialCollapsed = false,
  aiReviewCount = 0
}: { 
  role: UserRole;
  initialCollapsed?: boolean;
  aiReviewCount?: number;
}) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<string[]>(["crm"]);
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [isHovered, setIsHovered] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // setCookie helper function
  const setSidebarCookie = (collapsed: boolean) => {
    // เก็บไว้ 1 ปี (31536000 วินาที) และระบุ path=/ เพื่อให้เข้าถึงได้ทั้งเว็บ
    document.cookie = `sidebar-collapsed=${collapsed}; path=/; max-age=31536000; SameSite=Lax`;
  };

  // Sync state with prop if it changes (optional but good for consistency)
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    setSidebarCookie(newState);
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
    description?: string;
    roles?: UserRole[];
    badge?: number;
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
      badge: aiReviewCount > 0 ? aiReviewCount : undefined,
      description: "จัดการรายการอสังหาริมทรัพย์และสถานะการประกาศขาย",
    },
    {
      title: "เจ้าของทรัพย์",
      href: "/protected/owners",
      icon: User,
      active: pathname?.startsWith("/protected/owners") ?? false,
      description: "ฐานข้อมูลติดต่อและประวัติทรัพย์สินของเจ้าของ",
    },
    {
      title: "ลีด",
      href: "/protected/leads",
      icon: Users,
      active: pathname?.startsWith("/protected/leads") ?? false,
      description: "ติดตามลูกค้ามุ่งหวังและการบันทึกความสนใจ",
    },
    {
      title: "เครือข่ายคู่ค้า",
      href: "/protected/co-brokers",
      icon: RiTeamLine,
      active: pathname?.startsWith("/protected/co-brokers") ?? false,
      description: "ประสานงานร่วมกับ Co-Broker และพาร์ทเนอร์รายย่อย",
    },
    {
      title: "กล่องข้อความ",
      href: "/protected/inbox",
      icon: MessageSquare,
      active: pathname === "/protected/inbox",
      description: "ศูนย์รวมการแชทและการสื่อสารทุกช่องทางแบบ Real-time",
    },
    {
      title: "ดีล",
      href: "/protected/deals",
      icon: Handshake,
      active: pathname?.startsWith("/protected/deals") ?? false,
      description: "บริหารจัดการสัญญาขาย เช่า และความคืบหน้าของดีล",
    },
    {
      title: "ปฏิทิน",
      href: "/protected/calendar",
      icon: CalendarDays,
      active: pathname?.startsWith("/protected/calendar") ?? false,
      description: "ตารางนัดหมายชมทรัพย์สินและการจัดกิจกรรมทีม",
    },
    {
      title: "ข้อมูลวิเคราะห์",
      href: "/protected/admin/analytics",
      icon: BarChart3,
      active: pathname?.startsWith("/protected/admin/analytics") ?? false,
      roles: ["ADMIN"],
      description: "รายงานภาพรวมและสถิติสำคัญสำหรับการตัดสินใจระดับบริหาร",
    },
    {
      title: "แจ้งเตือนค่าเช่า",
      href: "/protected/rent-notifications",
      icon: Bell,
      active: pathname?.startsWith("/protected/rent-notifications") ?? false,
      description: "ตรวจสอบและแจ้งเตือนยอดค้างชำระตามกำหนดสัญญาเช่า",
    },
  ];

  // Documents Group
  const documentsItems: NavItem[] = [
    {
      title: "สัญญาเช่า",
      href: "/protected/contracts",
      icon: FileText,
      active: pathname?.startsWith("/protected/contracts") ?? false,
      description: "คลังข้อมูลสัญญาเช่าที่ลงนามแล้วและรอตรวจสอบ",
    },
    {
      title: "เอกสาร",
      href: "/protected/documents",
      icon: FolderOpen,
      active: pathname?.startsWith("/protected/documents") ?? false,
      description: "จัดการไฟล์และฐานข้อมูลเอกสารประกอบการทำดีล",
    },
  ];

  // Public Content Group
  const publicItems: NavItem[] = [
    {
      title: "บทความและข่าวสาร",
      href: "/protected/blogs",
      icon: LayoutTemplate,
      active: pathname?.startsWith("/protected/blogs") ?? false,
      description: "จัดการเนื้อหาข่าวสารและบทความบนหน้าเว็บไซต์หลัก",
    },
    {
      title: "การบริการและโซลูชัน",
      href: "/protected/services",
      icon: Layout,
      active: pathname?.startsWith("/protected/services") ?? false,
      roles: ["ADMIN", "AGENT"],
      description: "ปรับแต่งข้อมูลบริการและโซลูชันเพื่อดึงดูดลูกค้า",
    },
    {
      title: "คำถามที่พบบ่อย",
      href: "/protected/faqs",
      icon: CircleHelp,
      active: pathname?.startsWith("/protected/faqs") ?? false,
      description: "ฐานข้อมูลคำถามที่พบบ่อยสำหรับบริการตนเองของลูกค้า",
    },
    {
      title: "พันธมิตร",
      href: "/protected/partners",
      icon: Globe,
      active: pathname?.startsWith("/protected/partners") ?? false,
      description: "จัดการรายชื่อพาร์ทเนอร์และเครือข่ายความร่วมมือแบรนด์",
    },
    {
      title: "จัดการทำเล",
      href: "/protected/admin/popular-areas",
      icon: MapPin,
      active: pathname?.startsWith("/protected/admin/popular-areas") ?? false,
      roles: ["AGENT", "ADMIN"],
      description: "กำหนดจุดทำเลทองและพื้นที่ยอดนิยมในคลังข้อมูลแบรนด์",
    },
  ];

  // Finance Group (Agent Payouts & Commission Management)
  const financeItems: NavItem[] = [
    {
      title: "กระเป๋าเงินของฉัน",
      href: "/protected/wallet",
      icon: Wallet,
      active: pathname?.startsWith("/protected/wallet") ?? false,
      description: "ตรวจสอบรายได้สะสม คอมมิชชัน และยอดเงินที่เบิกได้ทันที",
    },
    {
      title: "เบิกจ่ายเอเยนต์",
      href: "/protected/finance/payouts",
      icon: BadgeDollarSign,
      active: pathname?.startsWith("/protected/finance/payouts") ?? false,
      roles: ["ADMIN", "MANAGER"],
      description: "อนุมัติและจัดการการจ่ายค่าคอมมิชชันให้ทีมงานระดับบริหาร",
    },
  ];
 

  const settingsItems: NavItem[] = [
    {
      title: "โปรไฟล์",
      href: "/protected/profile",
      icon: UserCircle,
      active: pathname === "/protected/profile",
      description: "จัดการข้อมูลส่วนตัวของผู้ใช้งานและรูปโปรไฟล์ที่แสดงผล",
    },
    {
      title: "ตั้งค่าระบบ",
      href: "/protected/settings",
      icon: Settings,
      active: pathname === "/protected/settings",
      roles: ["ADMIN", "AGENT", "MANAGER"],
      description: "ปรับแต่งการทำงานของระบบและสิทธิ์การเข้าถึงข้อมูลสาขา",
    },
  ];

  const supportItems: NavItem[] = [
    {
      title: "ฝ่ายสนับสนุน LINE",
      href: siteConfig.links.line,
      icon: FaLine,
      active: false,
      description: "ติดต่อทีมงานฝ่ายเทคนิคผ่านแอป LINE ได้รวดเร็วที่สุด",
    },
    {
      title: "โทรแจ้งปัญหา",
      href: `tel:${siteConfig.contact.phone}`,
      icon: Phone,
      active: false,
      description: "ช่องทางติดต่อด่วนผ่านโทรศัพท์เพื่อแจ้งปัญหาฉุกเฉิน",
    },
    {
      title: "ข้อตกลงการให้บริการ (SLA)",
      href: "/protected/support/sla",
      icon: ShieldCheck,
      active: pathname === "/protected/support/sla",
      description: "รายละเอียดเงื่อนไขการให้บริการและการรับประกันคุณภาพ",
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
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          className={cn(
            "flex h-11 items-center gap-3 rounded-xl px-4 transition-all duration-200 text-sm relative overflow-hidden group/nav",
            item.active
              ? "bg-blue-600/10 text-blue-700 font-semibold shadow-[0_0_0_1px_rgba(37,99,235,0.1)]"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium",
            isCollapsed && "justify-center px-0",
          )}
        >
          {item.active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-blue-600 rounded-r-full shadow-[0_0_10px_rgba(37,99,235,0.3)]" />
          )}
          <item.icon
            className={cn(
              "h-4.5 w-4.5 transition-all duration-300",
              item.active
                ? "text-blue-600 scale-110"
                : "text-slate-400 group-hover/nav:text-slate-600 group-hover/nav:rotate-3",
            )}
          />
          {isCollapsed && item.badge !== undefined && (
            <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
          )}
          {!isCollapsed && <span className="truncate">{item.title}</span>}
          {item.badge !== undefined && (
            <span className={cn(
              "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold shadow-sm",
              item.active ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
            )}>
              {item.badge}
            </span>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent 
        side="right" 
        className="bg-slate-900 text-white border-none p-4 rounded-2xl shadow-2xl z-150 max-w-[240px] animate-in fade-in slide-in-from-left-2 duration-200"
      >
        <div className="font-semibold text-sm mb-1 text-blue-400">{item.title}</div>
        <div className="text-xs text-slate-300 leading-relaxed font-semibold">
          {item.description || item.title}
        </div>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "hidden flex-col border-r border-slate-200/60 bg-white/80 backdrop-blur-xl sm:flex shadow-sm z-100 h-screen sticky top-0",
          hasMounted ? "transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)" : "transition-none",
          isCollapsed ? "w-20" : "w-72",
        )}
      >
        <div
          className={cn(
            "p-5 pb-2 relative",
            isCollapsed && "p-4 flex justify-center",
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn("shrink-0 transition-transform duration-500", isCollapsed ? "scale-90" : "scale-100")}>
                <Image
                src={siteConfig.logo}
                alt={`${siteConfig.name} Logo`}
                width={60}
                height={60}
                className="rounded-xl object-contain shadow-lg shadow-slate-100"
                />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 animate-in fade-in slide-in-from-left-2 duration-500">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 uppercase">
                  {siteConfig.name}
                </h1>
                <p className="text-[9px] uppercase tracking-[0.2em] text-blue-600 font-bold leading-none">
                  Ultimate CRM
                </p>
              </div>
            )}
          </div>

          <button
            onClick={toggleCollapse}
            className={cn(
              "absolute -right-4 top-14 h-8 w-8 rounded-full border border-slate-200 bg-white items-center justify-center flex text-slate-500 hover:text-blue-600 shadow-lg hover:shadow-blue-500/20 transition-all duration-300 z-110 hover:scale-110 active:scale-90 group/toggle",
              isHovered
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-2 pointer-events-none",
            )}
            title={isCollapsed ? "ขยายเมนู" : "ย่อเมนู"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4 transition-transform group-hover/toggle:rotate-12" />
            ) : (
              <PanelLeftClose className="h-4 w-4 transition-transform group-hover/toggle:-rotate-12" />
            )}
          </button>
        </div>

        {/* Dashboard - Fixed Top Level */}
        <div className="px-4 pb-2">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/protected"
                  className={cn(
                    "flex h-11 items-center justify-center rounded-xl w-full transition-all duration-300 relative overflow-hidden group/dash",
                    pathname === "/protected"
                      ? "bg-blue-600/10 text-blue-700 shadow-[0_0_0_1px_rgba(37,99,235,0.1)]"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
                  )}
                >
                  {pathname === "/protected" && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-blue-600 rounded-r-full" />
                  )}
                  <BarChart3
                    className={cn(
                      "h-4.5 w-4.5 transition-all duration-300",
                      pathname === "/protected"
                        ? "text-blue-600 scale-110"
                        : "text-slate-400 group-hover/dash:text-slate-600 group-hover/dash:rotate-6",
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
                "flex h-11 items-center gap-4 rounded-xl px-4 transition-all duration-300 font-bold text-sm relative overflow-hidden group/dash",
                pathname === "/protected"
                  ? "bg-blue-600/10 text-blue-700 shadow-[0_0_0_1px_rgba(37,99,235,0.1)]"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
              )}
            >
              {pathname === "/protected" && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-blue-600 rounded-r-full" />
              )}
              <BarChart3
                className={cn(
                  "h-4.5 w-4.5 transition-all duration-300",
                  pathname === "/protected"
                    ? "text-blue-600 scale-110"
                    : "text-slate-400 group-hover/dash:text-slate-600 group-hover/dash:rotate-6",
                )}
              />
              แดชบอร์ด
            </Link>
          )}
        </div>

        <nav className="flex flex-col gap-2 p-4 flex-1 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar pr-2 pb-20">
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
                          "w-full flex items-center justify-center rounded-xl h-11 transition-all duration-300 relative",
                          hasActiveItem
                            ? "bg-blue-100 text-blue-700 shadow-sm"
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50",
                        )}
                      >
                        <group.icon className="h-4.5 w-4.5" />
                        {hasActiveItem && (
                          <div className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-blue-600 shadow-[0_0_5px_rgba(37,99,235,0.5)]" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{group.title}</TooltipContent>
                  </Tooltip>

                  {isOpen && (
                    <div className="space-y-1.5 bg-slate-50/50 rounded-2xl p-1.5 border border-slate-100/50 shadow-inner mt-1 animate-in zoom-in-95 duration-200">
                      {group.items.map((item) => (
                         <NavItemContent
                            key={item.href}
                            item={item}
                            isCollapsed={true}
                         />
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
                    "w-full flex h-10 items-center justify-between gap-3 rounded-xl px-4 transition-all duration-300 font-bold text-[10px] uppercase tracking-[0.15em] relative group/header",
                    hasActiveItem
                      ? "text-blue-700 bg-blue-50/50"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/30",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <group.icon className={cn("h-4 w-4 transition-transform duration-300", isOpen && "rotate-6")} />
                    {group.title}
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 opacity-40 group-hover/header:translate-x-0.5 transition-transform" />
                  )}
                </button>

                {/* Group Items */}
                {isOpen && (
                  <div className="space-y-1 ml-1 pl-1 border-l-2 border-slate-50 animate-in slide-in-from-left-2 duration-300">
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
