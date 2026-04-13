"use client";

import React from "react";
import {
  Building2,
  PieChart as PieChartIcon,
  Calendar,
  Sparkles,
  Download,
  FileText,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ExecutiveAiInsights } from "../../executive-ai-actions";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

import { Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardHeaderProps {
  // We keep it simple, title and subtitle are handled internally or passed
}

export function DashboardHeader({}: DashboardHeaderProps) {
  return (
    <PageHeader
      title={<span className="font-semibold">Executive Dashboard</span>}
      subtitle="สรุปภาพรวมผลประกอบการและการเติบโตของธุรกิจ"
      icon="pieChart"
      gradient="blue"
    />
  );
}
