import { OfficeSizeOption } from "@/features/smart-match/config-actions";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface OfficeSizeStepProps {
  officeSizes: OfficeSizeOption[];
  availableSizes: Record<string, number>;
  onSelect: (min: number, max: number) => void;
  isLoading?: boolean;
}

export function OfficeSizeStep({
  officeSizes,
  availableSizes,
  onSelect,
  isLoading,
}: OfficeSizeStepProps) {
  const { t } = useLanguage();
  const hasChecked = Object.keys(availableSizes).length > 0;

  const renderOptions = () => {
    if (officeSizes.length > 0) {
      return officeSizes.map((opt) => {
        const sizeKey = opt.label.match(/\((S|M|L|XL)\)/)?.[1] || "";
        const count = availableSizes[sizeKey] ?? 0;
        const isDisabled = isLoading || (hasChecked && count === 0);

        // Try to translate based on size key (S, M, L, XL)
        const lowerKey = sizeKey.toLowerCase();
        const localizedSize = t(
          `smart_match.office_size_labels.${lowerKey}_size`,
        );
        const localizedDesc = t(
          `smart_match.office_size_labels.${lowerKey}_desc`,
        );

        // Fallback to label parsing if translation missing
        const labelStr = opt.label;
        const secondParenIndex = labelStr.indexOf("(", 1);
        const fallbackSize =
          secondParenIndex !== -1
            ? labelStr.substring(0, secondParenIndex).trim()
            : labelStr;
        const fallbackDesc =
          secondParenIndex !== -1
            ? labelStr.substring(secondParenIndex).trim()
            : "";

        const displaySize = localizedSize.includes("_size")
          ? fallbackSize
          : localizedSize;
        const displayDesc = localizedDesc.includes("_desc")
          ? fallbackDesc
          : localizedDesc;

        return (
          <button
            key={opt.id}
            disabled={isDisabled}
            onClick={() => onSelect(opt.min_sqm, opt.max_sqm)}
            className={`px-3 py-5 rounded-xl border-2 transition-all h-full cursor-pointer flex flex-col items-center text-center relative ${
              isDisabled
                ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed opacity-60"
                : "border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-600"
            } ${isLoading ? "opacity-60" : ""}`}
          >
            {!isDisabled && hasChecked && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            )}
            <span className="font-bold text-lg">
              ({sizeKey}) {displaySize}
            </span>
            {displayDesc && (
              <p
                className={`text-[11px] leading-tight mt-1 font-medium ${isDisabled ? "text-slate-300" : "text-blue-500"}`}
              >
                {displayDesc}
              </p>
            )}
          </button>
        );
      });
    }

    // Default Fallback Options
    return [
      {
        key: "S",
        size: t("smart_match.office_size_labels.s_size"),
        desc: t("smart_match.office_size_labels.s_desc"),
        min: 0,
        max: 40,
      },
      {
        key: "M",
        size: t("smart_match.office_size_labels.m_size"),
        desc: t("smart_match.office_size_labels.m_desc"),
        min: 40,
        max: 70,
      },
      {
        key: "L",
        size: t("smart_match.office_size_labels.l_size"),
        desc: t("smart_match.office_size_labels.l_desc"),
        min: 71,
        max: 100,
      },
      {
        key: "XL",
        size: t("smart_match.office_size_labels.xl_size"),
        desc: t("smart_match.office_size_labels.xl_desc"),
        min: 100,
        max: 9999,
      },
    ].map((opt) => {
      const count = availableSizes[opt.key] ?? 0;
      const isDisabled = isLoading || (hasChecked && count === 0);

      return (
        <button
          key={opt.key}
          disabled={isDisabled}
          onClick={() => onSelect(opt.min, opt.max)}
          className={`px-3 py-5 rounded-xl border-2 transition-all h-full cursor-pointer flex flex-col items-center text-center relative ${
            isDisabled
              ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed opacity-60"
              : "border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-600"
          } ${isLoading ? "opacity-60" : ""}`}
        >
          {!isDisabled && hasChecked && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          )}
          <span className="font-bold text-lg">
            ({opt.key}) {opt.size}
          </span>
          <p
            className={`text-[11px] leading-tight mt-1 font-medium ${isDisabled ? "text-slate-300" : "text-blue-500"}`}
          >
            {opt.desc}
          </p>
        </button>
      );
    });
  };

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 flex flex-col h-full">
      <h2 className="text-2xl sm:text-3xl font-medium md:text-2xl mb-4 sm:mb-6 text-slate-900 shrink-0">
        {t("smart_match.office_size_q")}
      </h2>
      <div className="overflow-y-auto pr-2 flex-1 custom-scrollbar">
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 pb-4">
          {renderOptions()}
        </div>
      </div>
    </div>
  );
}
