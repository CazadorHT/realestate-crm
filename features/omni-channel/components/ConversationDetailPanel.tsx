"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Plus, 
  Tag as TagIcon, 
  UserCheck, 
  FileText, 
  Info, 
  Trash2, 
  Loader2, 
  Edit3, 
  Check,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { AvatarImageWithFallback } from "./AvatarImageWithFallback";
import { 
  updateLeadTagsAction, 
  updateLeadAssigneeAction, 
  addLeadInternalNoteAction, 
  deleteLeadInternalNoteAction, 
  getTenantStaffListAction 
} from "../actions";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { formatDistanceToNow } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ConversationDetailPanelProps {
  lead: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const PRESET_TAGS = [
  "คอนโด (Condo)",
  "บ้านเดี่ยว (House)",
  "งบ 5-10M",
  "งบ < 5M",
  "สุขุมวิท (Sukhumvit)",
  "ใกล้ BTS/MRT",
  "Hot Lead 🔥",
  "รอนัดดูห้อง",
  "รอส่งเอกสาร",
  "ปิดการขายแล้ว",
];

export function ConversationDetailPanel({
  lead,
  isOpen,
  onClose,
  onUpdate,
}: ConversationDetailPanelProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const dateLocale = isEn ? enUS : th;

  const preferences = (lead.preferences as any) || {};
  const [tags, setTags] = useState<string[]>(preferences.tags || []);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [isUpdatingTags, setIsUpdatingTags] = useState(false);

  // Staff and Assignee
  const [staffList, setStaffList] = useState<any[]>([]);
  const [assignedTo, setAssignedTo] = useState<string | null>(lead.assigned_to || null);
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false);

  // Internal Notes
  const [internalNotes, setInternalNotes] = useState<any[]>(
    Array.isArray(preferences.internal_notes) ? preferences.internal_notes : []
  );
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Sync state when lead changes
  useEffect(() => {
    const prefs = (lead.preferences as any) || {};
    setTags(prefs.tags || []);
    setAssignedTo(lead.assigned_to || null);
    setInternalNotes(Array.isArray(prefs.internal_notes) ? prefs.internal_notes : []);
    setIsAddingTag(false);
    setIsAddingNote(false);
    setNewTagInput("");
    setNoteInput("");
  }, [lead]);

  // Load staff list
  useEffect(() => {
    if (isOpen) {
      getTenantStaffListAction().then((res) => {
        if (res.success && res.data) {
          setStaffList(res.data);
        }
      });
    }
  }, [isOpen]);

  const handleAddTag = async (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed || tags.includes(trimmed)) return;

    const newTags = [...tags, trimmed];
    setTags(newTags);
    setNewTagInput("");
    setIsAddingTag(false);

    setIsUpdatingTags(true);
    try {
      const res = await updateLeadTagsAction(lead.id, newTags);
      if (res.success) {
        toast.success(isEn ? "Tag added" : "เพิ่มแท็กเรียบร้อย");
        onUpdate?.();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error((isEn ? "Failed to save tag: " : "บันทึกแท็กไม่สำเร็จ: ") + err.message);
      setTags(tags);
    } finally {
      setIsUpdatingTags(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const newTags = tags.filter((t) => t !== tagToRemove);
    setTags(newTags);

    setIsUpdatingTags(true);
    try {
      const res = await updateLeadTagsAction(lead.id, newTags);
      if (res.success) {
        toast.success(isEn ? "Tag removed" : "ลบแท็กเรียบร้อย");
        onUpdate?.();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error((isEn ? "Failed to remove tag: " : "ลบแท็กไม่สำเร็จ: ") + err.message);
      setTags(tags);
    } finally {
      setIsUpdatingTags(false);
    }
  };

  const handleAssigneeChange = async (member: any | null) => {
    const newId = member ? member.identityId : null;
    setAssignedTo(newId);

    setIsUpdatingAssignee(true);
    try {
      const res = await updateLeadAssigneeAction(lead.id, newId);
      if (res.success) {
        toast.success(
          isEn 
            ? `Assigned to ${member ? member.name : "Unassigned"}` 
            : `มอบหมายให้ ${member ? member.name : "ไม่ระบุ"} เรียบร้อย`
        );
        onUpdate?.();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error((isEn ? "Failed to update assignee: " : "เปลี่ยนผู้รับผิดชอบไม่สำเร็จ: ") + err.message);
    } finally {
      setIsUpdatingAssignee(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim() || isSubmittingNote) return;

    setIsSubmittingNote(true);
    try {
      const res = await addLeadInternalNoteAction(lead.id, noteInput.trim());
      if (res.success && res.data) {
        setInternalNotes([res.data, ...internalNotes]);
        setNoteInput("");
        setIsAddingNote(false);
        toast.success(isEn ? "Internal note added" : "เพิ่มโน้ตภายในเรียบร้อย");
        onUpdate?.();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error((isEn ? "Failed to add note: " : "เพิ่มโน้ตไม่สำเร็จ: ") + err.message);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const updated = internalNotes.filter((n) => n.id !== noteId);
    setInternalNotes(updated);

    try {
      const res = await deleteLeadInternalNoteAction(lead.id, noteId);
      if (res.success) {
        toast.success(isEn ? "Note deleted" : "ลบโน้ตเรียบร้อย");
        onUpdate?.();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error((isEn ? "Failed to delete note: " : "ลบโน้ตไม่สำเร็จ: ") + err.message);
      setInternalNotes(internalNotes);
    }
  };

  const currentAssignee = staffList.find((s) => s.identityId === assignedTo);

  if (!isOpen) return null;

  return (
    <div className="w-80 sm:w-96 border-l border-slate-200 bg-white flex flex-col h-full min-h-0 shrink-0 shadow-lg z-20 transition-all duration-300 animate-in slide-in-from-right-5 overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
            {isEn ? "Customer Details & Notes" : "ข้อมูลลูกค้า & โน้ตภายใน"}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          title={isEn ? "Close panel" : "ปิดแถบข้าง"}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 h-0 min-h-0 overflow-y-auto p-4 space-y-4">
        {/* Profile Card */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="relative h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden shadow-inner text-slate-400 shrink-0">
            <AvatarImageWithFallback
              src={lead.avatar_url}
              alt={lead.full_name || "Avatar"}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm text-slate-900 truncate">
              {lead.full_name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {lead.source}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-medium text-slate-500">
                {(lead.preferences as any)?.category || "CUSTOMER"}
              </span>
            </div>
          </div>
        </div>

        {/* Tags Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5 text-blue-500" />
              {isEn ? "Tags" : "แท็ก"}
            </label>
            <button
              onClick={() => setIsAddingTag(!isAddingTag)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              {isEn ? "Add Tag" : "ใส่แท็ก"}
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            {isEn ? "Use tags to organize and categorize chats" : "ใช้แท็กในการแบ่งประเภทห้องแชท"}
          </p>

          {/* Active Tags */}
          <div className="flex flex-wrap gap-1.5">
            {tags.length === 0 && !isAddingTag && (
              <span className="text-xs text-slate-300 italic">
                {isEn ? "No tags added yet" : "ยังไม่มีแท็ก"}
              </span>
            )}
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/60 transition-all hover:bg-slate-200"
              >
                #{tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  disabled={isUpdatingTags}
                  className="hover:text-red-500 p-0.5 rounded-full cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>

          {/* Add Tag Input / Presets */}
          {isAddingTag && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 animate-in slide-in-from-top-2">
              <div className="flex gap-1.5">
                <Input
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder={isEn ? "Type tag name..." : "พิมพ์ชื่อแท็ก..."}
                  className="h-8 text-xs bg-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(newTagInput);
                    }
                  }}
                />
                <Button
                  onClick={() => handleAddTag(newTagInput)}
                  size="sm"
                  className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  {isEn ? "Add" : "เพิ่ม"}
                </Button>
              </div>

              {/* Presets */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isEn ? "Suggested Tags:" : "แท็กแนะนำ:"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {PRESET_TAGS.filter((t) => !tags.includes(t)).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleAddTag(preset)}
                      className="px-2 py-0.5 rounded bg-white hover:bg-blue-50 hover:text-blue-600 border border-slate-200 text-[10px] font-medium text-slate-600 transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Assigned Agent Section */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
            {isEn ? "Assigned Agent" : "ผู้รับผิดชอบ"}
          </label>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50/50 hover:bg-white flex items-center justify-between transition-all cursor-pointer">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
                    {currentAssignee?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentAssignee.avatarUrl}
                        alt={currentAssignee.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      currentAssignee?.name?.slice(0, 1) || "?"
                    )}
                  </div>
                  <span className="font-bold text-xs text-slate-800 truncate">
                    {currentAssignee ? currentAssignee.name : (isEn ? "Unassigned" : "ยังไม่ได้กำหนด")}
                  </span>
                </div>
                <Edit3 className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1 rounded-xl shadow-xl border-slate-100">
              <DropdownMenuItem
                onClick={() => handleAssigneeChange(null)}
                className="rounded-lg py-2 text-xs font-medium cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mr-2 text-slate-400 text-xs">
                  -
                </div>
                <span className="flex-1">{isEn ? "Unassigned" : "ไม่ระบุผู้รับผิดชอบ"}</span>
                {!assignedTo && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </DropdownMenuItem>
              {staffList.map((staff) => (
                <DropdownMenuItem
                  key={staff.identityId}
                  onClick={() => handleAssigneeChange(staff)}
                  className="rounded-lg py-2 text-xs font-medium cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center mr-2 text-blue-700 text-[10px] font-bold">
                    {staff.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={staff.avatarUrl} alt={staff.name} className="w-full h-full object-cover" />
                    ) : (
                      staff.name?.slice(0, 1)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{staff.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{staff.role}</p>
                  </div>
                  {assignedTo === staff.identityId && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Internal Staff Notes Section */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              {isEn ? `Internal Notes (${internalNotes.length})` : `โน้ตภายใน (${internalNotes.length})`}
            </label>
            <button
              onClick={() => setIsAddingNote(!isAddingNote)}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              {isEn ? "Add Note" : "เพิ่มโน้ต"}
            </button>
          </div>

          {/* Privacy Disclaimer Banner */}
          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed flex gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{isEn ? "Private Staff Notes" : "บันทึกบทสนทนากับผู้ใช้"}</p>
              <p className="text-[10px] text-amber-800/80 mt-0.5">
                {isEn 
                  ? "Notes are visible ONLY to team members. The customer will NEVER see these notes." 
                  : "เพิ่มข้อมูลและโน้ตสำหรับส่งต่องานให้เพื่อนร่วมงาน โดยลูกค้าจะไม่เห็นเนื้อหานี้"}
              </p>
            </div>
          </div>

          {/* Add Note Form */}
          {isAddingNote && (
            <form onSubmit={handleAddNote} className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-in slide-in-from-top-2">
              <Textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder={isEn ? "Write private staff note..." : "เขียนโน้ตช่วยจำ / ส่งต่องาน..."}
                className="text-xs bg-white min-h-[70px] resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setIsAddingNote(false)}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs font-semibold cursor-pointer"
                >
                  {isEn ? "Cancel" : "ยกเลิก"}
                </Button>
                <Button
                  type="submit"
                  disabled={!noteInput.trim() || isSubmittingNote}
                  size="sm"
                  className="h-7 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                >
                  {isSubmittingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : (isEn ? "Save Note" : "บันทึกโน้ต")}
                </Button>
              </div>
            </form>
          )}

          {/* Notes List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {internalNotes.length === 0 && !isAddingNote ? (
              <div className="py-6 text-center text-slate-400 space-y-1">
                <p className="text-xs font-medium">{isEn ? "No internal notes yet" : "ยังไม่มีโน้ตภายใน"}</p>
              </div>
            ) : (
              internalNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 relative group"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span className="font-bold text-slate-600">
                      👤 {note.author_name || "Agent"}
                    </span>
                    <span>
                      {note.created_at
                        ? formatDistanceToNow(new Date(note.created_at), {
                            addSuffix: true,
                            locale: dateLocale,
                          })
                        : ""}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-all cursor-pointer"
                    title={isEn ? "Delete note" : "ลบโน้ต"}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
