import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, Wand2 } from "lucide-react";

const NATIONALITY_MAP_TH_TO_EN: Record<string, string> = {
  "ไทย": "THA, Thailand",
  "จีน": "CHN, China",
  "ญี่ปุ่น": "JPN, Japan",
  "เกาหลี": "KOR, South Korea",
  "อเมริกัน": "USA, United States",
  "อังกฤษ": "GBR, United Kingdom",
  "ฝรั่งเศส": "FRA, France",
  "เยอรมัน": "DEU, Germany",
  "รัสเซีย": "RUS, Russia",
  "อินเดีย": "IND, India",
  "สิงคโปร์": "SGP, Singapore",
  "มาเลเซีย": "MYS, Malaysia",
  "พม่า": "MMR, Myanmar",
  "กัมพูชา": "KHM, Cambodia",
  "ลาว": "LAO, Laos",
  "เวียดนาม": "VNM, Vietnam",
  "ฟิลิปปินส์": "PHL, Philippines",
  "อินโดนีเซีย": "IDN, Indonesia",
  "สเปน": "ESP, Spain",
  "ไต้หวัน": "TWN, Taiwan",
  "ฮ่องกง": "HKG, Hong Kong",
  "ออสเตรเลีย": "AUS, Australia"
};

const NATIONALITY_MAP_EN_TO_TH: Record<string, string> = {
  "thai": "ไทย",
  "thailand": "ไทย",
  "tha": "ไทย",
  "tha, thailand": "ไทย",
  "chinese": "จีน",
  "china": "จีน",
  "chn": "จีน",
  "chn, china": "จีน",
  "japanese": "ญี่ปุ่น",
  "japan": "ญี่ปุ่น",
  "jpn": "ญี่ปุ่น",
  "jpn, japan": "ญี่ปุ่น",
  "korean": "เกาหลี",
  "south korea": "เกาหลี",
  "kor": "เกาหลี",
  "kor, south korea": "เกาหลี",
  "american": "อเมริกัน",
  "united states": "อเมริกัน",
  "usa": "อเมริกัน",
  "usa, united states": "อเมริกัน",
  "british": "อังกฤษ",
  "united kingdom": "อังกฤษ",
  "gbr": "อังกฤษ",
  "gbr, united kingdom": "อังกฤษ",
  "french": "ฝรั่งเศส",
  "france": "ฝรั่งเศส",
  "fra": "ฝรั่งเศส",
  "fra, france": "ฝรั่งเศส",
  "german": "เยอรมัน",
  "germany": "เยอรมัน",
  "deu": "เยอรมัน",
  "deu, germany": "เยอรมัน",
  "russian": "รัสเซีย",
  "russia": "รัสเซีย",
  "rus": "รัสเซีย",
  "rus, russia": "รัสเซีย",
  "indian": "อินเดีย",
  "india": "อินเดีย",
  "ind": "อินเดีย",
  "ind, india": "อินเดีย",
  "singaporean": "สิงคโปร์",
  "singapore": "สิงคโปร์",
  "sgp": "สิงคโปร์",
  "sgp, singapore": "สิงคโปร์",
  "malaysian": "มาเลเซีย",
  "malaysia": "มาเลเซีย",
  "mys": "มาเลเซีย",
  "mys, malaysia": "มาเลเซีย",
  "burmese": "พม่า",
  "myanmar": "พม่า",
  "mmr": "พม่า",
  "mmr, myanmar": "พม่า",
  "cambodian": "กัมพูชา",
  "cambodia": "กัมพูชา",
  "khm": "กัมพูชา",
  "khm, cambodia": "กัมพูชา",
  "laotian": "ลาว",
  "laos": "ลาว",
  "lao": "ลาว",
  "lao, laos": "ลาว",
  "vietnamese": "เวียดนาม",
  "vietnam": "เวียดนาม",
  "vnm": "เวียดนาม",
  "vnm, vietnam": "เวียดนาม",
  "filipino": "ฟิลิปปินส์",
  "philippines": "ฟิลิปปินส์",
  "phl": "ฟิลิปปินส์",
  "phl, philippines": "ฟิลิปปินส์",
  "indonesian": "อินโดนีเซีย",
  "indonesia": "อินโดนีเซีย",
  "idn": "อินโดนีเซีย",
  "idn, indonesia": "อินโดนีเซีย",
  "spanish": "สเปน",
  "spain": "สเปน",
  "esp": "สเปน",
  "esp, spain": "สเปน",
  "taiwanese": "ไต้หวัน",
  "taiwan": "ไต้หวัน",
  "twn": "ไต้หวัน",
  "twn, taiwan": "ไต้หวัน",
  "hong konger": "ฮ่องกง",
  "hong kong": "ฮ่องกง",
  "hkg": "ฮ่องกง",
  "hkg, hong kong": "ฮ่องกง",
  "australian": "ออสเตรเลีย",
  "australia": "ออสเตรเลีย",
  "aus": "ออสเตรเลีย",
  "aus, australia": "ออสเตรเลีย"
};

