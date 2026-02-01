interface LeadRequirementsCardProps {
  lead: {
    preferred_locations: string[] | null;
    budget_min: number | null;
    budget_max: number | null;
    min_bedrooms: number | null;
    min_bathrooms: number | null;
    min_size_sqm: number | null;
    max_size_sqm: number | null;
    num_occupants: number | null;
    has_pets: boolean | null;
    preferences: unknown;
  };
}

export function LeadRequirementsCard({ lead }: LeadRequirementsCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm space-y-4">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="font-semibold text-base flex items-center gap-2 text-slate-800">
          🎯 ความต้องการ
        </h3>
      </div>
      <div className="p-5">
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between items-start">
            <span className="text-muted-foreground">ทำเลที่สนใจ</span>
            <span className="font-medium text-right max-w-[60%] leading-snug">
              {lead.preferred_locations && lead.preferred_locations.length > 0
                ? lead.preferred_locations.join(", ")
                : "-"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">งบประมาณ</span>
            <span className="font-semibold text-green-600">
              {lead.budget_min || lead.budget_max ? (
                <>
                  {lead.budget_min
                    ? `฿${lead.budget_min.toLocaleString()}`
                    : "0"}
                  {" - "}
                  {lead.budget_max
                    ? `฿${lead.budget_max.toLocaleString()}`
                    : "∞"}
                </>
              ) : (
                "-"
              )}
            </span>
          </div>

          {/* Room Requirements */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-50 p-3 rounded-lg flex flex-col items-center">
              <span className="text-xs text-muted-foreground">
                ห้องนอน (ขั้นต่ำ)
              </span>
              <span className="font-bold text-xl text-slate-800">
                {lead.min_bedrooms ?? "-"}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg flex flex-col items-center">
              <span className="text-xs text-muted-foreground">
                ห้องน้ำ (ขั้นต่ำ)
              </span>
              <span className="font-bold text-xl text-slate-800">
                {lead.min_bathrooms ?? "-"}
              </span>
            </div>
          </div>

          {(lead.min_size_sqm || lead.max_size_sqm) && (
            <div className="flex justify-between items-center pt-1">
              <span className="text-muted-foreground">ขนาดพื้นที่</span>
              <span className="font-medium">
                {lead.min_size_sqm ?? 0} - {lead.max_size_sqm ?? "∞"} ตร.ม.
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pt-6">
            <span className="text-muted-foreground">ผู้พักอาศัย</span>
            <span className="font-medium">
              {lead.num_occupants ? `${lead.num_occupants} คน` : "-"}
            </span>
          </div>

          {/* Preferences */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 ">
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <span className="text-xs text-muted-foreground block mb-1">
                เลี้ยงสัตว์
              </span>
              <span className="font-medium text-sm">
                {lead.has_pets ? "✅ เลี้ยงได้" : "❌ ไม่เลี้ยง"}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <span className="text-xs text-muted-foreground block mb-1">
                สูบบุหรี่
              </span>
              <span className="font-medium text-sm">
                {(lead.preferences as any)?.is_smoker ? "✅ สูบ" : "❌ ไม่สูบ"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
