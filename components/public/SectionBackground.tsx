"use client";

import { cn } from "@/lib/utils";
import {
  Home,
  Key,
  MapPin,
  Search,
  Building,
  Calculator,
  Percent,
  TrendingUp,
  ShieldCheck,
  Star,
  Users,
  FileText,
  BadgeCheck,
} from "lucide-react";

type PatternType = "blobs" | "icons" | "grid" | "none";

interface SectionBackgroundProps {
  pattern?: PatternType;
  className?: string;
  intensity?: "low" | "medium" | "high";
  showDots?: boolean;
}

export function SectionBackground({
  pattern = "blobs",
  className,
  intensity = "low",
  showDots = false,
}: SectionBackgroundProps) {
  if (pattern === "none" && !showDots) return null;

  const opacityClass =
    intensity === "high"
      ? "opacity-80"
      : intensity === "medium"
      ? "opacity-50"
      : "opacity-30";

  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none overflow-hidden select-none -z-10",
        className
      )}
      aria-hidden="true"
    >
      {showDots && <DotPattern />}
      {pattern === "blobs" && <BlobPattern opacityClass={opacityClass} />}
      {pattern === "icons" && <IconPattern opacityClass={opacityClass} />}
      {pattern === "grid" && <GridPattern opacityClass={opacityClass} />}
    </div>
  );
}

function DotPattern() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-70" />
  );
}

function BlobPattern({ opacityClass }: { opacityClass: string }) {
  return (
    <div className={cn("absolute inset-0", opacityClass)}>
      {/* Top Left Blob */}
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-400/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />

      {/* Top Right Blob */}
      <div className="absolute top-[10%] -right-[10%] w-[40%] h-[50%] bg-purple-400/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />

      {/* Bottom Blob */}
      <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] bg-pink-400/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
    </div>
  );
}

function IconPattern({ opacityClass }: { opacityClass: string }) {
  const icons = [
    { Icon: Home, top: "10%", left: "5%", size: 48, rotate: "12deg" },
    { Icon: Key, top: "15%", right: "10%", size: 32, rotate: "-15deg" },
    { Icon: MapPin, bottom: "20%", left: "15%", size: 40, rotate: "5deg" },
    { Icon: Search, bottom: "10%", right: "5%", size: 56, rotate: "-10deg" },
    { Icon: Building, top: "40%", left: "80%", size: 44, rotate: "20deg" },
    { Icon: Calculator, top: "60%", left: "10%", size: 36, rotate: "-5deg" },
    { Icon: ShieldCheck, top: "80%", right: "20%", size: 50, rotate: "15deg" },
    { Icon: TrendingUp, top: "20%", left: "40%", size: 28, rotate: "8deg" },
  ];

  return (
    <div className={cn("absolute inset-0", opacityClass)}>
      {icons.map((item, idx) => (
        <item.Icon
          key={idx}
          className="absolute text-slate-900/20"
          style={{
            top: item.top,
            left: item.left,
            right: item.right,
            bottom: item.bottom,
            width: item.size,
            height: item.size,
            transform: `rotate(${item.rotate})`,
          }}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function GridPattern({ opacityClass }: { opacityClass: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]",
        opacityClass
      )}
    />
  );
}
