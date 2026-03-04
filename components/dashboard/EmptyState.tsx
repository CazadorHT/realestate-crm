"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Users,
  UserPlus,
  UserCircle,
  Handshake,
  FileText,
  HelpCircle,
  Plus,
  Home,
  MessageSquare,
  TrendingUp,
  Search,
  Layout,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon map - add icons as needed
const ICON_MAP: Record<string, LucideIcon> = {
  plusCircle: PlusCircle,
  users: Users,
  userPlus: UserPlus,
  userCircle: UserCircle,
  handshake: Handshake,
  fileText: FileText,
  helpCircle: HelpCircle,
  plus: Plus,
  home: Home,
  messageSquare: MessageSquare,
  trendingUp: TrendingUp,
  search: Search,
  layout: Layout,
};

interface EmptyStateProps {
  icon?: keyof typeof ICON_MAP;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  actionIcon?: keyof typeof ICON_MAP;
  onAction?: () => void;
  actionSlot?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = "plusCircle",
  title,
  description,
  actionLabel,
  actionHref,
  actionIcon = "plusCircle",
  onAction,
  actionSlot,
  className,
}: EmptyStateProps) {
  const Icon = ICON_MAP[icon] || PlusCircle;
  const ActionIcon = ICON_MAP[actionIcon] || PlusCircle;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-linear-to-br from-slate-50/50 via-white to-indigo-50/30 p-12 transition-all duration-500",
        className,
      )}
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-24 h-24 border-4 border-indigo-400 rounded-2xl rotate-12 animate-pulse" />
        <div className="absolute bottom-10 right-10 w-20 h-20 border-4 border-violet-400 rounded-full animate-bounce duration-3000" />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 border-4 border-slate-300 rounded-lg -rotate-12" />
        <div className="absolute top-1/4 right-1/4 w-12 h-12 bg-indigo-200 rounded-full blur-xl" />
      </div>

      <div className="relative flex flex-col items-center justify-center text-center space-y-8">
        {/* Animated Icon Container */}
        <div className="relative group">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl scale-150 animate-pulse" />
          <div className="relative p-8 bg-linear-to-br from-indigo-600 to-violet-600 rounded-xl shadow-2xl shadow-indigo-500/40 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
            <Icon className="h-14 w-14 text-white animate-in zoom-in duration-700" />
          </div>
          {/* Subtle ring */}
          <div className="absolute -inset-2 border-2 border-indigo-100 rounded-[2.5rem] opacity-50 group-hover:scale-110 transition-transform duration-500" />
        </div>

        {/* Text Section */}
        <div className="space-y-3 max-w-lg">
          <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
            {title}
          </h3>
          <p className="text-slate-500 text-lg leading-relaxed font-medium">
            {description}
          </p>
        </div>

        {/* CTA Section */}
        <div className="pt-2">
          {actionSlot ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {actionSlot}
            </div>
          ) : actionLabel && (actionHref || onAction) ? (
            <Button
              asChild={!!actionHref}
              size="lg"
              className="bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300 px-10 h-14 rounded-2xl text-base font-bold group animate-in fade-in slide-in-from-bottom-4 duration-1000"
              onClick={onAction}
            >
              {actionHref ? (
                <Link href={actionHref}>
                  <ActionIcon className="h-5 w-5 mr-3 group-hover:scale-125 transition-transform" />
                  {actionLabel}
                </Link>
              ) : (
                <>
                  <ActionIcon className="h-5 w-5 mr-3 group-hover:scale-125 transition-transform" />
                  {actionLabel}
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
    </div>
  );
}
