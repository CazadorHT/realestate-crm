"use client";

import { 
  leadStageLabelNullable, 
  leadSourceLabelNullable, 
  getLeadSubSource, 
  type LeadStage, 
  type LeadSource 
} from "@/features/leads/labels";
import { type LeadPreferences } from "../types";
import { RiContactsBookLine } from "react-icons/ri";
import { 
  ShieldCheck, 
  Phone, 
  Mail, 
  Globe, 
  StickyNote,
  Compass
} from "lucide-react";
import { FaLine, FaWhatsapp } from "react-icons/fa";
import { IoLogoWechat } from "react-icons/io5";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface LeadContactCardProps {
  lead: {
    stage: LeadStage | null;
    source?: LeadSource | string | null;
    phone: string | null;
    email: string | null;
    preferences: LeadPreferences | null;
    nationality: string | null;
    is_foreigner: boolean | null;
    note: string | null;
    line_id: string | null;
    wechat_id: string | null;
    whatsapp: string | null;
    utm_data?: any;
  };
}

export function LeadContactCard({ lead }: LeadContactCardProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const subSource = getLeadSubSource(lead, isEn);

  return (
    <div className="rounded-2xl border-none bg-white shadow-sm ring-1 ring-slate-100 flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-emerald-900/5">
      <div className="flex items-center gap-4 p-5 border-b border-slate-50 bg-slate-50/20">
        <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-100">
          <RiContactsBookLine className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-slate-800 tracking-tight">
            {isEn ? "Contact Information" : "ข้อมูลติดต่อ"}
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">
            {isEn ? "Contact details and current status" : "รายละเอียดการติดต่อและสถานะปัจจุบัน"}
          </p>
        </div>
      </div>
      <div className="p-6">
        <div className="grid gap-4">
          {/* Status */}
          <div className="flex items-center justify-between group/row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover/row:bg-emerald-50 group-hover/row:text-emerald-600 transition-colors">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-slate-500">
                {isEn ? "Lead Status" : "สถานะลูกค้า"}
              </span>
            </div>
            <span className="font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider ring-1 ring-emerald-100">
              {leadStageLabelNullable(lead.stage, language)}
            </span>
          </div>

          {/* Source / Channel */}
          {lead.source && (
            <div className="flex items-center justify-between group/row">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover/row:bg-sky-50 group-hover/row:text-sky-600 transition-colors">
                  <Compass className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-slate-500">
                  {isEn ? "Source / Channel" : "ที่มา / ช่องทาง"}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <span className="font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider border border-slate-200">
                  {leadSourceLabelNullable(lead.source, language)}
                </span>
                {subSource && (
                  <span className={`font-semibold px-2.5 py-0.5 rounded-full text-[10px] tracking-wider border ${
                    subSource.includes("ฝากทรัพย์") || subSource.includes("Deposit")
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100"
                      : "bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-100"
                  }`}>
                    {subSource}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Phone */}
          <div className="flex items-center justify-between group/row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover/row:bg-blue-50 group-hover/row:text-blue-600 transition-colors">
                <Phone className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-slate-500">
                {isEn ? "Phone Number" : "เบอร์โทรศัพท์"}
              </span>
            </div>
            <span className="text-sm font-semibold text-slate-700">
              {lead.phone ? (
                <a
                  href={`tel:${lead.phone}`}
                  className="hover:text-blue-600 hover:underline decoration-blue-200 underline-offset-4 transition-colors"
                >
                  {lead.phone}
                </a>
              ) : (
                <span className="text-slate-300">{isEn ? "Not specified" : "ไม่ระบุ"}</span>
              )}
            </span>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between group/row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover/row:bg-purple-50 group-hover/row:text-purple-600 transition-colors">
                <Mail className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-slate-500">
                {isEn ? "Email" : "อีเมล"}
              </span>
            </div>
            <span className="text-sm font-semibold text-slate-700 truncate max-w-[180px]">
              {lead.email ? (
                <a
                  href={`mailto:${lead.email}`}
                  className="hover:text-purple-600 hover:underline decoration-purple-200 underline-offset-4 transition-colors"
                >
                  {lead.email}
                </a>
              ) : (
                <span className="text-slate-300">{isEn ? "Not specified" : "ไม่ระบุ"}</span>
              )}
            </span>
          </div>

          {/* Line ID */}
          <div className="flex items-center justify-between group/row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover/row:bg-emerald-50 group-hover/row:text-emerald-600 transition-colors">
                <FaLine className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-slate-500">Line ID</span>
            </div>
            <span className="text-sm font-semibold text-emerald-600">
              {lead.line_id ? (
                <a
                  href={`https://line.me/ti/p/~${lead.line_id.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline underline-offset-4 transition-all"
                >
                  {lead.line_id}
                </a>
              ) : (
                <span className="text-slate-300">{isEn ? "Not specified" : "ไม่ระบุ"}</span>
              )}
            </span>
          </div>

          {/* WeChat ID */}
          <div className="flex items-center justify-between group/row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover/row:bg-[#07C160]/10 group-hover/row:text-[#07C160] transition-colors">
                <IoLogoWechat className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-slate-500">WeChat ID</span>
            </div>
            <span className="text-sm font-semibold text-[#07C160]">
              {lead.wechat_id || <span className="text-slate-300">{isEn ? "Not specified" : "ไม่ระบุ"}</span>}
            </span>
          </div>

          {/* WhatsApp */}
          <div className="flex items-center justify-between group/row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover/row:bg-[#25D366]/10 group-hover/row:text-[#25D366] transition-colors">
                <FaWhatsapp className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-slate-500">WhatsApp</span>
            </div>
            <span className="text-sm font-semibold text-[#25D366]">
              {lead.whatsapp ? (
                <a
                  href={`https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline underline-offset-4 transition-all"
                >
                  {lead.whatsapp}
                </a>
              ) : (
                <span className="text-slate-300">{isEn ? "Not specified" : "ไม่ระบุ"}</span>
              )}
            </span>
          </div>

          {/* Nationality */}
          <div className="flex items-center justify-between group/row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover/row:bg-amber-50 group-hover/row:text-amber-600 transition-colors">
                <Globe className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-slate-500">
                {isEn ? "Nationality" : "สัญชาติ"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-sm text-slate-700">
              {lead.nationality ? (
                <>
                  <span>{lead.nationality}</span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-semibold uppercase">
                    {lead.is_foreigner ? "INTL" : "THAI"}
                  </span>
                </>
              ) : (
                 <span className="text-slate-300">{isEn ? "Not specified" : "ไม่ระบุ"}</span>
              )}
            </div>
          </div>

          {/* Note Section */}
          {lead.note && (() => {
            // 1. Normalize line breaks and escaped slashes
            let text = lead.note
              .replace(/\\r\\n/g, "\n")
              .replace(/\\n/g, "\n")
              .replace(/\r\n/g, "\n");

            // 2. Detect deposit note and extract clean message/details
            let details = text;
            let imageUrl: string | null = null;
            const isDeposit = text.includes("[ฝากทรัพย์]");

            if (isDeposit) {
              const imgMatch = text.match(/Image:\s*(https?:\/\/[^\s\n\r]+)/i);
              if (imgMatch && imgMatch[1] && imgMatch[1].trim() !== "-") {
                imageUrl = imgMatch[1].trim();
              }

              const detailsMatch = text.match(/Details:\s*([\s\S]*)$/i);
              if (detailsMatch && detailsMatch[1]) {
                details = detailsMatch[1].trim();
                if (details === "-") details = "";
              }
            } else {
              const genericImgMatch = text.match(/(https?:\/\/[^\s\n\r]+\.(?:jpg|jpeg|png|webp|heic))/i);
              if (genericImgMatch && genericImgMatch[1]) {
                imageUrl = genericImgMatch[1].trim();
              }
            }

            // 3. Format markdown headers and list items if flattened into a single line
            const formattedContent = details
              .replace(/([^\n])\s*(#{1,4}\s+)/g, "$1\n\n$2")
              .replace(/([^\n])\s*(\*\s+)/g, "$1\n• ");

            const lines = formattedContent.split("\n");

            return (
              <div className="mt-4 pt-4 border-t border-slate-50 space-y-3">
                <div className="flex items-center gap-2">
                  <StickyNote className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    {isEn ? "Additional Notes / Details" : "รายละเอียด / ข้อความที่ส่งมา"}
                  </span>
                </div>
                
                <div className="relative group/note bg-slate-50/70 p-4 rounded-xl border border-slate-200/70">
                  <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-emerald-400 rounded-r-full" />
                  <div className="space-y-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed pl-2.5">
                    {lines.map((line, idx) => {
                      const trimmed = line.trim();
                      if (!trimmed) {
                        return <div key={idx} className="h-1.5" />;
                      }
                      if (trimmed.startsWith("# ")) {
                        return (
                          <h4 key={idx} className="font-bold text-sm sm:text-base text-slate-900 pt-1.5 pb-0.5 border-b border-slate-200/60">
                            {trimmed.replace(/^#\s+/, "")}
                          </h4>
                        );
                      }
                      if (trimmed.startsWith("## ")) {
                        return (
                          <h5 key={idx} className="font-bold text-xs sm:text-sm text-blue-900 pt-1">
                            {trimmed.replace(/^##\s+/, "")}
                          </h5>
                        );
                      }
                      if (trimmed.startsWith("### ")) {
                        return (
                          <h6 key={idx} className="font-semibold text-xs sm:text-sm text-slate-800 pt-1 flex items-center gap-1.5">
                            {trimmed.replace(/^###\s+/, "")}
                          </h6>
                        );
                      }
                      if (trimmed.startsWith("• ") || trimmed.startsWith("* ")) {
                        return (
                          <div key={idx} className="flex items-start gap-2 pl-1.5 text-slate-600">
                            <span className="text-blue-500 font-bold leading-none select-none">•</span>
                            <span className="flex-1">{trimmed.replace(/^[•*]\s+/, "")}</span>
                          </div>
                        );
                      }
                      return (
                        <p key={idx} className="text-slate-700">
                          {trimmed}
                        </p>
                      );
                    })}
                  </div>
                </div>

                {imageUrl && (
                  <div className="pt-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-2">
                      {isEn ? "Attached Property Photo" : "รูปภาพทรัพย์สินที่แนบมา"}
                    </span>
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group hover:opacity-95 transition-all max-w-sm shadow-sm"
                    >
                      <img
                        src={imageUrl}
                        alt="Property Attachment"
                        className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                        <span>{isEn ? "Click to view original image" : "คลิกดูรูปภาพต้นฉบับ"}</span>
                      </div>
                    </a>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
