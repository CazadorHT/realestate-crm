import { notFound } from "next/navigation";
import { Metadata } from "next";
import LuxuryVillaPage, { generateMetadata as baseGenerateMetadata } from "@/app/(public)/properties/luxury-villa/page";

export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

const VALID_FOREIGN_LANGS = ["en", "zh", "ru"];

/**
 * [S-Tier] Multilingual Luxury Villa & Residence Landing Page
 * (/en/properties/luxury-villa, /zh/properties/luxury-villa, /ru/properties/luxury-villa)
 * 100% Static ISR Edge Caching with Zero Fast Origin DB Egress
 */
export default async function MultilingualLuxuryVillaPage(props: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<any>;
}) {
  const { lang } = await props.params;
  const normalizedLang = lang?.toLowerCase();

  if (!VALID_FOREIGN_LANGS.includes(normalizedLang)) {
    notFound();
  }

  return <LuxuryVillaPage searchParams={props.searchParams} locale={normalizedLang} />;
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
