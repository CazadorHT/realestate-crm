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
  type LucideIcon,
} from "lucide-react";

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
}: EmptyStateProps) {
  const Icon = ICON_MAP[icon] || PlusCircle;
  const ActionIcon = ICON_MAP[actionIcon] || PlusCircle;

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-linear-to-br from-slate-50 to-white p-12">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 border-4 border-slate-400 rounded-xl rotate-12" />
        <div className="absolute bottom-10 right-10 w-16 h-16 border-4 border-slate-400 rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-12 h-12 border-4 border-slate-400 rounded-lg -rotate-6" />
      </div>

      <div className="relative flex flex-col items-center justify-center text-center space-y-6">
        {/* Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl scale-150" />
          <div className="relative p-6 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/30">
            <Icon className="h-12 w-12 text-white" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2 max-w-md">
          <h3 className="text-2xl font-bold text-slate-800">{title}</h3>
          <p className="text-slate-500 leading-relaxed">{description}</p>
        </div>

        {/* CTA Button or Slot */}
        {actionSlot ? (
          <div className="[&_button]:bg-linear-to-r [&_button]:from-blue-600 [&_button]:to-indigo-600 [&_button]:hover:from-blue-700 [&_button]:hover:to-indigo-700 [&_button]:text-white [&_button]:shadow-lg [&_button]:hover:shadow-xl [&_button]:px-8 [&_button]:h-11">
            {actionSlot}
          </div>
        ) : actionLabel && (actionHref || onAction) ? (
          <Button
            asChild={!!actionHref}
            size="lg"
            className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8"
            onClick={onAction}
          >
            {actionHref ? (
              <Link href={actionHref}>
                <ActionIcon className="h-5 w-5 mr-2" />
                {actionLabel}
              </Link>
            ) : (
              <>
                <ActionIcon className="h-5 w-5 mr-2" />
                {actionLabel}
              </>
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
