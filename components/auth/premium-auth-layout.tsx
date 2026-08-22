"use client";

import { cn } from "@/lib/utils";
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
  view = "login",
  className,
}: PremiumAuthLayoutProps) {
  const isLogin = view === "login";
  const isSignUp = view === "signup";

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-x-hidden bg-[#020617] p-4 sm:p-6">
      <AuthBackground isLogin={isLogin} isSignUp={isSignUp} />
      <AuthBranding isLogin={isLogin} />

      <div
        className={cn(
          "w-full max-w-md relative z-10 animate-in fade-in duration-300",
          isLogin
            ? "bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_80px_-15px_rgba(0,0,0,0.15)] border border-black/5"
            : isSignUp
              ? "bg-slate-950/80 backdrop-blur-3xl rounded-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border border-white/10"
              : "bg-slate-900/90 backdrop-blur-3xl rounded-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border border-white/10",
          className,
        )}
      >
        <div className="px-6 py-6 sm:px-6 sm:pb-12">
          {children}
        </div>
      </div>
    </div>
  );
}
