"use client";

import React from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface DashboardHeaderProps {
  // We keep it simple, title and subtitle are handled internally or passed
}

export function DashboardHeader({}: DashboardHeaderProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <PageHeader
      id="tour-header"
      title={<span className="font-semibold">Executive Dashboard</span>}
      subtitle={
        isEn
          ? "Executive overview of performance, revenue, and business growth"
          : "สรุปภาพรวมผลประกอบการและการเติบโตของธุรกิจ"
      }
      icon="pieChart"
      gradient="blue"
    />
  );
}
