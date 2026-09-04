import { Train, Building2, Home } from "lucide-react";
import { getLocalizedField } from "@/lib/i18n";
import type { StationDetail } from "@/features/public/stations";

interface StationSeoContentProps {
  station: StationDetail;
  language: string;
  stationNameFormatted: string;
  getString: (key: string, params?: Record<string, string | number>) => string;
}

export function StationSeoContent({
  station,
  language,
  stationNameFormatted,
  getString,
}: StationSeoContentProps) {
  const localizedDesc = getLocalizedField<string>(station, "description", language);

  return (
    <section className="bg-white border-t border-slate-100">
      <div className="max-w-screen-2xl mx-auto px-5 md:px-8 py-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          {getString("about_location_title") || (
            language === "en"
              ? `About ${stationNameFormatted} Location`
              : language === "cn"
                ? `关于${stationNameFormatted}的地理位置`
                : language === "ru"
                  ? `О районе станции ${stationNameFormatted}`
                  : `เกี่ยวกับทำเล${stationNameFormatted}`
          )}
        </h2>
        <div className="prose prose-slate max-w-none">
          {localizedDesc ? (
            <div dangerouslySetInnerHTML={{ __html: localizedDesc }} />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 not-prose mb-8">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all duration-300">
                  <h3 className="text-base font-bold text-slate-950 mb-2 flex items-center gap-2">
                    <Train className="w-5 h-5 text-blue-600 shrink-0" />
                    {getString("travel_convenience")}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {getString("travel_convenience_desc", { stationName: stationNameFormatted })}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all duration-300">
                  <h3 className="text-base font-bold text-slate-950 mb-2 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
                    {getString("lifestyle_amenities")}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {getString("lifestyle_amenities_desc", { stationName: stationNameFormatted })}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all duration-300">
                  <h3 className="text-base font-bold text-slate-950 mb-2 flex items-center gap-2">
                    <Home className="w-5 h-5 text-blue-600 shrink-0" />
                    {getString("investment_growth")}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {getString("investment_growth_desc", { stationName: stationNameFormatted })}
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mt-6 mb-3">
                {getString("find_projects_title", { stationName: stationNameFormatted })}
              </h3>
              <p>
                {getString("find_projects_desc_1", { stationName: stationNameFormatted })}
              </p>
              <p>
                {getString("find_projects_desc_2", { stationName: stationNameFormatted })}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
