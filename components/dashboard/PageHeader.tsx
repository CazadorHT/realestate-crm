"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  UserPlus,
  UserCircle,
  Handshake,
  FileText,
  HelpCircle,
  Plus,
  PlusCircle,
  type LucideIcon,
} from "lucide-react";
import { ReactNode } from "react";

// Icon map - add icons as needed
const ICON_MAP: Record<string, LucideIcon> = {
  building2: Building2,
  users: Users,
  userPlus: UserPlus,
  userCircle: UserCircle,
  handshake: Handshake,
  fileText: FileText,
  helpCircle: HelpCircle,
  plus: Plus,
  plusCircle: PlusCircle,
};

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  count?: number;
  icon?: keyof typeof ICON_MAP;
  actionLabel?: string;
  actionHref?: string;
  actionIcon?: keyof typeof ICON_MAP;
  actionSlot?: ReactNode; // For custom action components like dialogs
  gradient?: "blue" | "emerald" | "purple" | "amber" | "rose";
  children?: ReactNode;
}

const GRADIENT_MAP = {
  blue: "from-blue-600 via-indigo-600 to-purple-600",
  emerald: "from-emerald-600 via-teal-600 to-cyan-600",
  purple: "from-purple-600 via-violet-600 to-indigo-600",
  amber: "from-amber-500 via-orange-500 to-red-500",
  rose: "from-rose-600 via-pink-600 to-fuchsia-600",
};

export function PageHeader({
  title,
  subtitle,
  count,
  icon,
  actionLabel,
  actionHref,
  actionIcon,
  actionSlot,
  gradient = "blue",
  children,
}: PageHeaderProps) {
  const Icon = icon ? ICON_MAP[icon] : null;
  const ActionIcon = actionIcon ? ICON_MAP[actionIcon] : null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-linear-to-r ${GRADIENT_MAP[gradient]} p-6 md:p-8 shadow-xl`}
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <Icon className="h-6 w-6 text-white" />
              </div>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {title}
            </h1>
          </div>
          {(subtitle || count !== undefined) && (
            <p className="text-white/80 text-sm md:text-base max-w-md">
              {subtitle}
              {count !== undefined && (
                <>
                  {subtitle && " • "}
                  มีทั้งหมด{" "}
                  <span className="font-bold text-white">{count}</span> รายการ
                </>
              )}
            </p>
          )}
        </div>

        {/* Action Slot - for custom components like dialogs */}
        {actionSlot ? (
          <div className="[&_button]:bg-white [&_button]:text-slate-800 [&_button]:hover:bg-white/90 [&_button]:shadow-lg [&_button]:font-semibold">
            {actionSlot}
          </div>
        ) : actionLabel && actionHref ? (
          <Button
            asChild
            size="lg"
            className="bg-white text-slate-800 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
          >
            <Link href={actionHref}>
              {ActionIcon && <ActionIcon className="h-5 w-5 mr-2" />}
              {actionLabel}
            </Link>
          </Button>
        ) : null}
      </div>

      {children && (
        <div className="mt-6 pt-6 border-t border-white/10">{children}</div>
      )}
    </div>
  );
}
