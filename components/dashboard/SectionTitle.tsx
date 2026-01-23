interface SectionTitleProps {
  title: string;
  subtitle?: string;
  color?: "blue" | "emerald" | "purple" | "amber" | "rose";
}

const COLOR_MAP = {
  blue: "from-blue-500 to-indigo-600",
  emerald: "from-emerald-500 to-teal-600",
  purple: "from-purple-500 to-violet-600",
  amber: "from-amber-500 to-orange-600",
  rose: "from-rose-500 to-pink-600",
};

const BLUR_COLOR_MAP = {
  blue: "from-blue-500 to-indigo-500",
  emerald: "from-emerald-500 to-teal-500",
  purple: "from-purple-500 to-violet-500",
  amber: "from-amber-500 to-orange-500",
  rose: "from-rose-500 to-pink-500",
};

export function SectionTitle({
  title,
  subtitle,
  color = "blue",
}: SectionTitleProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div
          className={`absolute inset-0 bg-gradient-to-r ${BLUR_COLOR_MAP[color]} rounded-lg blur-sm opacity-50`}
        />
        <div
          className={`relative w-1.5 h-8 bg-gradient-to-b ${COLOR_MAP[color]} rounded-full`}
        />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        {subtitle && (
          <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
