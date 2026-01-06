import { GlobalSearch } from "@/components/dashboard/GlobalSearch";

interface DashboardHeaderProps {
  email?: string;
}

export function DashboardHeader({ email }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          สวัสดี, {email} 👋
        </h2>
        <p className="text-muted-foreground">
          Sales Cockpit Update: ศูนย์บริหารงานขายอสังหาฯ ของคุณ
        </p>
      </div>
      <GlobalSearch />
    </div>
  );
}
