"use client";

import React, { useState, useEffect } from "react";
import { 
    getTeamsAction, 
    getTeamManagementStatsAction,
    TeamWithManager 
} from "@/features/teams/actions/teamActions";
import { getAllProfilesAction } from "@/lib/actions/tenant-management";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { TeamStatsDashboard } from "@/components/settings/teams/TeamStatsDashboard";
import { TeamDialogOrchestrator } from "@/components/settings/teams/TeamDialogOrchestrator";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";

/**
 * 🦴 Elite Skeleton
 */
function TeamsPageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-[32px]" />
        ))}
      </div>
      <div className="h-[600px] bg-white/50 border border-slate-200 rounded-[32px]" />
    </div>
  );
}

export default function TeamsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [teams, setTeams] = useState<TeamWithManager[]>([]);
  const [stats, setStats] = useState({ totalTeams: 0, totalAgents: 0, totalLeads: 0 });
  const [potentialManagers, setPotentialManagers] = useState<any[]>([]);
  const [fetchedWithError, setFetchedWithError] = useState(false);

  // Orchestrator Action Trigger (passed down to components)
  const [triggerCreate, setTriggerCreate] = useState(0);

  const fetchData = async () => {
    setIsLoading(true);
    setFetchedWithError(false);
    try {
      const [tRes, sRes, pRes] = await Promise.all([
        getTeamsAction(),
        getTeamManagementStatsAction(),
        getAllProfilesAction()
      ]);

      if (tRes.success) {
        setTeams(tRes.data || []);
      } else {
        setFetchedWithError(true);
        toast.error(tRes.message || "ไม่สามารถโหลดข้อมูลรายชื่อทีมได้");
      }
      
      if (sRes.data) {
        setStats(sRes.data);
      }
      
      if (pRes.data) {
          // Filter potential managers (ADMIN or MANAGER roles)
          const filtered = (pRes.data || []).filter((p: any) => 
            p.role === "ADMIN" || p.role === "MANAGER"
          );
          setPotentialManagers(filtered);
      }
    } catch (err) {
      setFetchedWithError(true);
      toast.error("ไม่สามารถเชื่อมต่อระบบทีมได้");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/30">
      <SettingsHeader 
        title="จัดการสายงานและทีม (Teams)"
        description="บริหารจัดการโครงสร้างทีมและมอบหมายหัวหน้าทีมเพื่อควบคุมการทำงาน"
        subPath={[
          { label: "System Control", href: "/protected/settings" },
          { label: "โครงสร้างองค์กร", href: "/protected/settings/branches" },
          { label: "จัดการทีม" }
        ]}
        actions={
          <Button 
            onClick={() => window.dispatchEvent(new CustomEvent("trigger-create-team"))}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-11 px-6 font-semibold uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95"
          >
            <Plus className="h-5 w-5 mr-2" />
            สร้างทีมใหม่
          </Button>
        }
      />

      {isLoading ? (
        <TeamsPageSkeleton />
      ) : (
        <div className="p-8 pt-4 space-y-10">
          <TeamStatsDashboard stats={stats} />
          
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 tracking-tight">รายชื่อทีมปฏิบัติการ</h2>
            </div>

            <TeamDialogOrchestrator 
              initialTeams={teams}
              potentialManagers={potentialManagers}
              fetchedWithError={fetchedWithError}
            />
          </div>
        </div>
      )}
    </div>
  );
}
