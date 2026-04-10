"use client";

import { useState } from "react";
import { UserPlus, Mail, Key, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
}

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allProfiles: Profile[];
  currentMembers: Array<{ profile_id: string }>;
  branchName: string;
  onAdd: (data: { email: string; role: string }) => Promise<void>;
}

export function AddMemberDialog({
  open,
  onOpenChange,
  allProfiles,
  currentMembers,
  branchName,
  onAdd,
}: AddMemberDialogProps) {
  const [newMember, setNewMember] = useState({ email: "", role: "AGENT" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedProfileRole, setSelectedProfileRole] = useState<string | null>(null);

  const availableProfiles = allProfiles.filter(
    (p) => !currentMembers.some((m) => m.profile_id === p.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    await onAdd(newMember);
    setIsAdding(false);
    setNewMember({ email: "", role: "AGENT" });
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[32px] border-slate-100 sm:max-w-[425px] overflow-hidden shadow-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <UserPlus size={20} className="text-indigo-600" />
              </div>
              เพิ่มพนักงาน
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-1">
              ดึงพนักงานที่มีในระบบอยู่แล้วเข้าสู่สาขา {branchName}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-8">
            <div className="grid gap-2">
              <Label htmlFor="user-select" className="text-sm font-semibold text-slate-700 px-1">เลือกจากรายชื่อ</Label>
              <Select
                onValueChange={(email) => {
                  const profile = allProfiles.find((p) => p.email === email);
                  const role = profile?.role || "AGENT";
                  setNewMember({ ...newMember, email, role: "AGENT" }); // Default branch role is AGENT
                  setSelectedProfileRole(role);
                  setSearchQuery("");
                }}
              >
                <SelectTrigger id="user-select" className="h-14 rounded-2xl border-slate-200 focus:ring-indigo-600 transition-all shadow-sm bg-slate-50/50">
                  <SelectValue placeholder="ค้นหาหรือเลือกพนักงาน..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2 max-h-64">
                  <div className="flex flex-col gap-1">
                    {availableProfiles.map((p) => (
                      <SelectItem
                        key={p.id}
                        value={p.email || ""}
                        className="w-full rounded-xl focus:bg-indigo-50"
                      >
                        <div className="flex items-center gap-3 w-full py-1">
                          <Avatar className="h-10 w-10 border border-slate-100 shadow-sm shrink-0">
                            <AvatarImage src={p.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-slate-50 text-slate-400 font-bold">
                              {p.full_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 truncate">
                                {p.full_name}
                              </span>
                              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 rounded-full border shadow-none ${
                                p.role === "ADMIN"
                                  ? "bg-purple-50 text-purple-600 border-purple-100"
                                  : p.role === "MANAGER"
                                    ? "bg-blue-50 text-blue-600 border-blue-100"
                                    : "bg-emerald-50 text-emerald-600 border-emerald-100"
                              }`}>
                                {p.role}
                              </Badge>
                            </div>
                            <span className="text-[10px] text-slate-400 truncate">
                              {p.email || ""}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    {availableProfiles.length === 0 && (
                      <p className="p-4 text-center text-xs text-slate-400 italic">
                        พนักงานทุกคนอยู่ในสาขานี้แล้ว
                      </p>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 py-2">
              <div className="h-px bg-slate-100 flex-1" />
              <span className="text-[10px] text-slate-300 uppercase font-bold tracking-widest px-2">หรือ</span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700 px-1">ใส่อีเมลโดยตรง</Label>
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
                        p.email?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setNewMember({ ...newMember, email: p.email || "", role: "AGENT" });
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
                          <p className="text-xs font-bold text-slate-900">{p.full_name}</p>
                          <p className="text-[10px] text-slate-400">{p.email}</p>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role" className="text-sm font-semibold text-slate-700 px-1">ตำแหน่งภายในสาขา</Label>
              <Select
                value={newMember.role}
                onValueChange={(val) => setNewMember({ ...newMember, role: val })}
              >
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50">
                  <SelectValue placeholder="เลือกตำแหน่ง" />
                </SelectTrigger>
                <SelectContent className="rounded-xl p-1">
                  <SelectItem value="AGENT" className="rounded-lg focus:bg-indigo-50">พนักงานขาย (AGENT)</SelectItem>
                  {(selectedProfileRole === "MANAGER" || selectedProfileRole === "ADMIN") && (
                    <SelectItem value="MANAGER" className="rounded-lg focus:bg-indigo-50">ผู้จัดการสาขา (MANAGER)</SelectItem>
                  )}
                  {selectedProfileRole === "ADMIN" && (
                    <SelectItem value="ADMIN" className="rounded-lg focus:bg-indigo-50">ผู้ดูแลระบบ (ADMIN)</SelectItem>
                  )}
                  <SelectItem value="VIEWER" className="rounded-lg focus:bg-indigo-50">ผู้เข้าชม (VIEWER)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="bg-slate-50/50 -mx-6 -mb-6 p-6 px-10">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl h-12 text-slate-500 hover:bg-white"
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button 
              type="submit" 
              disabled={isAdding}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 px-8 shadow-lg shadow-slate-200 transition-all active:scale-95"
            >
              {isAdding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Key className="mr-2 h-4 w-4" />
              )}
              เพิ่มพนักงาน
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
