import { generateMetadata as generateHomeMeta } from "@/app/(public)/page";
import { generateMetadata as generateMultilingualHomeMeta } from "@/app/(public)/[lang]/page";
import { generateMetadata as generateAboutMeta } from "@/app/(public)/about/page";
import { generateMetadata as generateServicesMeta } from "@/app/(public)/services/page";
import { generateMetadata as generateContactMeta } from "@/app/(public)/contact/page";
import { generateMetadata as generateBlogMeta } from "@/app/(public)/blog/page";
import { getLocalizedField, normalizeLocale } from "@/lib/i18n";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import fs from "fs";
import path from "path";

interface AuditResult {
  category: string;
  name: string;
  passed: boolean;
  score: number;
  details: string;
}

const auditResults: AuditResult[] = [];

function check(category: string, name: string, condition: boolean, details: string, weight = 10) {
  auditResults.push({
    category,
    name,
    passed: condition,
    score: condition ? weight : 0,
    details,
  });
}

async function runSimulation() {
  console.log("\n=======================================================");
  console.log(" 🤖 GOOGLEBOT & SEARCH ENGINE AUDIT SIMULATION (v4.0) ");
  console.log("=======================================================\n");

  // 1. Robots.txt Audit
  const robotsPath = path.resolve(".next/server/app/robots.txt.body");
  if (fs.existsSync(robotsPath)) {
    const robotsContent = fs.readFileSync(robotsPath, "utf-8");
    check("1. Crawlability & Indexing", "Robots.txt Exists & Allow Root", robotsContent.includes("Allow: /"), "Root path is allowed for crawling");
    check("1. Crawlability & Indexing", "Robots.txt Protects Admin / CRM", robotsContent.includes("Disallow: /protected/"), "Protected routes are hidden from search bots");
    check("1. Crawlability & Indexing", "Robots.txt Sitemap Declaration", robotsContent.includes("Sitemap:"), "Sitemap reference is explicitly provided");
    check("1. Crawlability & Indexing", "Filter Query Parameters Disallowed", robotsContent.includes("Disallow: /*?sort="), "Prevents duplicate content from search facet filters");
  } else {
    check("1. Crawlability & Indexing", "Robots.txt Exists", false, "Robots.txt not found in build output");
  }

  // 2. Sitemap.xml Audit
  const sitemapPath = path.resolve(".next/server/app/sitemap.xml.body");
  if (fs.existsSync(sitemapPath)) {
    const sitemapContent = fs.readFileSync(sitemapPath, "utf-8");
    const urlCount = (sitemapContent.match(/<loc>/g) || []).length;
    check("2. XML Sitemap Quality", "Sitemap Valid XML & URLs", urlCount > 10, `Found ${urlCount.toLocaleString()} indexed URLs in sitemap`);
    check("2. XML Sitemap Quality", "Hreflang Alternates (th)", sitemapContent.includes('hreflang="th"'), "Thai alternates correctly declared");
    check("2. XML Sitemap Quality", "Hreflang Alternates (en)", sitemapContent.includes('hreflang="en"'), "English alternates correctly declared");
    check("2. XML Sitemap Quality", "Hreflang Alternates (zh-Hans)", sitemapContent.includes('hreflang="zh-Hans"'), "Simplified Chinese alternates correctly declared");
    check("2. XML Sitemap Quality", "Hreflang Alternates (ru)", sitemapContent.includes('hreflang="ru"'), "Russian alternates correctly declared");
    check("2. XML Sitemap Quality", "x-default Fallback", sitemapContent.includes('hreflang="x-default"'), "x-default fallback tag present for international searchers");
  }

  // 3. Metadata & Canonical URLs across languages
  console.log("🔍 Simulating Googlebot Metadata Inspections...\n");

  // Home (Thai)
  const homeTh = await generateHomeMeta();
  check("3. Canonical & Meta Tags", "Home (TH) Title & Description", !!(homeTh.title && homeTh.description), `Title: "${String(homeTh.title).slice(0, 45)}..."`);
  check("3. Canonical & Meta Tags", "Home (TH) OpenGraph", !!(homeTh.openGraph && (homeTh.openGraph as any).url), `OG Type: ${(homeTh.openGraph as any)?.type}`);

  // Home (Chinese - /zh)
  const homeZh = await generateMultilingualHomeMeta({ params: Promise.resolve({ lang: "zh" }) });
  const zhCanonical = (homeZh.alternates as any)?.canonical || "";
  check("3. Canonical & Meta Tags", "Home (ZH) Title localized", String(homeZh.title || "").length > 5, `Title: "${String(homeZh.title).slice(0, 45)}..."`);
  check("3. Canonical & Meta Tags", "Home (ZH) Canonical URL contains /zh", zhCanonical.includes("/zh"), `Canonical: ${zhCanonical}`);

  // Home (English - /en)
  const homeEn = await generateMultilingualHomeMeta({ params: Promise.resolve({ lang: "en" }) });
  const enCanonical = (homeEn.alternates as any)?.canonical || "";
  check("3. Canonical & Meta Tags", "Home (EN) Canonical URL contains /en", enCanonical.includes("/en"), `Canonical: ${enCanonical}`);

  // Home (Russian - /ru)
  const homeRu = await generateMultilingualHomeMeta({ params: Promise.resolve({ lang: "ru" }) });
  const ruCanonical = (homeRu.alternates as any)?.canonical || "";
  check("3. Canonical & Meta Tags", "Home (RU) Canonical URL contains /ru", ruCanonical.includes("/ru"), `Canonical: ${ruCanonical}`);

  // Inner pages canonical checks
  const aboutMeta = await generateAboutMeta();
  check("3. Canonical & Meta Tags", "About Page Canonical Tag", !!(aboutMeta.alternates as any)?.canonical, `Canonical: ${(aboutMeta.alternates as any)?.canonical}`);

  const servicesMeta = await generateServicesMeta();
  check("3. Canonical & Meta Tags", "Services Page Canonical Tag", !!(servicesMeta.alternates as any)?.canonical, `Canonical: ${(servicesMeta.alternates as any)?.canonical}`);

  const blogMeta = await generateBlogMeta();
  check("3. Canonical & Meta Tags", "Blog Page Canonical Tag", !!(blogMeta.alternates as any)?.canonical, `Canonical: ${(blogMeta.alternates as any)?.canonical}`);

  // 4. Content Fallback Testing (Requirement: th=th, zh/ru missing -> en -> th)
  console.log("🌐 Testing International Content Fallback Matrix...\n");

  const sampleListing = {
    title: "คอนโดหรูสุขุมวิท 24",
    title_en: "Luxury Condo Sukhumvit 24",
    title_cn: null, // Chinese is missing!
    title_ru: null, // Russian is missing!
  };

  const sampleListingNoEn = {
    title: "บ้านเดี่ยวลาดพร้าว",
    title_en: null,
    title_cn: null,
    title_ru: null,
  };

  const sampleComplete = {
    title: "เพนต์เฮาส์ทองหล่อ",
    title_en: "Thonglor Penthouse",
    title_cn: "通罗顶层豪宅",
    title_ru: "Пентхаус Тонглор",
  };

  // Chinese test with English fallback
  const zhResult = getLocalizedField<string>(sampleListing, "title", "cn");
  check("4. Multilingual Fallback", "ZH Missing -> Fallback to EN", zhResult === "Luxury Condo Sukhumvit 24", `Expected EN fallback, got: "${zhResult}"`);

  // Russian test with English fallback
  const ruResult = getLocalizedField<string>(sampleListing, "title", "ru");
  check("4. Multilingual Fallback", "RU Missing -> Fallback to EN", ruResult === "Luxury Condo Sukhumvit 24", `Expected EN fallback, got: "${ruResult}"`);

  // Thai test remains Thai
  const thResult = getLocalizedField<string>(sampleListing, "title", "th");
  check("4. Multilingual Fallback", "TH Stays TH", thResult === "คอนโดหรูสุขุมวิท 24", `Expected TH, got: "${thResult}"`);

  // Both missing -> Fallback to Thai
  const noEnZhResult = getLocalizedField<string>(sampleListingNoEn, "title", "cn");
  check("4. Multilingual Fallback", "ZH & EN Missing -> Fallback to TH", noEnZhResult === "บ้านเดี่ยวลาดพร้าว", `Expected TH fallback, got: "${noEnZhResult}"`);

  // Full Chinese present
  const fullZhResult = getLocalizedField<string>(sampleComplete, "title", "cn");
  check("4. Multilingual Fallback", "ZH Present -> Returns Native ZH", fullZhResult === "通罗顶层豪宅", `Expected native ZH, got: "${fullZhResult}"`);

  // 5. Calculate Score
  console.log("-------------------------------------------------------");
  console.log(" 📊 AUDIT SCORE CARD BREAKDOWN BY CATEGORY ");
  console.log("-------------------------------------------------------\n");

  const categories = [...new Set(auditResults.map((r) => r.category))];
  let totalScore = 0;
  let maxScore = 0;

  for (const cat of categories) {
    const items = auditResults.filter((r) => r.category === cat);
    const catScore = items.reduce((sum, i) => sum + i.score, 0);
    const catMax = items.length * 10;
    totalScore += catScore;
    maxScore += catMax;
    const catPercentage = Math.round((catScore / catMax) * 100);

    console.log(`📌 [${cat}] - ${catPercentage}%`);
    for (const item of items) {
      const icon = item.passed ? "  ✅ PASS" : "  ❌ FAIL";
      console.log(`${icon} | ${item.name} -> ${item.details}`);
    }
    console.log("");
  }

  const finalPercentage = Math.round((totalScore / maxScore) * 100);
  console.log("=======================================================");
  console.log(` 🏆 TOTAL GOOGLEBOT SEO READINESS SCORE: ${finalPercentage} / 100 `);
  console.log("=======================================================\n");
}

runSimulation().catch(console.error);
