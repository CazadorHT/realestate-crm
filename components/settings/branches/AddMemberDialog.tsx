"use client";

import { useState } from "react";
import { UserPlus, Mail, Key, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog, DialogClose, DrawerClose } from "@/components/ui/responsive-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ChevronDown, CheckCircle2, Shield, User as UserIcon, Eye } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

interface StaffIdentity {
  id: string;
  full_name: string | null;
  display_name: string | null;
  nickname: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
}

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allProfiles: StaffIdentity[];
  currentMembers: Array<{ identity_id: string }>;
  branchName: string;
  onAdd: (data: { email: string; role: string }, isExisting: boolean) => Promise<void>;
}

export function AddMemberDialog({
  open,
  onOpenChange,
  allProfiles,
  currentMembers,
  branchName,
  onAdd,
}: AddMemberDialogProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [newMember, setNewMember] = useState({ email: "", role: "AGENT" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedProfileRole, setSelectedProfileRole] = useState<string | null>(null);
  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const isMobile = useIsMobile();

  const isDirty = newMember.email !== "" || searchQuery !== "";

  const availableProfiles = allProfiles.filter(
    (p) => !currentMembers.some((m) => m.identity_id === p.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    
    // Determine if we are adding an existing profile or inviting a new one
    const isExisting = availableProfiles.some(p => p.email === newMember.email);
    
    await onAdd(newMember, isExisting);
    
    setIsAdding(false);
    setNewMember({ email: "", role: "AGENT" });
    setSearchQuery("");
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      confirmOnClose={isDirty}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <UserPlus size={20} className="text-indigo-600" />
          </div>
          <span>{isEn ? "Add Member" : "เพิ่มพนักงาน"}</span>
        </div>
      }
      description={isEn ? `Add existing system staff to ${branchName}` : `ดึงพนักงานที่มีในระบบอยู่แล้วเข้าสู่สาขา ${branchName}`}
      footer={
        <div className="flex flex-row sm:flex-row gap-3 w-full">
          {isMobile ? (
            <DrawerClose asChild>
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl h-12 text-slate-500 hover:bg-white flex-1"
              >
                {isEn ? "Cancel" : "ยกเลิก"}
              </Button>
            </DrawerClose>
          ) : (
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl h-12 text-slate-500 hover:bg-white flex-1"
              >
                {isEn ? "Cancel" : "ยกเลิก"}
              </Button>
            </DialogClose>
          )}
          <Button
            form="add-member-form"
            type="submit"
            disabled={isAdding}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 px-8 shadow-lg shadow-slate-200 transition-all active:scale-95 flex-2"
          >
            {isAdding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Key className="mr-2 h-4 w-4" />
            )}
            {isEn ? "Add Member" : "เพิ่มพนักงาน"}
          </Button>
        </div>
      }
    >
      <form id="add-member-form" onSubmit={handleSubmit} className="p-6">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="user-select" className="text-sm font-semibold text-slate-700 px-1">
              {isEn ? "Select from Staff Directory" : "เลือกจากรายชื่อ"}
            </Label>
            <ResponsiveDialog
              open={isMemberPickerOpen}
              onOpenChange={setIsMemberPickerOpen}
              title={isEn ? "Select Staff" : "เลือกพนักงาน"}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between h-14 rounded-2xl border-slate-200 focus:ring-indigo-600 transition-all shadow-sm bg-slate-50/50 px-4 font-normal text-slate-500"
                >
                  <div className="flex items-center gap-3">
                    {newMember.email ? (
                      <>
                        <Avatar className="h-8 w-8 border border-slate-200 shadow-sm">
                          <AvatarImage
                            src={
                              availableProfiles.find(
                                (p) => p.email === newMember.email
                              )?.avatar_url || undefined
                            }
                          />
                          <AvatarFallback className="text-[10px] bg-slate-100 text-slate-400 font-bold">
                            {
                              availableProfiles.find(
                                (p) => p.email === newMember.email
                              )?.full_name?.[0]
                            }
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-bold text-slate-900">
                          {(() => {
                            const p = availableProfiles.find(p => p.email === newMember.email);
                            return p ? (p.nickname ? `${p.display_name || p.full_name} (${p.nickname})` : (p.display_name || p.full_name)) : "";
                          })()}
                        </span>
                      </>
                    ) : (
                      <>
                        <Search size={18} className="text-slate-400" />
                        <span>{isEn ? "Search or select staff member..." : "ค้นหาหรือเลือกพนักงาน..."}</span>
                      </>
                    )}
                  </div>
                  <ChevronDown size={16} className="opacity-40" />
                </Button>
              }
            >
              <div className="flex flex-col h-full max-h-[60vh]">
                <div className="p-4 border-b border-slate-50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder={isEn ? "Search by name or email..." : "ค้นหาชื่อหรืออีเมล..."}
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="pl-9 h-11 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-500/20"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                  <div className="grid grid-cols-1 gap-1">
                    {availableProfiles
                      .filter(
                        (p) =>
                          p.full_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
                          p.display_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
                          p.nickname?.toLowerCase().includes(memberSearch.toLowerCase()) ||
                          p.email?.toLowerCase().includes(memberSearch.toLowerCase())
                      )
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setNewMember({
                              ...newMember,
                              email: p.email || "",
                              role: "AGENT",
                            });
                            setSelectedProfileRole(p.role);
                            setIsMemberPickerOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group",
                            newMember.email === p.email &&
                              "bg-indigo-50/50 ring-1 ring-indigo-100"
                          )}
                        >
                          <Avatar className="h-10 w-10 border border-slate-100 shadow-sm shrink-0">
                            <AvatarImage src={p.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-slate-50 text-slate-400 font-bold">
                              {p.full_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                   "text-sm font-bold text-slate-900 truncate",
                                  newMember.email === p.email &&
                                    "text-indigo-600"
                                )}
                              >
                                {p.display_name || p.full_name}
                                {p.nickname && <span className="ml-1 text-slate-400 font-normal">({p.nickname})</span>}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[8px] px-1.5 py-0 rounded-full border shadow-none ${
                                  p.role === "ADMIN"
                                    ? "bg-purple-50 text-purple-600 border-purple-100"
                                    : p.role === "MANAGER"
                                      ? "bg-blue-50 text-blue-600 border-blue-100"
                                      : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                }`}
                              >
                                {p.role}
                              </Badge>
                            </div>
                            <span className="text-[10px] text-slate-400 truncate">
                              {p.email || ""}
                            </span>
                          </div>
                          {newMember.email === p.email && (
                            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                          )}
                        </button>
                      ))}
                    {availableProfiles.length === 0 && (
                      <div className="p-12 text-center">
                        <p className="text-xs text-slate-400 font-medium italic">
                          {isEn ? "All staff members are already in this branch" : "พนักงานทุกคนอยู่ในสาขานี้แล้ว"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ResponsiveDialog>
          </div>

          <div className="flex items-center gap-2 py-2">
            <div className="h-px bg-slate-100 flex-1" />
            <span className="text-[10px] text-slate-300 uppercase font-bold tracking-widest px-2">
              {isEn ? "OR" : "หรือ"}
            </span>
            <div className="h-px bg-slate-100 flex-1" />
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="email"
              className="text-sm font-semibold text-slate-700 px-1"
            >
              {isEn ? "Enter Email Directly" : "ใส่อีเมลโดยตรง"}
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                placeholder="example@email.com"
                className="pl-11 h-12 rounded-xl border-slate-200 focus:ring-indigo-600 bg-slate-50/50"
                value={searchQuery || newMember.email}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setNewMember({ ...newMember, email: e.target.value });
                }}
                required
              />
            </div>

            {/* Suggestions */}
            {searchQuery && (
              <div className="mt-2 border border-slate-100 rounded-2xl max-h-[150px] overflow-y-auto bg-white shadow-xl shadow-slate-200/50 p-2 ring-1 ring-slate-100">
                {availableProfiles
                  .filter(
                    (p) =>
                      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.email?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setNewMember({
                          ...newMember,
                          email: p.email || "",
                          role: "AGENT",
                        });
                        setSelectedProfileRole(p.role);
                        setSearchQuery("");
                      }}
                      className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl text-left transition-colors"
                    >
                      <Avatar className="h-8 w-8 shadow-sm">
                        <AvatarImage src={p.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px] bg-slate-100 text-slate-400 font-bold">
                          {p.full_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {p.display_name || p.full_name}
                          {p.nickname && <span className="ml-1 text-slate-400 font-normal">({p.nickname})</span>}
                        </p>
                        <p className="text-[10px] text-slate-400">{p.email}</p>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="role"
              className="text-sm font-semibold text-slate-700 px-1"
            >
              {isEn ? "Role in Branch" : "ตำแหน่งภายในสาขา"}
            </Label>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                variant={newMember.role === "AGENT" ? "default" : "outline"}
                onClick={() => setNewMember({ ...newMember, role: "AGENT" })}
                className={cn(
                  "rounded-xl h-11 px-4 text-xs font-bold transition-all flex items-center gap-2",
                  newMember.role === "AGENT"
                    ? "bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100"
                    : "border-slate-200 text-slate-500"
                )}
              >
                <UserIcon size={14} />
                {isEn ? "Agent (AGENT)" : "พนักงานขาย (AGENT)"}
              </Button>

              {(selectedProfileRole === "MANAGER" ||
                selectedProfileRole === "ADMIN") && (
                <Button
                  type="button"
                  variant={newMember.role === "MANAGER" ? "default" : "outline"}
                  onClick={() =>
                    setNewMember({ ...newMember, role: "MANAGER" })
                  }
                  className={cn(
                    "rounded-xl h-11 px-4 text-xs font-bold transition-all flex items-center gap-2",
                    newMember.role === "MANAGER"
                      ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100"
                      : "border-slate-200 text-slate-500"
                  )}
                >
                  <Shield size={14} />
                  {isEn ? "Manager (MANAGER)" : "ผู้จัดการ (MANAGER)"}
                </Button>
              )}

              {selectedProfileRole === "ADMIN" && (
                <Button
                  type="button"
                  variant={newMember.role === "ADMIN" ? "default" : "outline"}
                  onClick={() => setNewMember({ ...newMember, role: "ADMIN" })}
                  className={cn(
                    "rounded-xl h-11 px-4 text-xs font-bold transition-all flex items-center gap-2",
                    newMember.role === "ADMIN"
                      ? "bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-100"
                      : "border-slate-200 text-slate-500"
                  )}
                >
                  <Key size={14} />
                  {isEn ? "Admin (ADMIN)" : "ผู้ดูแลระบบ (ADMIN)"}
                </Button>
              )}

              <Button
                type="button"
                variant={newMember.role === "VIEWER" ? "default" : "outline"}
                onClick={() => setNewMember({ ...newMember, role: "VIEWER" })}
                className={cn(
                  "rounded-xl h-11 px-4 text-xs font-bold transition-all flex items-center gap-2",
                  newMember.role === "VIEWER"
                    ? "bg-slate-700 hover:bg-slate-800 shadow-md shadow-slate-100"
                    : "border-slate-200 text-slate-500"
                )}
              >
                <Eye size={14} />
                {isEn ? "Viewer (VIEWER)" : "ผู้เข้าชม (VIEWER)"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </ResponsiveDialog>
  );
}

