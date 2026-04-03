"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  UserPlus,
  Edit2,
  X,
  Phone,
  Globe,
  User,
  Handshake,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CreateDealInput } from "../schema";

export function CoAgentPicker() {
  const form = useFormContext<CreateDealInput>();
  const [open, setOpen] = useState(false);

  const coAgentName = form.watch("co_agent_name");
  const coAgentContact = form.watch("co_agent_contact");
  const coAgentOnline = form.watch("co_agent_online");

  const hasData = coAgentName || coAgentContact || coAgentOnline;

  const clearData = (e: React.MouseEvent) => {
    e.stopPropagation();
    form.setValue("co_agent_name", undefined, { shouldDirty: true });
    form.setValue("co_agent_contact", undefined, { shouldDirty: true });
    form.setValue("co_agent_online", undefined, { shouldDirty: true });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      className="xl:max-w-md! bg-white!"
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-xl">
            <Handshake className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            ข้อมูล Co-Agent
          </span>
        </div>
      }
      description="กรอกรายละเอียดผู้ประสานงานร่วม (ข้อมูลเสริม)"
      trigger={
        <div className="relative group">
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full h-auto py-5 px-6 rounded-[24px] border-2 flex flex-col items-center gap-3 transition-all duration-500",
              hasData
                ? "border-blue-100 bg-blue-50/20 hover:bg-blue-50/40 shadow-sm"
                : "border-dashed border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:border-slate-300",
            )}
          >
            {hasData ? (
              <div className="flex flex-col items-center w-full">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200 ring-4 ring-white">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex flex-col items-start leading-none">
                    <span className="font-bold text-slate-900 text-sm truncate max-w-[180px]">
                      {coAgentName || "ผู้ประสานงาน"}
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">
                      Co-Agent Partner
                    </span>
                  </div>
                  <div className="ml-1 p-1 rounded-md bg-white border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                    <Edit2 className="h-3 w-3 text-slate-400" />
                  </div>
                </div>

                {(coAgentContact || coAgentOnline) && (
                  <div className="flex items-center justify-center gap-4 w-full mt-2 pt-2 border-t border-blue-50/50">
                    {coAgentContact && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white rounded-full border border-slate-100 shadow-xs">
                        <Phone className="h-2.5 w-2.5 text-blue-500" />
                        <span className="text-[10px] text-slate-600 font-bold">
                          {coAgentContact}
                        </span>
                      </div>
                    )}
                    {coAgentOnline && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white rounded-full border border-slate-100 shadow-xs">
                        <Globe className="h-2.5 w-2.5 text-emerald-500" />
                        <span className="text-[10px] text-slate-600 font-bold truncate max-w-[80px]">
                          {coAgentOnline}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <UserPlus className="h-6 w-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-slate-600 tracking-tight">
                    เพิ่มผู้ร่วมงาน (Co-Agent)
                  </span>
                  <p className="text-[11px] text-slate-400 font-medium">
                    หากมีพาร์ทเนอร์หรือผู้ประสานงานร่วม
                  </p>
                </div>
              </>
            )}
          </Button>

          {hasData && (
            <button
              onClick={clearData}
              className="absolute -top-1 -right-1 h-7 w-7 bg-white border-2 border-white rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:scale-110 shadow-lg transition-all z-20 group/close"
            >
              <div className="h-full w-full bg-slate-50 rounded-full flex items-center justify-center group-hover/close:bg-rose-50">
                <X className="h-3.5 w-3.5" />
              </div>
            </button>
          )}
        </div>
      }
      footer={
        <Button
          onClick={() => setOpen(false)}
          className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-xl shadow-blue-200/50 transition-all active:scale-95 gap-2"
        >
          <Check className="h-4 w-4" />
          ยืนยันข้อมูล
        </Button>
      }
    >
      <div className="p-5 space-y-4">
        {/* Input Cards */}
        {[
          {
            name: "co_agent_name",
            label: "ชื่อ Co-Agent",
            placeholder: "ระบุชื่อผู้ประสานงาน",
            icon: <User className="h-4 w-4" />,
            color: "blue",
          },
          {
            name: "co_agent_contact",
            label: "เบอร์โทรศัพท์",
            placeholder: "081-xxx-xxxx",
            icon: <Phone className="h-4 w-4" />,
            color: "cyan",
          },
          {
            name: "co_agent_online",
            label: "Facebook / LINE",
            placeholder: "LINE:@id หรือ FB Name",
            icon: <Globe className="h-4 w-4" />,
            color: "emerald",
          },
        ].map((item) => (
          <FormField
            key={item.name}
            control={form.control}
            name={item.name as any}
            render={({ field }) => (
              <FormItem className="space-y-0 relative group">
                <div
                  className={cn(
                    "flex flex-col gap-1 p-4 bg-slate-50/50 border border-slate-100 rounded-[20px] transition-all duration-300",
                    "group-focus-within:bg-white group-focus-within:border-blue-200 group-focus-within:shadow-md group-focus-within:shadow-blue-50",
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={cn(
                        "p-1.5 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center",
                        field.value
                          ? "text-blue-600"
                          : "text-slate-400 group-focus-within:text-blue-500",
                      )}
                    >
                      {item.icon}
                    </div>
                    <FormLabel className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                      {item.label}
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder={item.placeholder}
                      className="h-9 border-none bg-transparent p-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-medium focus-visible:ring-0 focus-visible:ring-offset-0 transition-all"
                      onChange={(e) =>
                        field.onChange(e.target.value || undefined)
                      }
                    />
                  </FormControl>
                </div>
                <FormMessage className="text-[10px] font-bold mt-1 px-4" />
              </FormItem>
            )}
          />
        ))}

        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex gap-3 items-start">
          <div className="h-5 w-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
            <Check className="h-3 w-3" />
          </div>
          <p className="text-[10px] text-amber-700 leading-relaxed font-semibold">
            ข้อมูล Co-Agent
            จะถูกนำไปใช้ในส่วนของการแบ่งคอมมิชชั่นและแสดงในหน้ารายละเอียดดีลนี้เท่านั้น
          </p>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
