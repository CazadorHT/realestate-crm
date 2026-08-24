"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { WalletWealthCards } from "./WalletWealthCards";
import { WalletHistoryList } from "./WalletHistoryList";
import { WalletPortfolioStats } from "./WalletPortfolioStats";
import { useLanguage } from "@/lib/i18n/language-context";

interface WalletPageViewProps {
  stats: {
    totalEarnings: number;
    pendingAmount: number;
    closedDealsCount: number;
    totalCommissionsCount: number;
  };
  history: any[];
}

export function WalletPageView({ stats, history }: WalletPageViewProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="p-4 sm:p-8 max-w-screen-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <PageHeader
        title={isEn ? "My Wallet" : "กระเป๋าเงินของฉัน"}
        subtitle={
          isEn
            ? "Summary of your total earnings and deal closing performance"
            : "สรุปยอดรายได้และผลงานการปิดดีลทั้งหมดของคุณ"
        }
        icon="trendingUp"
        gradient="emerald"
        breadcrumbs={[
          { label: isEn ? "Dashboard" : "แดชบอร์ด", href: "/protected" },
          { label: isEn ? "My Wallet" : "กระเป๋าเงิน" },
        ]}
      />

      {/* 💰 Financial Wealth Overview */}
      <WalletWealthCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* 📜 Payout & Commission History */}
        <WalletHistoryList history={history} />

        {/* 📊 Portfolio Distribution & Performance Stats */}
        <WalletPortfolioStats history={history} />
      </div>
    </div>
  );
}
