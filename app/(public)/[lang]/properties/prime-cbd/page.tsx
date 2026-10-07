import { notFound } from "next/navigation";
import { Metadata } from "next";
import PrimeCbdPage, { generateMetadata as baseGenerateMetadata } from "@/app/(public)/properties/prime-cbd/page";

export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

const VALID_FOREIGN_LANGS = ["en", "zh", "ru"];

/**
 * [S-Tier] Multilingual Prime CBD & New CBD Landing Page
 * (/en/properties/prime-cbd, /zh/properties/prime-cbd, /ru/properties/prime-cbd)
 * 100% Static ISR Edge Caching with Zero Fast Origin DB Egress
 */
export default async function MultilingualPrimeCbdPage(props: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<any>;
}) {
  const { lang } = await props.params;
  const normalizedLang = lang?.toLowerCase();

  if (!VALID_FOREIGN_LANGS.includes(normalizedLang)) {
    notFound();
  }

  return <PrimeCbdPage searchParams={props.searchParams} locale={normalizedLang} />;
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
