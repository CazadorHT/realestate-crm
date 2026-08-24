import { getAgentWalletStatsAction } from "@/features/finance/actions";
import { requireAuthContext } from "@/lib/authz";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { WalletWealthCards } from "@/features/finance/components/WalletWealthCards";
import { WalletHistoryList } from "@/features/finance/components/WalletHistoryList";
import { WalletPortfolioStats } from "@/features/finance/components/WalletPortfolioStats";
import { cookies } from "next/headers";

export default async function AgentWalletPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("crm-language")?.value || cookieStore.get("language")?.value || "th") as "th" | "en";
  const isEn = lang === "en";

  const { user } = await requireAuthContext();
  
  // 💹 Fetch data once for all performance components to optimize DB hits
  const res = await getAgentWalletStatsAction(user.id);
  
  // 🛡️ Safe Data Handing with Type Guards
  const stats = (res.success && res.data) ? res.data.stats : {
    totalEarnings: 0,
    pendingAmount: 0,
    closedDealsCount: 0,
    totalCommissionsCount: 0
  };

  const history = (res.success && res.data) ? res.data.history : [];

  return (
    <div className="p-4 sm:p-8 max-w-screen-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <PageHeader
        title={isEn ? "My Wallet" : "กระเป๋าเงินของฉัน"}
        subtitle={isEn ? "Summary of your total earnings and deal closing performance" : "สรุปยอดรายได้และผลงานการปิดดีลทั้งหมดของคุณ"}
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
        <WalletHistoryList 
            history={history} 
        />
        
        {/* 📊 Portfolio Distribution & Performance Stats */}
        <WalletPortfolioStats 
            history={history} 
        />
      </div>
    </div>
  );
}

