"use client";

import { Filter, X, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PropertyCombobox } from "@/components/PropertyCombobox";
import { LeadCombobox } from "./LeadCombobox";

interface DealsFiltersProps {
  q: string;
  setQ: (v: string) => void;
  selectedPropertyId?: string;
  setSelectedPropertyId: (v?: string) => void;
  selectedLeadId?: string;
  setSelectedLeadId: (v?: string) => void;
  hasActiveFilters: boolean;
  onFilterChange: () => void;
}

export function DealsFilters({
  q,
  setQ,
  selectedPropertyId,
  setSelectedPropertyId,
  selectedLeadId,
  setSelectedLeadId,
  hasActiveFilters,
  onFilterChange,
}: DealsFiltersProps) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-slate-600" />
        <h3 className="text-sm font-semibold text-slate-700">ตัวกรอง</h3>
        {hasActiveFilters && (
          <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
            {[selectedPropertyId, selectedLeadId, q].filter(Boolean).length}{" "}
            active
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <PropertyCombobox
              value={selectedPropertyId ?? null}
              onChange={(id) => {
                setSelectedPropertyId(id ?? undefined);
                onFilterChange();
              }}
              placeholder="เลือกทรัพย์..."
            />
          </div>
          {selectedPropertyId && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSelectedPropertyId(undefined)}
              className="h-10 w-10 hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <LeadCombobox
              value={selectedLeadId ?? null}
              onChange={(id) => {
                setSelectedLeadId(id ?? undefined);
                onFilterChange();
              }}
              placeholder="เลือกลีด..."
            />
          </div>
          {selectedLeadId && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSelectedLeadId(undefined)}
              className="h-10 w-10 hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="ค้นหา..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10"
          />
          {q && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setQ("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
