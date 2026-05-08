import { History, Lightbulb, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecentlyViewedHeaderProps {
  showingRecommended: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  handleClear: () => void;
  disableAos?: boolean;
}

export function RecentlyViewedHeader({
  showingRecommended,
  t,
  handleClear,
  disableAos = false,
}: RecentlyViewedHeaderProps) {
  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 md:mb-4"
      {...(!disableAos && { "data-aos": "fade-up" })}
    >
      <div className="flex items-start sm:items-center gap-2 md:gap-3">
        <div
          className={`p-2 md:p-2.5 rounded-xl md:rounded-2xl ${
            showingRecommended ? "bg-amber-50" : "bg-blue-50"
          }`}
        >
          {showingRecommended ? (
            <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
          ) : (
            <History className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
          )}
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
            {showingRecommended ? (
              <>
                <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-600 to-orange-600">
                  {t("recently_viewed.property_types")}
                </span>
                <br className="hidden md:block" />
                {t("recently_viewed.title_recommended")}
              </>
            ) : (
              <>
                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
                  {t("recently_viewed.property_types")}
                </span>
                <br className="hidden md:block" />
                {t("recently_viewed.title_recent")}
              </>
            )}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {showingRecommended
              ? t("recently_viewed.desc_recommended")
              : t("recently_viewed.desc_recent")}
          </p>
        </div>
      </div>

      {!showingRecommended && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          aria-label={t("recently_viewed.clear_history") || "Clear History"}
          className="text-slate-400 hover:text-red-500 transition-colors rounded-md gap-2 self-end sm:self-auto"
        >
          <Trash2 className="h-5 w-4" />
        </Button>
      )}
    </div>
  );
}
