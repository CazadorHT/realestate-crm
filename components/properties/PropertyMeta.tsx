import { Calendar, Hash } from "lucide-react";
import { formatDistanceToNowThai } from "@/lib/utils";

interface PropertyMetaProps {
  date: string; // ISO String
}

export function PropertyMeta({ date }: PropertyMetaProps) {
  const timeAgo = formatDistanceToNowThai(date);

  return (
    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
      <div className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        <span>สร้างเมื่อ {timeAgo}</span>
      </div>
    </div>
  );
}
