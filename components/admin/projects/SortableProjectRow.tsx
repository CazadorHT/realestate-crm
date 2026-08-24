"use client";

import * as React from "react";
import { GripVertical, Edit2, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ProjectAdminItem } from "@/features/properties/actions/projects";
import { useLanguage } from "@/lib/i18n/language-context";

interface SortableProjectRowProps {
  project: ProjectAdminItem;
  onEdit: (project: ProjectAdminItem) => void;
  onDelete: (id: string, nameTh: string) => void;
  isDraggingEnabled: boolean;
}

export function SortableProjectRow({
  project,
  onEdit,
  onDelete,
  isDraggingEnabled,
}: SortableProjectRowProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    position: "relative" as const,
  };

  const typeLabelTh = 
    project.property_type === 1 ? "คอนโด" : 
    project.property_type === 2 ? "บ้านเดี่ยว" : 
    project.property_type === 3 ? "ทาวน์โฮม" : 
    project.property_type === 4 ? "ที่ดิน" : 
    project.property_type === 5 ? "อาคารพาณิชย์" : 
    project.property_type === 6 ? "โกดัง" : 
    project.property_type === 7 ? "ออฟฟิศ" : 
    project.property_type === 8 ? "วิลล่า" : 
    project.property_type === 9 ? "พูลวิลล่า" : "อื่นๆ";

  const typeLabelEn = 
    project.property_type === 1 ? "Condo" : 
    project.property_type === 2 ? "House" : 
    project.property_type === 3 ? "Townhome" : 
    project.property_type === 4 ? "Land" : 
    project.property_type === 5 ? "Commercial" : 
    project.property_type === 6 ? "Warehouse" : 
    project.property_type === 7 ? "Office" : 
    project.property_type === 8 ? "Villa" : 
    project.property_type === 9 ? "Pool Villa" : "Other";

  const typeLabel = isEn ? typeLabelEn : typeLabelTh;

  return (
    <tr 
      ref={setNodeRef}
      style={style}
      className={cn(
        "hover:bg-slate-50/50 transition-colors",
        isDragging ? "bg-white shadow-2xl opacity-40 scale-[1.01] pointer-events-none" : ""
      )}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {isDraggingEnabled && (
            <div
              {...attributes}
              {...listeners}
              className="p-2 cursor-grab active:cursor-grabbing text-slate-355 hover:text-indigo-650 transition-colors rounded-lg hover:bg-slate-50 border border-transparent shrink-0"
              title={isEn ? "Drag to reorder" : "ลากเพื่อจัดเรียงลำดับ"}
            >
              <GripVertical className="h-4.5 w-4.5" />
            </div>
          )}
          <div>
            <span className="font-bold text-slate-900 block">
              {isEn ? (project.name.en || project.name.th) : (project.name.en || project.name.th)}
            </span>
            {!isEn && project.name.th && project.name.en && project.name.th !== project.name.en && (
              <span className="text-xs text-slate-400 block">
                {project.name.th}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 w-36">
        <span className={cn(
          "inline-flex w-24 justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
          project.property_type === 1 ? "bg-blue-50 text-blue-700" :
          project.property_type === 2 ? "bg-emerald-50 text-emerald-700" :
          project.property_type === 3 ? "bg-orange-50 text-orange-700" :
          project.property_type === 8 ? "bg-rose-50 text-rose-700" :
          project.property_type === 9 ? "bg-cyan-50 text-cyan-700" :
          "bg-slate-150 text-slate-700"
        )}>
          {typeLabel}
        </span>
      </td>
      <td className="px-6 py-4">
        <code className="text-xs bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-mono">
          {project.slug}
        </code>
      </td>
      <td className="px-6 py-4">
        <span className="font-medium text-slate-600">{project.developer || "-"}</span>
      </td>
      <td className="px-6 py-4 text-center whitespace-nowrap">
        <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md text-xs whitespace-nowrap inline-block">
          {project.property_count || 0} {isEn ? "Units" : "ทรัพย์"}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(project)}
            className="h-8.5 rounded-lg border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5 mr-1.5" />
            {isEn ? "Edit" : "แก้ไข"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(project.id!, isEn ? (project.name.en || project.name.th) : project.name.th)}
            className="h-8.5 w-8.5 p-0 rounded-lg border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 cursor-pointer"
            title={isEn ? "Delete project" : "ลบโครงการ"}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {project.is_active && (
            <a
              href={`/projects/${project.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-8.5 w-8.5 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-slate-50 transition-colors"
              title={isEn ? "View live public page" : "เปิดดูหน้าเว็บจริง"}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}

