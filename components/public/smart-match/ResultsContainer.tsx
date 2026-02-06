"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PropertyMatch, SearchPurpose } from "@/features/smart-match/types";
import { ResultCard } from "./ResultCard";
import { LeadForm } from "./LeadForm";

interface ResultsContainerProps {
  matches: PropertyMatch[];
  sessionId: string;
  purpose: SearchPurpose;
  onReset: () => void;
}

export function ResultsContainer({
  matches,
  sessionId,
  purpose,
  onReset,
}: ResultsContainerProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<PropertyMatch | null>(
    null,
  );

  if (matches.length === 0) {
    return (
      <div className="text-center py-12 flex-1 flex flex-col justify-center ">
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          ไม่พบทรัพย์สินที่ตรงเป๊ะ
        </h3>
        <p className="text-slate-600 mb-6">
          ลองปรับงบประมาณหรือทำเลใหม่อีกครั้ง
        </p>
        <Button onClick={onReset} variant="outline">
          ค้นหาใหม่
        </Button>
      </div>
    );
  }

  if (showForm && selectedMatch) {
    return (
      <LeadForm
        match={selectedMatch}
        sessionId={sessionId}
        isRent={purpose === "RENT"}
        onBack={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 flex-1 flex flex-col min-h-0">
      <div className="bg-green-50 text-green-700 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 border border-green-200 shrink-0">
        <span className="text-lg">🏆</span>
        พบ {matches.length} ทรัพย์สินที่เหมาะกับคุณ
      </div>

      <div className="overflow-y-auto pr-2 flex-1 custom-scrollbar mb-4">
        <div className="space-y-6 pb-2">
          {matches.map((match) => (
            <ResultCard
              key={match.id}
              match={match}
              isRent={purpose === "RENT"}
              onSelect={() => {
                setSelectedMatch(match);
                setShowForm(true);
              }}
            />
          ))}
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full mt-auto text-sm text-slate-500 hover:text-blue-600 transition-colors shrink-0 pt-4"
      >
        ← ค้นหาใหม่อีกครั้ง
      </button>
    </div>
  );
}
