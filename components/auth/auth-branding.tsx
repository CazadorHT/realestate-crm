"use client";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";
import Image from "next/image";
import Link from "next/link";
import { Home } from "lucide-react";

interface AuthBrandingProps {
  isLogin: boolean;
}

export function AuthBranding({ isLogin }: AuthBrandingProps) {
  return (
    <>
      {/* 🏢 Luxury Desktop Branding */}
      <div className="hidden lg:flex absolute top-8 left-8 z-20 flex-col gap-1 items-start">
        <div
          className={cn(
            "p-3 backdrop-blur-xl rounded-xl border shadow-2xl transition-all duration-700",
            isLogin ? "bg-white/10 border-black/5" : "bg-white/5 border-white/10",
          )}
        >
          <Image
            src={isLogin ? siteConfig.logoDark : siteConfig.logoDark}
            alt={siteConfig.name}
            width={140}
            height={40}
            className="h-24 w-auto transition-all"
          />
        </div>
        <p
          className={cn(
            "text-[9px] uppercase tracking-[0.2em] font-bold ml-1 py-2 transition-colors duration-700",
            isLogin ? "text-white/40" : "text-white/60",
          )}
        >
          Property Management System | CRM Solution
        </p>
      </div>

      {/* 📜 Copyright Footer */}
      <div className="absolute bottom-6 left-0 right-0 z-20 text-center px-4">
        <p
          className={cn(
            "text-[10px] font-bold tracking-wider transition-colors duration-700",
            isLogin ? "text-white/70" : "text-white/30",
          )}
        >
          © {new Date().getFullYear()} {siteConfig.company}. All rights reserved.
        </p>
      </div>

      {/* 🏠 Navigation Links */}
      <div className="absolute top-4 right-4 lg:top-8 lg:right-8 z-30">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 px-4 py-2 backdrop-blur-md border rounded-full transition-all group active:scale-95 shadow-lg hover:scale-105",
            isLogin
              ? "bg-white/10 border-black/5 text-white hover:bg-white/30"
              : "bg-white/10 border-white/10 text-white hover:bg-white/20",
          )}
        >
          <Home
            className={cn("h-5 w-5", isLogin ? "text-blue-500" : "text-blue-400")}
          />
          <span className="text-sm font-semibold hidden sm:inline">
            <span>Back to Home</span>
          </span>
        </Link>
      </div>
    </>
  );
}
