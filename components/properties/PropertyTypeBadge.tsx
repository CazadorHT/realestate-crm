import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPE_GRADIENTS,
  safeEnumLabel,
} from "@/features/properties/labels";
import type { PropertyType } from "@/features/properties/labels";

interface PropertyTypeBadgeProps {
  type: string;
  className?: string;
}

export function PropertyTypeBadge({ type, className }: PropertyTypeBadgeProps) {
  const label = safeEnumLabel(
    PROPERTY_TYPE_LABELS as Record<string, string>,
    type,
  );
  const gradient =
    (PROPERTY_TYPE_GRADIENTS as Record<string, string>)[type] ??
    "from-slate-400 to-slate-500";

  // หมายเหตุ: สีเหลืองกับตัวอักษรขาวอ่านยากนิดหน่อย → ใช้ text-slate-900 เฉพาะ WAREHOUSE
  const textClass =
    type === ("WAREHOUSE" as PropertyType) ? "text-slate-900" : "text-white";

  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full border-0 px-3 py-1 text-[11px] font-semibold tracking-tight shadow-sm",
        `bg-linear-to-r ${gradient} ${textClass}`,
        className,
      )}
      title={type}
    >
      {label}
    </Badge>
  );
}
