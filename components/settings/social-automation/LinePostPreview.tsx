import { LinePreview } from "@/features/properties/components/social-previews/LinePreview";
import { MOCK_PROPERTY_DATA } from "./constants";

export function LinePostPreview({
  template,
  language = "th",
}: {
  template: string;
  language?: "th" | "en" | "cn";
}) {
  const renderContent = (text: string) => {
    if (!text)
      return (
        <span className="text-slate-300 italic">
          กรุณากรอกรูปแบบข้อความเพื่อดูตัวอย่าง...
        </span>
      );

    let rendered = text;
    Object.entries(MOCK_PROPERTY_DATA).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      rendered = rendered.replace(regex, value || "");
    });

    return rendered;
  };

  const previewData = {
    title: MOCK_PROPERTY_DATA.title,
    propertyType: MOCK_PROPERTY_DATA.property_type,
    listingType_label: MOCK_PROPERTY_DATA.listing_type,
    priceDisplay: MOCK_PROPERTY_DATA.price,
    location: MOCK_PROPERTY_DATA.popular_area,
    bedrooms: MOCK_PROPERTY_DATA.bedrooms,
    bathrooms: MOCK_PROPERTY_DATA.bathrooms,
    size_sqm: MOCK_PROPERTY_DATA.size_sqm,
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
      <LinePreview images={images} previewData={previewData} lang={language} />
    </div>
  );
}
