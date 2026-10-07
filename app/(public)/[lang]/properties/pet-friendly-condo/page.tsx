import { notFound } from "next/navigation";
import { Metadata } from "next";
import PetFriendlyCondoPage, { generateMetadata as baseGenerateMetadata } from "@/app/(public)/properties/pet-friendly-condo/page";

export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

const VALID_FOREIGN_LANGS = ["en", "zh", "ru"];

/**
 * [S-Tier] Multilingual Pet Friendly Condo Landing Page
 * (/en/properties/pet-friendly-condo, /zh/properties/pet-friendly-condo, /ru/properties/pet-friendly-condo)
 * 100% Static ISR Edge Caching with Zero Fast Origin DB Egress
 */
export default async function MultilingualPetFriendlyCondoPage(props: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<any>;
}) {
  const { lang } = await props.params;
  const normalizedLang = lang?.toLowerCase();

  if (!VALID_FOREIGN_LANGS.includes(normalizedLang)) {
    notFound();
  }

  return <PetFriendlyCondoPage searchParams={props.searchParams} locale={normalizedLang} />;
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
