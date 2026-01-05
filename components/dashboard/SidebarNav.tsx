"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCircle,
  User,
  BarChart3, // Changed from PieChart to BarChart3 for safety
} from "lucide-react";
import { isStaff, type UserRole } from "@/lib/auth-shared";
import { cn } from "@/lib/utils";

export function SidebarNav({ role }: { role: UserRole }) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Dashboard",
      href: "/protected",
      icon: BarChart3,
      active: pathname === "/protected",
    },
    {
      title: "Properties",
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
      title: "Leads",
      href: "/protected/leads",
      icon: Users,
      active: pathname?.startsWith("/protected/leads") ?? false,
    },
    {
      title: "Deals",
      href: "/protected/deals",
      icon: LayoutDashboard,
      active: pathname?.startsWith("/protected/deals") ?? false,
    },
    {
      title: "โปรไฟล์",
      href: "/protected/profile",
      icon: UserCircle,
      active: pathname === "/protected/profile",
    },
  ];

  const filteredItems = navItems.filter((item) => {
    // Only staff can see these items
    const staffOnlyItems = [
      "Dashboard",
      "Properties",
      "เจ้าของทรัพย์",
      "Leads",
      "Deals",
    ];
    if (staffOnlyItems.includes(item.title)) {
      return isStaff(role);
    }
    return true; // "โปรไฟล์" is visible to everyone
  });

  return (
    <aside className="hidden w-72 flex-col border-r border-slate-100 bg-white sm:flex shadow-sm z-40 h-screen sticky top-0">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <Building2 className="text-white h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-slate-700 uppercase">
              SabaiCaza
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              Real Estate CRM
            </p>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-2 p-4 flex-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-4 rounded-xl px-4 py-3.5 transition-all duration-300 font-bold text-sm relative overflow-hidden group",
              item.active
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            {item.active && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-blue-600 rounded-r-full" />
            )}
            <item.icon
              className={cn(
                "h-5 w-5 transition-colors",
                item.active
                  ? "text-blue-600"
                  : "text-slate-400 group-hover:text-slate-600"
              )}
            />
            {item.title}
          </Link>
        ))}
      </nav>

      <div className="p-4 m-4 rounded-2xl bg-slate-50 border border-slate-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-emerald-100 p-2 rounded-lg">
            <Users className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Team Status</p>
            <p className="text-[10px] text-slate-500">Online</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
