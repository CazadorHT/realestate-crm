"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCircle,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SidebarNav() {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Dashboard",
      href: "/protected",
      icon: LayoutDashboard,
      active: pathname === "/protected",
    },
    {
      title: "Properties",
      href: "/protected/properties",
      icon: Building2,
      active: pathname.startsWith("/protected/properties"),
    },
    {
      title: "เจ้าของทรัพย์",
      href: "/protected/owners",
      icon: User,
      active: pathname.startsWith("/protected/owners"),
    },
    {
      title: "Leads",
      href: "/protected/leads", // Updated from '#' to a plausible path, though user had '#'
      icon: Users,
      active: pathname.startsWith("/protected/leads"),
    },
    {
      title: "โปรไฟล์",
      href: "/protected/profile",
      icon: UserCircle,
      active: pathname === "/protected/profile",
    },
  ];

  return (
    <aside className="hidden w-64 flex-col border-r border-border/10 bg-surface sm:flex shadow-soft">
      <nav className="flex flex-col gap-2 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all font-medium",
              item.active
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "text-muted-foreground hover:text-primary hover:bg-muted"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
