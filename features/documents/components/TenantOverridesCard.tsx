import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, Wand2 } from "lucide-react";

interface TenantOverridesCardProps {
  clientName: string;
  setClientName: (val: string) => void;
  clientEmail: string;
  setClientEmail: (val: string) => void;
  clientLine: string;
  setClientLine: (val: string) => void;
  clientWhatsapp: string;
  setClientWhatsapp: (val: string) => void;
  clientWechat: string;
  setClientWechat: (val: string) => void;
  clientNationality: string;
  setClientNationality: (val: string) => void;
  clientIdCard: string;
  setClientIdCard: (val: string) => void;
  clientPassport: string;
  setClientPassport: (val: string) => void;
}

export function TenantOverridesCard({
  clientName,
  setClientName,
  clientEmail,
  setClientEmail,
  clientLine,
  setClientLine,
  clientWhatsapp,
  setClientWhatsapp,
  clientWechat,
  setClientWechat,
  clientNationality,
  setClientNationality,
  clientIdCard,
  setClientIdCard,
  clientPassport,
  setClientPassport,
}: TenantOverridesCardProps) {
  return (
    <div className="p-6 rounded-3xl border border-blue-100 bg-blue-50/20 space-y-4 relative overflow-hidden shadow-xs">
      <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
        <FileText className="h-24 w-24 text-blue-900" />
      </div>
      <Label className="text-[10px] font-semibold text-blue-900 flex items-center gap-2 uppercase tracking-widest">
        <Wand2 className="h-4 w-4" />
        ข้อมูลผู้เช่า / ผู้รับเอกสาร (Tenant Overrides)
      </Label>
      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
        ระบุข้อมูลผู้เช่าหรือลูกค้าใหม่ หากไม่มีการระบุจะยึดตามดีลหรือโปรไฟล์ลูกค้าหลักโดยอัตโนมัติ
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">ชื่อลูกค้า (Client Name)</Label>
          <Input
            className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="เช่น สมชาย ใจดี"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">สัญชาติ (Nationality)</Label>
          <Input
            className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
            value={clientNationality}
            onChange={(e) => setClientNationality(e.target.value)}
            placeholder="เช่น Thai / British"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">เลขบัตรประชาชน (ID Card)</Label>
          <Input
            className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
            value={clientIdCard}
            onChange={(e) => setClientIdCard(e.target.value)}
            placeholder="เช่น 110xxxxxxxxxx"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">เลขพาสปอร์ต (Passport No.)</Label>
          <Input
            className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
            value={clientPassport}
            onChange={(e) => setClientPassport(e.target.value)}
            placeholder="เช่น AB1234567"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">Email Address</Label>
          <Input
            className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="เช่น customer@email.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">Line ID</Label>
          <Input
            className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
            value={clientLine}
            onChange={(e) => setClientLine(e.target.value)}
            placeholder="เช่น line_id"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">WhatsApp</Label>
          <Input
            className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
            value={clientWhatsapp}
            onChange={(e) => setClientWhatsapp(e.target.value)}
            placeholder="เช่น whatsapp number"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">WeChat ID</Label>
          <Input
            className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
            value={clientWechat}
            onChange={(e) => setClientWechat(e.target.value)}
            placeholder="เช่น wechat_id"
          />
        </div>
      </div>
    </div>
  );
}
