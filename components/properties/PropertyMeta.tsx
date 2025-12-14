import { Calendar, Hash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

interface PropertyMetaProps {
  date: string; // ISO String
}

export function PropertyMeta({ date }: PropertyMetaProps) {
  const timeAgo = formatDistanceToNow(new Date(date), { addSuffix: true, locale: th });

  return (
    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
      <div className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        <span>สร้างเมื่อ {timeAgo}</span>
      </div>
    </div>
  );
}
