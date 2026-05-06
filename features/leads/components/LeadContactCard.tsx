import { leadStageLabelNullable, type LeadStage } from "@/features/leads/labels";
import { type LeadPreferences } from "../types";
import { RiContactsBookLine } from "react-icons/ri";
import { 
  ShieldCheck, 
  Phone, 
  Mail, 
  Globe, 
  StickyNote 
} from "lucide-react";
import { FaLine, FaWhatsapp } from "react-icons/fa";
import { IoLogoWechat } from "react-icons/io5";

interface LeadContactCardProps {
  lead: {
    stage: LeadStage | null;
    phone: string | null;
    email: string | null;
    preferences: LeadPreferences | null;
    nationality: string | null;
    is_foreigner: boolean | null;
    note: string | null;
    line_id: string | null;
    wechat_id: string | null;
    whatsapp: string | null;
  };
}

export function LeadContactCard({ lead }: LeadContactCardProps) {
  return (
    <div className="rounded-2xl border-none bg-white shadow-sm ring-1 ring-slate-100 flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-emerald-900/5">
      <div className="flex items-center gap-4 p-5 border-b border-slate-50 bg-slate-50/20">
        <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-100">
          <RiContactsBookLine className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-slate-800 tracking-tight">ข้อมูลติดต่อ</h3>
          <p className="text-[11px] text-slate-400 font-medium">รายละเอียดการติดต่อและสถานะปัจจุบัน</p>
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
              <span className="text-sm font-medium text-slate-500">สถานะลูกค้า</span>
            </div>
            <span className="font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider ring-1 ring-emerald-100">
              {leadStageLabelNullable(lead.stage)}
            </span>
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between group/row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover/row:bg-blue-50 group-hover/row:text-blue-600 transition-colors">
                <Phone className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-slate-500">เบอร์โทรศัพท์</span>
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
                <span className="text-slate-300">ไม่ระบุ</span>
              )}
            </span>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between group/row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover/row:bg-purple-50 group-hover/row:text-purple-600 transition-colors">
                <Mail className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-slate-500">อีเมล</span>
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
                <span className="text-slate-300">ไม่ระบุ</span>
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
                <span className="text-slate-300">ไม่ระบุ</span>
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
              {lead.wechat_id || <span className="text-slate-300">ไม่ระบุ</span>}
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
                <span className="text-slate-300">ไม่ระบุ</span>
              )}
            </span>
          </div>

          {/* Nationality */}
          <div className="flex items-center justify-between group/row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover/row:bg-amber-50 group-hover/row:text-amber-600 transition-colors">
                <Globe className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-slate-500">สัญชาติ</span>
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
                 <span className="text-slate-300">ไม่ระบุ</span>
              )}
            </div>
          </div>

          {/* Note Section */}
          {lead.note && (
            <div className="mt-4 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-2 mb-3">
                <StickyNote className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  บันทึกเพิ่มเติม
                </span>
              </div>
              <div className="relative group/note">
                <div className="absolute -left-3 top-0 bottom-0 w-1 bg-emerald-100 rounded-full group-hover/note:bg-emerald-200 transition-colors" />
                <p className="text-sm text-slate-600 leading-relaxed italic pl-3">
                  "{lead.note}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
