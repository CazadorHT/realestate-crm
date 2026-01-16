"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Phone, Mail, DollarSign } from "lucide-react";
import { LEAD_STAGES } from "@/lib/validations/lead";
import { LEAD_STAGE_LABELS } from "./labels";
import type { LeadRow } from "./types";
import { updateLeadStageAction } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface KanbanProps {
  initialLeads: LeadRow[];
}

export function LeadsKanban({ initialLeads }: KanbanProps) {
  const [leads, setLeads] = React.useState<LeadRow[]>(initialLeads);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns = LEAD_STAGES;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeLead = leads.find((l) => l.id === activeId);
    if (!activeLead) return;

    // Check if we are over a column or another card
    const isOverAColumn = LEAD_STAGES.includes(overId as any);
    const isOverACard = leads.some((l) => l.id === overId);

    let newStage: string | undefined;

    if (isOverAColumn) {
      newStage = overId;
    } else if (isOverACard) {
      const overLead = leads.find((l) => l.id === overId);
      if (overLead) newStage = overLead.stage;
    }

    if (newStage && activeLead.stage !== newStage) {
      setLeads((prev) => {
        return prev.map((l) => {
          if (l.id === activeId) {
            return { ...l, stage: newStage as any };
          }
          return l;
        });
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeLead = leads.find((l) => l.id === activeId);
    if (!activeLead) return;

    // The stage might have already been updated by onDragOver
    // But we need to ensure it's finalized and persisted
    const currentLeadInState = leads.find((l) => l.id === activeId);
    if (!currentLeadInState) return;

    const newStage = currentLeadInState.stage;
    const originalLead = initialLeads.find((l) => l.id === activeId);

    if (originalLead && originalLead.stage !== newStage) {
      try {
        const result = await updateLeadStageAction(activeId, newStage);
        if (!result.success) {
          toast.error(result.message || "Failed to update stage");
          setLeads(initialLeads); // Rollback
        } else {
          toast.success(
            `อัปเดตสถานะเป็น ${
              LEAD_STAGE_LABELS[newStage as keyof typeof LEAD_STAGE_LABELS]
            }`
          );
        }
      } catch (error) {
        toast.error("An error occurred");
        setLeads(initialLeads);
      }
    }
  };

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-6 h-[calc(100vh-250px)]">
        {columns.map((stage) => (
          <KanbanColumn
            key={stage}
            id={stage}
            title={LEAD_STAGE_LABELS[stage]}
            leads={leads.filter((l) => l.stage === stage)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  id,
  title,
  leads,
}: {
  id: string;
  title: string;
  leads: LeadRow[];
}) {
  const { setNodeRef } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col bg-slate-100/50 dark:bg-slate-900/50 rounded-xl w-80 min-w-80 border overflow-hidden"
    >
      <div className="p-4 border-b bg-white dark:bg-slate-950 flex items-center justify-between sticky top-0 z-10">
        <h3 className="font-bold flex items-center gap-2">
          {title}
          <Badge
            variant="secondary"
            className="ml-2 bg-slate-200 dark:bg-slate-800"
          >
            {leads.length}
          </Badge>
        </h3>
      </div>

      <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[200px]">
        <SortableContext
          id={id}
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.map((lead) => (
            <SortableLeadCard key={lead.id} lead={lead} />
          ))}
          {leads.length === 0 && (
            <div className="h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground text-xs italic gap-2 bg-white/30 dark:bg-black/20">
              <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                <UserCircle className="h-5 w-5 opacity-20" />
              </div>
              ไม่มีรายการในขั้นนี้
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

function SortableLeadCard({ lead }: { lead: LeadRow }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} />
    </div>
  );
}

function LeadCard({ lead, isOverlay }: { lead: LeadRow; isOverlay?: boolean }) {
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    // If it's a drag event, listeners will handle it.
    // This is basically a fallback for mobile or quick clicks.
    // But since we use listeners on the card, we might need a separate click area or just handle click vs drag.
  };

  return (
    <Card
      className={`group hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing shadow-sm ${
        isOverlay ? "border-primary shadow-xl rotate-3" : ""
      }`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm line-clamp-1">
              {lead.full_name}
            </span>
          </div>
          <button
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking the view button
            onClick={() => router.push(`/protected/leads/${lead.id}`)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded transition-all"
            title="ดูรายละเอียด"
          >
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-1 cursor-pointer"
            >
              View
            </Badge>
          </button>
        </div>

        <div className="space-y-1.5">
          {lead.phone && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Phone className="h-3 w-3" />
              <span>{lead.phone}</span>
            </div>
          )}

          {(lead.budget_min || lead.budget_max) && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs font-medium">
              <DollarSign className="h-3 w-3" />
              <span>
                {lead.budget_min?.toLocaleString()}
                {lead.budget_max
                  ? ` - ${lead.budget_max.toLocaleString()}`
                  : ""}
              </span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t flex justify-between items-center text-[10px] text-muted-foreground">
          <span>{new Date(lead.created_at).toLocaleDateString("th-TH")}</span>
          {lead.lead_type && (
            <Badge
              variant="secondary"
              className="text-[9px] uppercase font-bold py-0 h-4"
            >
              {lead.lead_type}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
