"use client";

import { cn } from "@/lib/utils";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { AuthBackground } from "./auth-background";
import { AuthBranding } from "./auth-branding";
import React from "react";

interface PremiumAuthLayoutProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  view?: "login" | "signup" | "forgot-password" | "other";
  className?: string;
}

export function PremiumAuthLayout({
  children,
  title,
  view = "login",
  className,
}: PremiumAuthLayoutProps) {
  const isLogin = view === "login";
  const isSignUp = view === "signup";

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#020617]">
      <AuthBackground isLogin={isLogin} isSignUp={isSignUp} />
      <AuthBranding isLogin={isLogin} />

      <ResponsiveDialog
        open={true}
        onOpenChange={() => {}}
        modal={false}
        className={cn(
          "w-full max-w-md! border-none shadow-none animate-in fade-in",
          isLogin
            ? "bg-white/95 backdrop-blur-2xl sm:rounded-3xl sm:shadow-[0_20px_80px_-15px_rgba(0,0,0,0.15)] sm:border sm:border-black/5"
            : isSignUp
              ? "bg-slate-950/80 backdrop-blur-3xl sm:rounded-3xl sm:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] sm:border sm:border-white/10"
              : "bg-slate-900/90 backdrop-blur-3xl sm:rounded-3xl sm:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] sm:border sm:border-white/10",
          className,
        )}
        title={title}
        showCloseButton={false}
      >
        <div className="px-6 py-6 sm:px-6 sm:pb-12">
          {children}
        </div>
      </ResponsiveDialog>
    </div>
  );
}
