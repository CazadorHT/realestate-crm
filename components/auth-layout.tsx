"use client";

import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import React from "react";
import Image from "next/image";
import { siteConfig } from "@/lib/site-config";

interface AuthLayoutProps {
  children: React.ReactNode;
  greeting: React.ReactNode;
  subtitle: string;
  features: string[];
}

export function AuthLayout({
  children,
  greeting,
  subtitle,
  features,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex animate-in fade-in duration-500">
      {/* Left Side - Branding & Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-blue-600 via-purple-600 to-blue-700 p-12 flex-col justify-between relative overflow-hidden animate-in slide-in-from-left duration-1000 ease-in-out">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-[blob_7s_infinite]"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-[blob_7s_infinite_2s]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 animate-in fade-in zoom-in-95 duration-1000 delay-300 fill-mode-backwards">
          <Link href="/" className="flex items-center gap-2 text-white group">
            <Image
              src={siteConfig.logoDark}
              alt={`${siteConfig.name} Logo`}
              width={150}
              height={50}
              className="h-10 w-auto"
            />
          </Link>
        </div>

        <div className="relative z-10 space-y-6 text-white">
          <h1 className="text-4xl font-bold leading-tight animate-in slide-in-from-bottom-10 fade-in duration-700 delay-500 fill-mode-backwards">
            {greeting}
          </h1>
          <p className="text-lg text-blue-100 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-700 fill-mode-backwards">
            {subtitle}
          </p>

          {/* Feature Highlights */}
          <div className="space-y-4 pt-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-3 animate-in slide-in-from-left-10 fade-in duration-700 fill-mode-backwards"
                style={{ animationDelay: `${900 + i * 150}ms` }}
              >
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-blue-50">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-blue-100 text-sm animate-in fade-in duration-1000 delay-1000 fill-mode-backwards">
          © {new Date().getFullYear()} {siteConfig.company}. All rights
          reserved.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-slate-50 animate-in slide-in-from-right-10 fade-in duration-1000 delay-200 fill-mode-backwards">
        <div className="w-full max-w-md space-y-8 animate-in zoom-in-95 fade-in duration-700 delay-500 fill-mode-backwards">
          {/* Back Button for Mobile */}
          <div className="lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span>กลับสู่หน้าหลัก</span>
            </Link>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Image
              src={siteConfig.logo}
              alt={`${siteConfig.name} Logo`}
              width={150}
              height={50}
              className="h-10 w-auto"
            />
          </div>

          {/* Desktop Back Button */}
          <div className="hidden lg:block">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span>กลับสู่หน้าหลัก</span>
            </Link>
          </div>

          {children}

          {/* Help Text - Can be passed as prop if needed, or kept generic here, or moved to children. 
               The original login form had it at the bottom. 
               For now, I'll let the children handle the very bottom specialized links (like 'Contact Us') 
               or I can include it here if it's common. 
               Wait, 'Contact Us' seems common enough but maybe specific per form? 
               The Login form has it. Let's leave it to the children for maximum flexibility for now, 
               or add it as an optional footer prop. 
               Actually, looking at the layout, 'children' usually is just the Card.
               The 'Back to Home' is above the card.
               The 'Contact Support' is below the card.
           */}
        </div>
      </div>
    </div>
  );
}
