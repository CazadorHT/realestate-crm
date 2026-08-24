import { getAgentWalletStatsAction } from "@/features/finance/actions";
import { requireAuthContext } from "@/lib/authz";
import { WalletPageView } from "@/features/finance/components/WalletPageView";

export default async function AgentWalletPage() {
  const { user } = await requireAuthContext();
  
  // 💹 Fetch data once for all performance components to optimize DB hits
  const res = await getAgentWalletStatsAction(user.id);
  
  // 🛡️ Safe Data Handling with Type Guards
  const stats = (res.success && res.data) ? res.data.stats : {
    totalEarnings: 0,
    pendingAmount: 0,
    closedDealsCount: 0,
    totalCommissionsCount: 0
  };

  const history = (res.success && res.data) ? res.data.history : [];

  return (
    <WalletPageView stats={stats} history={history} />
  );
}


