import { type Language } from "@/lib/i18n";
import { LinePreview } from "@/features/properties/components/social-previews/LinePreview";
import { getMockPropertyData } from "./constants";
import { useLanguage } from "@/lib/i18n/language-context";

export function LinePostPreview({
  template,
  language: propLang,
}: {
  template: string;
  language?: Language;
}) {
  const { language: ctxLang } = useLanguage();
  const activeLang = propLang || ctxLang;
  const isEn = activeLang === "en";
  const mockData = getMockPropertyData(isEn);

  const renderContent = (text: string) => {
    if (!text)
      return (
        <span className="text-slate-300 italic">
          {isEn ? "Please enter a message template to preview..." : "กรุณากรอกรูปแบบข้อความเพื่อดูตัวอย่าง..."}
        </span>
      );

    let rendered = text;
    Object.entries(mockData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      rendered = rendered.replace(regex, value || "");
    });

    return rendered;
  };

  const previewData = {
    title: mockData.title,
    propertyType: mockData.property_type,
    listingType_label: mockData.listing_type,
    priceDisplay: mockData.price,
    location: mockData.popular_area,
    bedrooms: mockData.bedrooms,
    bathrooms: mockData.bathrooms,
    size_sqm: mockData.size_sqm,
    content: renderContent(template),
  };

  const images = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
  ];

  return (
    <div className="w-[320px] mx-auto sticky top-24">
      <LinePreview images={images} previewData={previewData} lang={activeLang} />
    </div>
  );
}
