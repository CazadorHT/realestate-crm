"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// You might want to move these labels to a shared constants file if reused
const LOG_ACTIONS = [
  "property.create",
  "property.update",
  "property.delete",
  "lead.create",
  "lead.update",
  "deal.create",
  "deal.update",
  "auth.login",
];

const LOG_ENTITIES = [
  "properties",
  "leads",
  "deals",
  "owners",
  "users",
  "auth",
];

interface AuditLogFiltersProps {
  users: { id: string; full_name: string | null; email: string | null }[];
}

export function AuditLogFilters({ users }: AuditLogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial State from URL
  const [filters, setFilters] = useState({
    action: searchParams.get("action") || "ALL",
    entity: searchParams.get("entity") || "ALL",
    userId: searchParams.get("userId") || "ALL",
  });

  const [date, setDate] = useState<DateRange | undefined>(() => {
    const start = searchParams.get("startDate");
    const end = searchParams.get("endDate");
    if (start) {
      return {
        from: new Date(start),
        to: end ? new Date(end) : undefined,
      };
    }
    return undefined;
  });

  const applyFilters = (
    newFilters: typeof filters,
    newDate: DateRange | undefined,
  ) => {
    const params = new URLSearchParams();
    if (newFilters.action && newFilters.action !== "ALL")
      params.set("action", newFilters.action);
    if (newFilters.entity && newFilters.entity !== "ALL")
      params.set("entity", newFilters.entity);
    if (newFilters.userId && newFilters.userId !== "ALL")
      params.set("userId", newFilters.userId);

    if (newDate?.from) {
      params.set("startDate", format(newDate.from, "yyyy-MM-dd"));
      if (newDate.to) {
        params.set("endDate", format(newDate.to, "yyyy-MM-dd"));
      }
    }

    // Always reset to page 1 when filtering
    params.set("page", "1");

    router.push(`/protected/admin/audit-logs?${params.toString()}`);
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters, date);
  };

  const handleDateSelect = (newDate: DateRange | undefined) => {
    setDate(newDate);
    if (newDate?.from && newDate?.to) {
      // Only apply if both dates are selected or explicitly just handle 'from' if single date allowed
      // Usually for range picker we wait for 'to' or just apply what we have.
      // Let's apply immediately for responsiveness, but user might be mid-selection.
      // Better to apply when popover closes? For now, let's apply on change to keep simple.
      applyFilters(filters, newDate);
    } else if (!newDate) {
      applyFilters(filters, undefined);
    }
  };

  // Effect to sync URL changes back to state (e.g. browser back button)
  useEffect(() => {
    setFilters({
      action: searchParams.get("action") || "ALL",
      entity: searchParams.get("entity") || "ALL",
      userId: searchParams.get("userId") || "ALL",
    });
    const start = searchParams.get("startDate");
    const end = searchParams.get("endDate");
    if (start) {
      setDate({
        from: new Date(start),
        to: end ? new Date(end) : undefined,
      });
    } else {
      setDate(undefined);
    }
  }, [searchParams]);

  const clearFilters = () => {
    const cleared = {
      action: "ALL",
      entity: "ALL",
      userId: "ALL",
    };
    setFilters(cleared);
    setDate(undefined);
    router.push("/protected/admin/audit-logs");
  };

  const hasActiveFilters =
    filters.action !== "ALL" ||
    filters.entity !== "ALL" ||
    filters.userId !== "ALL" ||
    !!date;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white border rounded-lg shadow-sm mb-6">
      <span className="text-sm font-medium text-muted-foreground mr-2">
        Filter:
      </span>

      {/* Action Filter */}
      <Select
        value={filters.action}
        onValueChange={(val) => handleFilterChange("action", val)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Actions</SelectItem>
          {LOG_ACTIONS.map((action) => (
            <SelectItem key={action} value={action}>
              {action}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Entity Filter */}
      <Select
        value={filters.entity}
        onValueChange={(val) => handleFilterChange("entity", val)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Entity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Entities</SelectItem>
          {LOG_ENTITIES.map((entity) => (
            <SelectItem key={entity} value={entity}>
              {entity}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* User Filter */}
      <Select
        value={filters.userId}
        onValueChange={(val) => handleFilterChange("userId", val)}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="User" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Users</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.full_name || user.email || "Unknown"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Range Picker */}
      <div className="grid gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[260px] justify-start text-left font-normal",
                !date && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd MMM yyyy", { locale: th })} -{" "}
                    {format(date.to, "dd MMM yyyy", { locale: th })}
                  </>
                ) : (
                  format(date.from, "dd MMM yyyy", { locale: th })
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateSelect}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="ml-auto text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
