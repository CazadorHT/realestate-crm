import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PropertyTypeBadgeProps {
  type: string;
  className?: string;
}

export function PropertyTypeBadge({ type, className }: PropertyTypeBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("uppercase text-[10px] tracking-wide", className)}>
      {type}
    </Badge>
  );
}