function translateToThai(text: string): string {
  if (!text) return "";
  let temp = text.toLowerCase();
  
  // Sort keys by length descending to match longer strings first (e.g. "tha, thailand" before "tha")
  const keys = Object.keys(NATIONALITY_MAP_EN_TO_TH).sort((a, b) => b.length - a.length);
  const result: string[] = [];
  
  for (const key of keys) {
    if (temp.includes(key)) {
      result.push(NATIONALITY_MAP_EN_TO_TH[key]);
      temp = temp.replace(new RegExp(key, 'g'), '');
    }
  }
  
  const remaining = temp.split(",").map(p => p.trim()).filter(p => p && !/^[,\s]*$/.test(p));
  if (remaining.length > 0) {
    result.push(...remaining);
  }
  
  return result.join(", ");
}

function translateToEnglish(text: string): string {
  if (!text) return "";
  const parts = text.split(",").map(p => p.trim());
  const converted = parts.map(part => NATIONALITY_MAP_TH_TO_EN[part] || part);
  return converted.join(", ");
}

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
      <Label className="text-[10px] font-semibold text-blue-900 flex items-center gap-2 uppercase tracking-widest">
        <Wand2 className="h-4 w-4" />
        ข้อมูลผู้เช่า / ผู้รับเอกสาร (Tenant Overrides)
      </Label>
      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
        ระบุข้อมูลผู้เช่าหรือลูกค้าใหม่ หากไม่มีการระบุจะยึดตามดีลหรือโปรไฟล์ลูกค้าหลักโดยอัตโนมัติ
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">ชื่อลูกค้า (Client Name)</Label>
          <Input
            className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="เช่น สมชาย ใจดี"
          />
        </div>

        <div className="space-y-1.5 relative">
          <Label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">สัญชาติ (Nationality)</Label>
          <div className="absolute right-0 top-2 flex gap-1 bg-slate-100/80 p-0.5 rounded-lg text-[9px] font-bold border border-slate-200/50">
            <button
              type="button"
              onClick={() => setClientNationality(translateToThai(clientNationality))}
              className="px-1.5 py-0.5 rounded-md hover:bg-white text-slate-500 hover:text-slate-700 transition-colors"
            >
              TH
            </button>
            <button
              type="button"
              onClick={() => setClientNationality(translateToEnglish(clientNationality))}
              className="px-1.5 py-0.5 rounded-md hover:bg-white text-slate-500 hover:text-slate-700 transition-colors"
            >
              EN
            </button>
          </div>
          <Input
            className="h-10 text-sm rounded-xl border-blue-50 bg-white focus:border-blue-400 shadow-sm"
            value={clientNationality}
            onChange={(e) => setClientNationality(e.target.value)}
            placeholder="เช่น Thai / British"
          />
        </div>

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
