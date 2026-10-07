import { notFound } from "next/navigation";
import { Metadata } from "next";
import OfficeForRentPage, { generateMetadata as baseGenerateMetadata } from "@/app/(public)/properties/office-for-rent/page";

export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

const VALID_FOREIGN_LANGS = ["en", "zh", "ru"];

/**
 * [S-Tier] Multilingual Office & Commercial For Rent Landing Page
 * (/en/properties/office-for-rent, /zh/properties/office-for-rent, /ru/properties/office-for-rent)
 * 100% Static ISR Edge Caching with Zero Fast Origin DB Egress
 */
export default async function MultilingualOfficeForRentPage(props: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<any>;
}) {
  const { lang } = await props.params;
  const normalizedLang = lang?.toLowerCase();

  if (!VALID_FOREIGN_LANGS.includes(normalizedLang)) {
    notFound();
  }

  return <OfficeForRentPage searchParams={props.searchParams} locale={normalizedLang} />;
}

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<any>;
}): Promise<Metadata> {
  const { lang } = await props.params;
  const normalizedLang = lang?.toLowerCase();

  if (!VALID_FOREIGN_LANGS.includes(normalizedLang)) {
    return {};
  }

  return baseGenerateMetadata({ searchParams: props.searchParams, locale: normalizedLang });
}
