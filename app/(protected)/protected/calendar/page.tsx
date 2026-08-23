import { requireAuthContext } from "@/lib/authz";
import {
  getCalendarEvents,
  getCompactProperties,
  getCompactLeads,
  getCalendarAgents,
} from "@/features/calendar/queries";
import { CalendarView } from "@/features/calendar/components/CalendarView";
import { CreateEventDialog } from "@/features/calendar/components/CreateEventDialog";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
} from "date-fns";
import { CalendarDays, Building2 } from "lucide-react";
import { getSystemConfig } from "@/lib/actions/system-config";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Metadata } from "next";
import { CalendarTour } from "@/features/calendar/_components/CalendarTour";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Calendar | CRM",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; propertyId?: string; leadId?: string; agentId?: string; mode?: string }>;
}) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value || "th") as "th" | "en";
  const isEn = lang === "en";

  // 1. Auth Check (Protect Route)
  const { supabase, tenantId, role, user } = await requireAuthContext();
  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  let currentTenantName = null;
  if (isMultiTenant && tenantId && tenantId !== "ALL") {
    const { data: tenantData } = await supabase
      .from("tenants")
      .select("name")
      .eq("id", tenantId)
      .single();
    currentTenantName = tenantData?.name;
  }

  // 2. Parse Date & Params
  const params = await searchParams;
  const now = new Date();
  let currentMonth = now;
  const propertyId = params.propertyId;
  const leadId = params.leadId;
  const agentId = params.agentId;

  if (params.month) {
    const [year, month] = params.month.split("-").map(Number);
    if (!isNaN(year) && !isNaN(month)) {
      currentMonth = new Date(year, month - 1, 1);
    }
  }

  // 3. Calculate Query Range (Fetch results for the entire year to support month picker counts)
  const yearStart = startOfYear(currentMonth);
  const yearEnd = endOfYear(currentMonth);
  let queryStart = startOfWeek(yearStart, { weekStartsOn: 1 });
  let queryEnd = endOfWeek(yearEnd, { weekStartsOn: 1 });

  // 4. Fetch Events, Properties, Leads, and Agents (if Admin)
  const [events, properties, leads, agents] = await Promise.all([
    getCalendarEvents(queryStart, queryEnd, propertyId, leadId, agentId),
    getCompactProperties(),
    getCompactLeads(),
    role === "ADMIN" ? getCalendarAgents() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <CalendarTour />
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <span>{isEn ? "Calendar" : "ปฏิทินกิจกรรม"}</span>
            {isMultiTenant && (
              <Badge variant="outline" className="gap-1.5 py-1 px-3 border-indigo-200 bg-indigo-50/50 text-indigo-700">
                <Building2 className="h-3.5 w-3.5" />
                {currentTenantName || (isEn ? "All Branches" : "ทุกสาขา")}
              </Badge>
            )}
          </div>
        }
        subtitle={isEn ? "Schedule appointments, rental leases, and key deals" : "ตารางนัดหมาย สัญญาเช่า และดีลสำคัญ"}
        icon="calendarDays"
        gradient="purple"
        actionSlot={
          <CreateEventDialog leads={leads} properties={properties} events={events} />
        }
      />


      <CalendarView
        initialDate={currentMonth}
        events={events}
        properties={properties}
        leads={leads}
        agents={agents}
        currentUserId={user.id}
        isAdmin={role === "ADMIN"}
      />
    </div>
  );
}
