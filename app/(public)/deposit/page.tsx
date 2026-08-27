import { Metadata } from "next";
import DepositPageClient from "./DepositPageClient";

import { siteConfig } from "@/lib/site-config";
import { getServerTranslations } from "@/lib/i18n";
import { getSiteSettings } from "@/features/site-settings/actions";

export const revalidate = 31536000; // 1 year long-term cache (ISR with on-demand purge)

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();

  return {
    title: t("metadata.deposit_title", { siteName: siteConfig.name }),
    description: t("metadata.deposit_description"),
  };
}

const faqData: Record<string, { q: string; a: string }[]> = {
  th: [
    {
      q: "การฝากปล่อยเช่าหรือฝากขายอสังหาริมทรัพย์มีค่าใช้จ่ายหรือไม่?",
      a: "ไม่มีค่าใช้จ่ายล่วงหน้าใดๆ ทั้งสิ้นครับ! บริการลงประกาศโฆษณา ทำการตลาด และประชาสัมพันธ์อสังหาริมทรัพย์ของเราฟรี 100% โดยเราจะจัดเก็บค่าบริการนายหน้า (Commission) เฉพาะเมื่อเกิดการปิดการขายหรือการทำสัญญาเช่าสำเร็จเท่านั้น"
    },
    {
      q: "ทีมงานทำการตลาดโปรโมททรัพย์สินผ่านช่องทางใดบ้าง?",
      a: "เราทำการตลาดให้ครบวงจรและครอบคลุมทุกช่องทางหลัก เช่น การลงโฆษณาผ่าน Facebook Ads, LINE Ads, TikTok, เว็บไซต์ลงประกาศอสังหาริมทรัพย์ชั้นนำอย่าง LivingInsider, และการจับคู่ทรัพย์สินกับฐานข้อมูลผู้ซื้อ/ผู้เช่าและเครือข่ายเอเจนท์พันธมิตรขนาดใหญ่ของเรา"
    },
    {
      q: "ต้องเตรียมเอกสารและข้อมูลอะไรบ้างสำหรับการฝากทรัพย์?",
      a: "ในเบื้องต้นใช้เพียงข้อมูลรายละเอียดของทรัพย์สิน เช่น ประเภทอสังหาฯ, ชื่อโครงการ, ขนาดพื้นที่, จำนวนห้องนอน/ห้องน้ำ, รูปถ่ายของทรัพย์สิน และสำเนาโฉนดที่ดิน (ถ้ามี) เมื่อท่านลงข้อมูลเสร็จสิ้น ทีมงานนายหน้าผู้เชี่ยวชาญจะติดต่อกลับเพื่ออำนวยความสะดวกเรื่องเอกสารให้ทันทีครับ"
    }
  ],
  en: [
    {
      q: "Are there any upfront fees for listing my property with VC Connect Asset?",
      a: "Absolutely not! Listing and marketing your property is 100% free. We only charge standard brokerage commissions upon successful sales or lease contract execution."
    },
    {
      q: "Which channels will be used to promote my property?",
      a: "We promote your property across major online networks, including targeted Facebook Ads, LINE Ads, TikTok, popular Thai real estate portals like LivingInsider, and by matching it directly with our active buyer/tenant database and co-broker networks."
    },
    {
      q: "What information and documents are required to start?",
      a: "Initially, we only need basic details: property type, project name, area size, bedrooms/bathrooms, photos, and a copy of the title deed (if available). Our agents will contact you to assist with any further documents."
    }
  ],
  cn: [
    {
      q: "通过 VC Connect Asset 委托出租或出售房产需要支付前期费用吗？",
      a: "完全不需要！发布和推广您的房产是100%免费的。我们仅在成功达成买卖或租赁合同后收取标准经纪佣金。"
    },
    {
      q: "你们会通过哪些渠道推广我的房产？",
      a: "我们会在各大主流网络平台推广您的房产，包括定向 Facebook 广告、LINE 广告、TikTok、泰国知名房地产门户网站（如 LivingInsider），并直接与我们的活跃买家/租客数据库及合作中介网络进行匹配。"
    },
    {
      q: "开始委托需要准备哪些信息和文件？",
      a: "起初，我们只需要基本信息：物业类型、项目名称、面积大小、卧室/浴室数量、照片以及地契复印件（如有）。我们的经纪人会联系您以协助处理后续文件。"
    }
  ],
  ru: [
    {
      q: "Есть ли предварительная плата за размещение моей недвижимости в VC Connect Asset?",
      a: "Абсолютно нет! Размещение объявлений и маркетинг вашей недвижимости бесплатны на 100%. Мы взимаем стандартную брокерскую комиссию только после успешного подписания договора купли-продажи или аренды."
    },
    {
      q: "Какие каналы будут использоваться для продвижения моей недвижимости?",
      a: "Мы продвигаем ваш объект в крупнейших онлайн-сетях, включая таргетированную рекламу в Facebook, LINE, TikTok, на популярных тайских порталах недвижимости (таких как LivingInsider), а также путем прямого сопоставления с базой активных покупателей/арендаторов и сетью ко-брокеров."
    },
    {
      q: "Какая информация и документы необходимы для начала?",
      a: "Для начала нужны лишь базовые данные: тип недвижимости, название проекта, площадь, количество спален/ванных комнат, фотографии и копия свидетельства о праве собственности (при наличии). Наш агент свяжется с вами для помощи с остальными документами."
    }
  ]
};

export default async function DepositPage() {
  const { language } = await getServerTranslations();
  const settings = await getSiteSettings();

  const siteName = settings.site_name || siteConfig.name;
  const companyName = settings.company_name || siteConfig.company;
  const contactPhone = settings.contact_phone || siteConfig.contact.phone;
  const contactEmail = settings.contact_email || siteConfig.contact.email;
  const contactAddress = settings.contact_address || siteConfig.contact.address;

  // 1. Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": companyName,
    "alternateName": siteName,
    "url": siteConfig.url,
    "logo": `${siteConfig.url}${siteConfig.logo}`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": contactPhone,
      "contactType": "customer service",
      "email": contactEmail,
      "areaServed": "TH",
      "availableLanguage": ["Thai", "English", "Chinese", "Russian"]
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": contactAddress,
      "addressCountry": "TH"
    }
  };

  // 2. FAQ Schema
  const activeFaqs = faqData[language] || faqData["th"];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": activeFaqs.map((faq) => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <DepositPageClient />
    </>
  );
}
