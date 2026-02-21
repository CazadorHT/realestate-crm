import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { getTeamsAction } from "@/features/teams/actions/teamActions";
import { createClient } from "@/lib/supabase/server";
import { Users, Shield, UserCheck, Briefcase } from "lucide-react";
import { TeamsTable } from "@/features/teams/components/TeamsTable";

export default async function TeamsPage() {
  const currentProfile = await getCurrentProfile();

  if (currentProfile?.role !== "ADMIN") {
    return redirect("/protected");
  }

  const result = await getTeamsAction();
  const teams = result.success ? result.data || [] : [];

  // ดึงข้อมูลรายชื่อที่เป็นไปได้สำหรับ Manager (Admin หรือ Manager)
  const supabase = await createClient();
  const { data: potentialManagers } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("role", ["ADMIN", "MANAGER"]);

  // สถิติรวม
  const totalAgentsCount = teams.reduce(
    (acc, team) => acc + (team.agent_count || 0),
    0,
  );

  const { count: totalLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-100 rounded-xl shadow-sm ring-1 ring-indigo-200">
            <Users className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              จัดการทีม (Teams Management)
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              สร้างและมอบหมายหัวหน้าทีมเพื่อดูแลข้อมูลตามสายงาน
            </p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            จำนวนทีมทั้งหมด
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {teams.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            เอเจนท์ทั้งหมด (Agents)
          </p>
          <div className="flex items-center gap-2 mt-1">
            <UserCheck className="h-5 w-5 text-indigo-500" />
            <p className="text-3xl font-bold text-slate-900">
              {totalAgentsCount}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            Lead ทั้งหมดในระบบ
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Briefcase className="h-5 w-5 text-indigo-500" />
            <p className="text-3xl font-bold text-slate-900">
              {totalLeads || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Teams List */}
      <TeamsTable teams={teams} potentialManagers={potentialManagers || []} />
    </div>
  );
}
