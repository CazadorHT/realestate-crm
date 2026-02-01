import { Phone, ExternalLink } from "lucide-react";
import { FaFacebook, FaLine } from "react-icons/fa";

interface OwnerContactInfoProps {
  owner: {
    phone: string | null;
    line_id: string | null;
    facebook_url: string | null;
    other_contact: string | null;
  };
}

export function OwnerContactInfo({ owner }: OwnerContactInfoProps) {
  return (
    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-6">
      {owner.phone && (
        <a
          href={`tel:${owner.phone}`}
          className="flex items-center gap-2 text-sm hover:text-blue-600 transition-colors group"
        >
          <div className="p-2 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Phone className="h-4 w-4" />
          </div>
          <span className="font-medium">{owner.phone}</span>
        </a>
      )}

      {owner.line_id && (
        <div className="flex items-center gap-2 text-sm">
          <div className="p-2 rounded-full bg-[#06C755]/10 text-[#06C755]">
            <FaLine className="h-5 w-5" />
          </div>
          <span className="font-medium">{owner.line_id}</span>
        </div>
      )}

      {owner.facebook_url && (
        <a
          href={owner.facebook_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm hover:text-blue-600 transition-colors group"
        >
          <div className="p-2 rounded-full bg-[#1877F2]/10 text-[#1877F2] group-hover:bg-[#1877F2] group-hover:text-white transition-colors">
            <FaFacebook className="h-5 w-5" />
          </div>
          <span className="font-medium">Facebook</span>
          <ExternalLink className="h-3 w-3 opacity-50" />
        </a>
      )}

      {owner.other_contact && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="text-slate-400">อื่นๆ:</span>
          <span>{owner.other_contact}</span>
        </div>
      )}

      {!owner.phone && !owner.line_id && !owner.facebook_url && (
        <p className="text-sm text-slate-400">ไม่มีข้อมูลการติดต่อ</p>
      )}
    </div>
  );
}
