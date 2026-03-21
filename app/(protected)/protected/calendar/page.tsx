import { requireAuthContext } from "@/lib/authz";
import {
  getCalendarEvents,
  getCompactProperties,
  getCompactLeads,
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

export const metadata = {
  title: "Calendar | CRM",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; propertyId?: string; mode?: string }>;
}) {
  // 1. Auth Check (Protect Route)
  const { supabase, tenantId } = await requireAuthContext();
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

  if (params.month) {
    const [year, month] = params.month.split("-").map(Number);
    if (!isNaN(year) && !isNaN(month)) {
      currentMonth = new Date(year, month - 1, 1);
    }
  }

  // 3. Calculate Query Range
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  let queryStart = startOfWeek(monthStart);
  let queryEnd = endOfWeek(monthEnd);

  // 4. Fetch Events, Properties, and Leads
  const [events, properties, leads] = await Promise.all([
    getCalendarEvents(queryStart, queryEnd, propertyId),
    getCompactProperties(),
    getCompactLeads(),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <CalendarDays className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
              {isMultiTenant && (
                <Badge variant="outline" className="gap-1.5 py-1 px-3 border-indigo-200 bg-indigo-50/50 text-indigo-700">
                  <Building2 className="h-3.5 w-3.5" />
                  {currentTenantName || "ทุกสาขา"}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              ตารางนัดหมาย สัญญาเช่า และดีลสำคัญ
            </p>
          </div>
        </div>

        {/* Add Appointment Button */}
        <CreateEventDialog leads={leads} properties={properties} />
      </div>

      <CalendarView
        initialDate={currentMonth}
        events={events}
        properties={properties}
      />
    </div>
  );
}
