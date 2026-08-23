import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, Wand2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

import {
  translateToThai,
  translateToEnglish,
} from "@/lib/constants/nationalities";

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
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="p-6 rounded-3xl border border-blue-100 bg-blue-50/20 space-y-4 relative overflow-hidden shadow-xs">
      <Label className="text-[10px] font-semibold text-blue-900 flex items-center gap-2 uppercase tracking-widest">
        <Wand2 className="h-4 w-4" />
        {isEn ? "Tenant / Recipient Overrides" : "ข้อมูลผู้เช่า / ผู้รับเอกสาร (Tenant Overrides)"}
      </Label>
      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
        {isEn 
          ? "Specify custom tenant or client details. If left blank, it will inherit from the deal or client profile automatically."
          : "ระบุข้อมูลผู้เช่าหรือลูกค้าใหม่ หากไม่มีการระบุจะยึดตามดีลหรือโปรไฟล์ลูกค้าหลักโดยอัตโนมัติ"}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">
            {isEn ? "Client Name" : "ชื่อลูกค้า (Client Name)"}
          </Label>
          <Input
            className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder={isEn ? "e.g. John Doe" : "เช่น สมชาย ใจดี"}
          />
        </div>

        <div className="space-y-1.5 relative">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">
            {isEn ? "Nationality" : "สัญชาติ (Nationality)"}
          </Label>
          <div className="absolute right-0 top-2 flex gap-1 bg-slate-100/80 p-0.5 rounded-lg text-[9px] font-bold border border-slate-200/50">
            <button
              type="button"
              onClick={() => setClientNationality(translateToThai(clientNationality))}
              className="px-1.5 py-0.5 rounded-md hover:bg-white text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              TH
            </button>
            <button
              type="button"
              onClick={() => setClientNationality(translateToEnglish(clientNationality))}
              className="px-1.5 py-0.5 rounded-md hover:bg-white text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              EN
            </button>
          </div>
          <Input
            className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
            value={clientNationality}
            onChange={(e) => setClientNationality(e.target.value)}
            placeholder={isEn ? "e.g. Thai / British" : "เช่น Thai / British"}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">
            {isEn ? "ID Card Number" : "เลขบัตรประชาชน (ID Card)"}
          </Label>
          <Input
            className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
            value={clientIdCard}
            onChange={(e) => setClientIdCard(e.target.value)}
            placeholder={isEn ? "e.g. 110xxxxxxxxxx" : "เช่น 110xxxxxxxxxx"}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">
            {isEn ? "Passport No." : "เลขพาสปอร์ต (Passport No.)"}
          </Label>
          <Input
            className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
            value={clientPassport}
            onChange={(e) => setClientPassport(e.target.value)}
            placeholder={isEn ? "e.g. AB1234567" : "เช่น AB1234567"}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">Email Address</Label>
          <Input
            className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder={isEn ? "e.g. customer@email.com" : "เช่น customer@email.com"}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">Line ID</Label>
          <Input
            className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
            value={clientLine}
            onChange={(e) => setClientLine(e.target.value)}
            placeholder={isEn ? "e.g. line_id" : "เช่น line_id"}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">WhatsApp</Label>
          <Input
            className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
            value={clientWhatsapp}
            onChange={(e) => setClientWhatsapp(e.target.value)}
            placeholder={isEn ? "e.g. +66..." : "เช่น whatsapp number"}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">WeChat ID</Label>
          <Input
            className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
            value={clientWechat}
            onChange={(e) => setClientWechat(e.target.value)}
            placeholder={isEn ? "e.g. wechat_id" : "เช่น wechat_id"}
          />
        </div>
      </div>
    </div>
  );
}

