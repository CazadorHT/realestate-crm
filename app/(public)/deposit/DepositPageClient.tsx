"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  Sparkles,
  Shield,
  Megaphone,
  Clock,
  Award,
} from "lucide-react";
import { m } from "framer-motion";
import { FaFacebook, FaLine, FaTiktok } from "react-icons/fa";

const DepositWizard = dynamic(
  () =>
    import("@/components/public/deposit/DepositWizard").then(
      (mod) => mod.DepositWizard,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[620px] bg-slate-100/80 animate-pulse rounded-2xl flex flex-col items-center justify-center border border-slate-100 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin" />
        <p className="text-slate-400 text-xs font-light">Loading premium form wizard...</p>
      </div>
    ),
  },
);

const LOCALIZED_COPY: Record<
  string,
  {
    h1: string;
    h1Sub: string;
    leadDesc: string;
    stepsTitle: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    benefitTitle: string;
    benefits: string[];
    seoArticlesTitle: string;
    seoArticles: { title: string; content: string }[];
  }
> = {
  th: {
    h1: "บริการรับฝากปล่อยเช่า - ฝากขายอสังหาริมทรัพย์ ครบวงจร",
    h1Sub: "ลงประกาศเช่าบ้านฟรี ฝากเช่าคอนโด และออฟฟิศสำนักงาน",
    leadDesc:
      "ลงประกาศเช่าบ้านฟรี ฝากปล่อยเช่าคอนโด และฝากขายบ้าน ที่ดิน ออฟฟิศ สำนักงาน โฮมออฟฟิศ ครบจบในที่เดียว ฟรีค่าการตลาดและการโฆษณา 100% ดูแลโดยทีมงานนายหน้ามืออาชีพทุกขั้นตอน คัดกรองผู้เช่าคุณภาพ ปิดดีลไวในข้อเสนอที่ดีที่สุด",
    stepsTitle: "3 ขั้นตอนง่ายๆ ในการลงประกาศฝากปล่อยเช่าและฝากขาย",
    step1Title: "1. ลงทะเบียนและกรอกข้อมูลทรัพย์",
    step1Desc:
      "เลือกประเภทอสังหาริมทรัพย์ที่ต้องการฝากเช่าหรือฝากขาย ระบุทำเล รายละเอียดโครงการ และราคาที่ต้องการเพื่อเริ่มต้นระบบ",
    step2Title: "2. ตรวจสอบข้อมูลโดยนายหน้ามืออาชีพ",
    step2Desc:
      "ทีมงานผู้เชี่ยวชาญจะติดต่อกลับเพื่อยืนยันสิทธิ์ ตรวจสอบความถูกต้อง พร้อมให้คำปรึกษาเรื่องการตั้งราคาและประเมินตลาดฟรี",
    step3Title: "3. เปิดหน้าการตลาดเชิงรุกเพื่อปิดดีลไว",
    step3Desc:
      "เราจะนำประกาศของคุณไปทำการตลาดออนไลน์และออฟไลน์ทันที ผ่านแพลตฟอร์มชั้นนำและโซเชียลมีเดีย ยิงโฆษณาตรงกลุ่มเป้าหมายจนกว่าจะปิดดีลสำเร็จ",
    benefitTitle: "ทำไมต้องเลือกฝากเช่าและฝากขายกับ VC Connect Asset",
    benefits: [
      "ฟรีค่าการตลาด ค่าโฆษณา และการจัดทำสื่อ 100% ไม่มีเก็บเงินล่วงหน้า",
      "เน้นทำตลาดฝากปล่อยเช่าได้ผู้เช่าไว ช่วยลดความเสี่ยงจากการปล่อยห้องว่าง",
      "มีระบบคัดกรองประวัติผู้เช่าเบื้องต้นและช่วยจัดทำสัญญาเช่าที่รัดกุมเป็นธรรม",
      "มีฐานข้อมูลลูกค้าและเครือข่ายเอเจนท์พันธมิตรรอจับคู่ทรัพย์ (Matching) จำนวนมาก",
      "ดูแลใกล้ชิดทุกขั้นตอน ตั้งแต่วันแรกจนถึงวันส่งมอบห้อง หรือวันโอนกรรมสิทธิ์ ณ กรมที่ดิน",
    ],
    seoArticlesTitle:
      "คู่มือและบทความเชิงลึกเกี่ยวกับการฝากปล่อยเช่าและการฝากขายอสังหาริมทรัพย์",
    seoArticles: [
      {
        title:
          "บริการรับฝากปล่อยเช่าและฝากขายอสังหาริมทรัพย์แบบครบวงจร ปิดดีลไว ได้ราคาดี",
        content:
          "การตัดสินใจฝากปล่อยเช่าหรือฝากขายบ้าน คอนโด ที่ดิน ตลอดจนออฟฟิศและสำนักงาน นับเป็นขั้นตอนสำคัญสำหรับเจ้าของทรัพย์สินทุกท่าน ในสภาวะตลาดปัจจุบันที่มีการแข่งขันสูง การมีนายหน้ามืออาชีพคอยเป็นผู้ช่วยจะช่วยประหยัดเวลาและเพิ่มโอกาสในการเข้าถึงกลุ่มเป้าหมายได้อย่างมหาศาล VC Connect Asset มุ่งมั่นให้บริการรับฝากปล่อยเช่าและฝากขายอสังหาริมทรัพย์อย่างครบวงจร เราพร้อมดูแลตั้งแต่การประเมินวิเคราะห์ราคาตลาดที่เหมาะสม การทำการตลาดออนไลน์เชิงรุก และการกระจายข้อมูลไปยังเครือข่ายเพื่อหาผู้ซื้อและผู้เช่าที่ใช่ในระยะเวลาที่สั้นที่สุด",
      },
      {
        title:
          "ข้อดีของการลงประกาศเช่าบ้านฟรีและการเลือกใช้เอเจนท์ทำการตลาดอสังหาริมทรัพย์",
        content:
          "การเลือกใช้บริการลงประกาศเช่าบ้านฟรีกับเรา ช่วยให้เจ้าของทรัพย์ไม่ต้องแบกรับค่าใช้จ่ายหรือความเสี่ยงในการลงทุนโฆษณาด้วยตนเอง เพราะเราให้บริการทำการตลาดฟรี 100% ไม่มีค่าใช้จ่ายล่วงหน้าใดๆ ทั้งสิ้น เราทำการกระจายข้อมูลอสังหาริมทรัพย์ของท่านไปยังกลุ่มเป้าหมายที่ตรงกลุ่มผ่านช่องทางโฆษณาประสิทธิภาพสูง ไม่ว่าจะเป็นการยิงแอดผ่าน Facebook, LINE, TikTok รวมถึงแพลตฟอร์มพาร์ทเนอร์ยอดนิยมอย่าง LivingInsider และเว็บไซต์อสังหาฯ ชั้นนำ ทำให้ประกาศฝากเช่าคอนโดหรือบ้านเดี่ยวของคุณถูกค้นพบได้ง่าย นำไปสู่การติดต่อเข้าชมทรัพย์และปิดดีลเช่าได้อย่างคุ้มค่าและรวดเร็วที่สุด",
      },
      {
        title:
          "เทคนิคสำหรับเจ้าของทรัพย์: เตรียมบ้านและคอนโดให้พร้อมฝากปล่อยเช่าให้ได้ผู้เช่าไว",
        content:
          "การเตรียมความพร้อมของอสังหาริมทรัพย์ก่อนเปิดบ้านให้ผู้สนใจเข้าชมมีผลอย่างมากต่ออัตราการตัดสินใจเช่า เจ้าของทรัพย์ควรเริ่มต้นจากการทำความสะอาดครั้งใหญ่ (Deep Cleaning) จัดการซ่อมแซมจุดที่ชำรุด เช่น ระบบน้ำประปา ไฟฟ้า หรือสีผนังที่หลุดล่อน การจัดแต่งห้องให้อยู่ในสภาพโปร่งสบาย ถ่ายภาพมุมกว้างที่มีแสงสว่างธรรมชาติเพียงพอ จะช่วยดึงดูดสายตาของผู้เช่าบนแพลตฟอร์มออนไลน์ได้ดียิ่งขึ้น นอกจากนี้ การเตรียมเฟอร์นิเจอร์หลักและเครื่องใช้ไฟฟ้าที่ครบครัน เช่น เครื่องปรับอากาศ เครื่องซักผ้า และตู้เย็น จะเป็นจุดขายสำคัญที่ทำให้ผู้เช่าเลือกห้องของคุณทันทีเมื่อเปรียบเทียบกับห้องว่างอื่นๆ ในโครงการเดียวกัน",
      },
      {
        title:
          "เอกสารสำคัญที่ต้องจัดเตรียมสำหรับฝากปล่อยเช่าและฝากขายบ้าน คอนโด ที่ดิน",
        content:
          "เพื่อความสะดวกรวดเร็วในขั้นตอนการทำสัญญาและป้องกันปัญหาข้อพิพาททางกฎหมาย การเตรียมเอกสารสำหรับฝากอสังหาริมทรัพย์ถือเป็นเรื่องที่ห้ามละเลย เอกสารพื้นฐานที่เจ้าของกรรมสิทธิ์ต้องจัดเตรียม ได้แก่ สำเนาโฉนดที่ดิน (หน้า-หลัง) ที่แสดงรายละเอียดสิทธิ์ชัดเจน, สำเนาทะเบียนบ้านของทรัพย์สินนั้นๆ, และสำเนาบัตรประจำตัวประชาชนหรือหนังสือเดินทางของเจ้าของกรรมสิทธิ์ตามโฉนด ในกรณีที่ทรัพย์สินเป็นประเภทโฮมออฟฟิศ สำนักงาน หรือออฟฟิศที่จดทะเบียนในนามบริษัท จะต้องแนบหนังสือรับรองบริษัทเพิ่มเติมด้วย การเตรียมเอกสารที่ถูกต้องจะช่วยสร้างความมั่นใจให้กับผู้เช่าหรือผู้ซื้อ และทำให้เอเจนท์สามารถปิดงานได้อย่างราบรื่น",
      },
      {
        title:
          "ความปลอดภัยในการทำสัญญาเช่าและการคัดกรองผู้เช่าเพื่อสร้าง Passive Income ระยะยาว",
        content:
          "สัญญาเช่าที่รัดกุมคือหัวใจสำคัญในการปกป้องผลประโยชน์ของฝั่งผู้ให้เช่า ทีมงานนายหน้าของ VC Connect Asset จะเข้าช่วยดูแลในการจัดทำสัญญาเช่ามาตรฐานสากล ครอบคลุมรายละเอียดการวางเงินมัดจำประกันความเสียหาย (Security Deposit) อัตราค่าเช่ารายเดือน กำหนดระยะเวลาเช่าที่ชัดเจน กฎระเบียบของอาคารชุดหรือหมู่บ้านจัดสรร ตลอดจนรายละเอียดการชำระค่าน้ำ ค่าไฟ และค่าส่วนกลาง นอกจากนี้เรายังมีระบบช่วยตรวจสอบประวัติและคัดกรองผู้เช่าเบื้องต้น เพื่อป้องกันปัญหาการค้างชำระค่าเช่าหรือการทำลายทรัพย์สินเสียหาย ช่วยให้เจ้าของทรัพย์สามารถสร้างรายได้จากการเช่าได้อย่างราบรื่นและสบายใจตลอดอายุสัญญาเช่า",
      },
    ],
  },
  en: {
    h1: "Property Consignment & Rental Services",
    h1Sub: "List Your House, Condo, or Office for Free",
    leadDesc:
      "Maximize your rental income or sell fast. Post free listings for houses, condos, plots of land, offices, and commercial workspaces. Enjoy 100% free marketing and premium exposure with zero upfront fees. Handled by professional real estate agents to secure quality tenants and high-yield deals quickly.",
    stepsTitle: "3 Simple Steps to Consign Your Property with Us",
    step1Title: "1. Submit Property Details",
    step1Desc:
      "Select your property type (residential/commercial), input location, specifications, and desired price into our system.",
    step2Title: "2. Agent Verification & Consulting",
    step2Desc:
      "Our professional brokers will review your entry and contact you to verify ownership and provide a complimentary property market valuation.",
    step3Title: "3. Strategic Multi-Channel Marketing",
    step3Desc:
      "We instantly launch professional promotional campaigns across social media and major property listing portals to acquire verified leads fast.",
    benefitTitle: "Advantages of Listing Your Property with VC Connect Asset",
    benefits: [
      "100% Free marketing, digital advertising, and media styling. No hidden upfront fees.",
      "High-speed rental turnaround time to prevent prolonged vacancies and loss of yield.",
      "Thorough tenant screening processes and legally compliant, airtight lease agreement drafting.",
      "Direct connection to an expansive database of active buyers, expatriates, and co-broker networks.",
      "Complete end-to-end guidance, from the initial viewing to keys handover or title deed transfer.",
    ],
    seoArticlesTitle:
      "Guides, Trends & Industry Insights on Real Estate Rental and Sales Management",
    seoArticles: [
      {
        title:
          "Comprehensive Real Estate Consignment & Professional Brokerage Services",
        content:
          "Listing a property for sale or rent in Thailand's highly competitive market requires deep local insight and premium advertising. At VC Connect Asset, we deliver high-impact property consignment services crafted to maximize exposure and speed up the transaction pipeline. Whether you own a modern downtown condo, a suburban pool villa, a strategic commercial plot of land, or a corporate office space, our expert brokers harness digital marketing and proactive agent networks to secure reliable tenants and buyers, providing hassle-free portfolio management from start to finish.",
      },
      {
        title:
          "The Strategic Benefits of Risk-Free Professional Property Listing and Digital Ads",
        content:
          "By choosing our free property listing services, landlords and sellers leverage a full-scale marketing agency budget at zero cost. We execute highly targeted demographic campaigns on platforms like Facebook, TikTok, and Google, while optimizing presence on dominant local real estate portals including LivingInsider. This multi-layered marketing engine transforms your house or condo into a high-visibility listing, putting it directly in front of expatriates and local corporate tenants searching for a fast move-in, resulting in top-tier rental closure rates.",
      },
      {
        title:
          "Landlord Handbook: Professional Staging Tips to Get Your Condo and House Rented Faster",
        content:
          "First impressions dictate rental speed and price appreciation on property portals. We highly advise conducting a professional deep clean and resolving cosmetic or structural flaws (such as plumbing leaks or unstable fixtures) prior to photography. Staging your rooms with spacious, neutral palettes and capitalizing on natural lighting dramatically boosts click-through rates. Furthermore, outfitting the space with key premium appliances—such as smart TVs, modern air conditioning units, an integrated washing machine, and a refrigerator—positions your asset above standard inventory in the same development.",
      },
      {
        title:
          "Essential Legal Documentation Requirements for Listing and Renting Out Property",
        content:
          "To guarantee smooth legal handling and avoid compliance bottlenecks, landlords must arrange accurate verification files before listing. Standard document requisites include clear copies of the Land Title Deed (Chanote) displaying both front and back ownership logs, valid national identity cards or passports, and the House Registration Book (Tabien Baan). For commercial office buildings or corporate-owned assets, a valid Company Certificate is also required. Having these folders prepared early builds credibility and accelerates final lease generation.",
      },
      {
        title:
          "Securing Rental Yields: Airtight Lease Agreements and Stringent Tenant Screening",
        content:
          "A professional, legally sound lease agreement is the foundation of secure passive income. Our specialized team handles the complete legal drafting of tenancy agreements according to Thai real estate laws, specifying security deposit metrics, damage liability, utility bill boundaries, and breach clauses. We supplement this with pre-qualification checks on applicants' occupational profiles, minimizing the probability of rental defaults or property damages, ensuring your ongoing peace of mind throughout the tenancy lease duration.",
      },
    ],
  },
  cn: {
    h1: "泰国房产代租代售服务 — 免费托管发布",
    h1Sub: "提供公寓、别墅、土地及写写字楼一站式租赁",
    leadDesc:
      "专业的房产代租代售平台。支持全泰国公寓、别墅、土地、商业写字楼、创意办公室及联排别墅的免费房源发布。承诺 100% 零前期广告费用，专业中介团队全程协助数字化营销，严选高质量租客，助您资产快速变现，达成最佳收益。",
    stepsTitle: "简单 3 步，开启您的海外房产轻松托管之旅",
    step1Title: "1. 在线提交房源基本资料",
    step1Desc:
      "选择您的物业类型（住宅或商业办公），填写具体地段、房屋规格及期望的租售价格并提交系统。",
    step2Title: "2. 中介团队专属核实与咨询",
    step2Desc:
      "我们的资深房产经纪人将第一时间与您联系，核实产权信息，并根据当前市场行情提供免费的租售估价。",
    step3Title: "3. 启动多渠道全网数字化营销",
    step3Desc:
      "我们将房源信息录入核心数据库，并在海外主流社交媒体与泰国主流房产门户网站进行全方位推广，精准引流看房。",
    benefitTitle: "为什么选择通过 VC Connect Asset 委托出租和出售房产？",
    benefits: [
      "100% 免费的市场营销与广告推介，绝无任何前期预收或隐藏费用。",
      "高效的代租管理与高曝光推广，帮助业主快速获取租金收益，降低房屋空置风险。",
      "实行严格的租客背景及信用初审机制，专业起草并健全具有法律效力的租赁合同。",
      "直通海外投资者、本地高净值人群以及庞大的同业合作伙伴共享客源渠道。",
      "提供全面的一站式跟踪服务，从首次带看、合同签署到物业交割或土地局过户。",
    ],
    seoArticlesTitle: "泰国房地产租赁管理、物业托管及房产投资深度指南",
    seoArticles: [
      {
        title: "泰国一站式专业房地产委托代租代售服务：高效变现的终极方案",
        content:
          "在竞争激烈的泰国房地产市场中，成功出租或出售您的住宅、公寓或商业写字楼需要强大的多语种市场推广。VC Connect Asset 致力于为广大业主提供透明、专业的房产托管代租代售服务。无论是曼谷市核心商圈的轻轨公寓、普吉或芭提雅的度假别墅，还是大型商业写字楼和商铺，我们的专业房产中介团队都会利用先进的本地市场大数据进行精准定价，并通过成熟的全球线上数字化营销系统在最短的时间内为您匹配高意向的优质买家与跨国企业租客。",
      },
      {
        title: "零风险委托！免费发布房源与全网覆盖数字化营销对房东的核心价值",
        content:
          "选择我们的免费房源发布服务，意味着房东无需承担任何前期高昂的广告费用。我们自资在 Facebook Ads、TikTok、LINE 和微信等主流社交平台以及泰国本地最大的房产综合门户网站（如 LivingInsider）上投放定向海外 and 本土的买方/租客广告。通过这种全天候的公域和私域流量曝光，极大提高了您的房产可见度。在成功达成签约之前，您不需要支付任何额外开销，从而最大化保障了您的资产收益率。",
      },
      {
        title: "房东必读：如何通过软装美化与细节整修让您的精装公寓光速出租",
        content:
          "房产图像和视频的视觉质感直接影响潜在租客的在线点击率。我们强烈建议业主在拍摄和挂牌前对房屋进行深度的家政清洁，并及时修复由于自然折旧产生的细微破损，例如修复漏水阀门或修补墙面。采用清爽、北欧风或现代极简的色调搭配，结合充足的自然采光，能在视觉上成倍放大空间感。同时，配备齐全的现代化高品质家电（如智能空调、智能电视、洗衣机和冰箱）将成为您在同小区众多房源竞争中脱颖어출的致胜法宝。",
      },
      {
        title:
          "业主需知：在泰国办理房产代租和房屋买卖时需提前准备的法律文件清单",
        content:
          "为了确保后续的租赁及销售流程在泰国的法律框架下安全高效进行，房东与卖方必须提前备齐关键的产权文件。必备的基础资料包括：泰国地契（Chanote）正反面清晰扫描件、产权所有人的身份证复印件或有效护照首页复印件、房屋户口本（Tabien Baan）。如果是以公司持有形式的商业办公楼宇或大宗资产，则需要附带三个月内更新的泰国商务部公司证明书。完备的产权材料能够使我们在代办起草合同时更加合规，并显著提升买家租客的交易信任度。",
      },
      {
        title:
          "保障被动收入：起草严谨的泰英双语租赁合同与严格的海外租客背景审查机制",
        content:
          "一份合规且无漏洞的双语租赁合同是维护业主海外资产合法权益的基石。VC Connect Asset 的专业法律中介团队将全程主导合同起草，清晰界定包括房屋押金退还机制、家具家电损坏赔偿标准、水电物业费分摊界限以及违约责任追究等关键细则。针对海外在泰外籍租客，我们更设立了工作背景与有效签证状态初审机制，从而将恶意拖欠房租或损坏房屋设施的坏账率降到最低，全力保障业主的资产在整个租期内能源源不断地产生稳定的现金流。",
      },
    ],
  },
  ru: {
    h1: "Услуги Аренды и Продажи Недвижимости в Таиланде",
    h1Sub: "Бесплатное размещение объявлений: квартиры, виллы и офисы",
    leadDesc:
      "Профессиональное агентство недвижимости. Бесплатное размещение объявлений о сдаче в аренду и продаже квартир, кондоминиумов, вилл, земельных участков и коммерческих офисных помещений. Мы гарантируем 100% бесплатный маркетинг без предоплаты. Наши опытные брокеры подберут надежных арендаторов и покупателей, закрывая сделки в кратчайшие сроки.",
    stepsTitle: "3 простых шага для размещения вашего объекта",
    step1Title: "1. Отправьте данные об объекте",
    step1Desc:
      "Выберите тип недвижимости (жилая или коммерческая), укажите расположение, ключевые характеристики и желаемую стоимость.",
    step2Title: "2. Верификация и бесплатная оценка",
    step2Desc:
      "Наши профессиональные брокеры свяжутся с вами для проверки права собственности и предоставления бесплатной рыночной оценки объекта.",
    step3Title: "3. Запуск активной рекламной кампании",
    step3Desc:
      "Мы мгновенно запускаем таргетированную рекламу и размещаем ваш объект на ведущих порталах недвижимости для быстрого привлечения клиентов.",
    benefitTitle: "Преимущества работы с VC Connect Asset",
    benefits: [
      "100% бесплатный маркетинг, таргетированная реклама и создание контента. Без предоплаты и скрытых комиссий.",
      "Высокая скорость поиска арендаторов для минимизации простоев и сохранения максимальной доходности.",
      "Строгий предварительный отбор кандидатов и юридически грамотное составление договоров аренды.",
      "Прямой доступ к обширной базе активных инвесторов, экспатов и партнерской сети брокеров.",
      "Полное юридическое сопровождение от первого просмотра до передачи ключей или регистрации перехода права собственности.",
    ],
    seoArticlesTitle:
      "Справочник арендодателя: экспертные статьи об управлении и продаже недвижимости в Таиланде",
    seoArticles: [
      {
        title:
          "Комплексное доверительное управление недвижимостью в Таиланде: быстрая аренда и продажа объектов",
        content:
          "Успешная сдача в аренду или продажа жилой и коммерческой недвижимости на высококонкурентном рынке Таиланда требует глубокого понимания специфики локального маркетинга. Агентство VC Connect Asset предлагает собственникам профессиональные брокерские услуги полного цикла. Независимо от того, владеете ли вы кондоминиумом в центре Бангкока, виллой у моря на Пхукете или современным офисным пространством, наши специалисты обеспечат точную рыночную оценку и запустят эффективное продвижение объекта для поиска надежных арендаторов и покупателей в кратчайшие сроки.",
      },
      {
        title:
          "Преимущества бесплатного продвижения недвижимости и цифровой рекламы без предварительных расходов",
        content:
          "Выбирая наши бесплатные услуги по размещению объектов, арендодатели и продавцы полностью перекладывают затраты на маркетинг на наше агентство. Мы инвестируем собственный рекламный бюджет в таргетированные кампании на таких платформах, как Facebook, TikTok и Google, а также продвигаем объявления на крупнейшем тайском портале недвижимости LivingInsider. Это гарантирует максимальный охват аудитории, включая местных жителей и экспатов, при этом стандартная комиссия агентства выплачивается только по факту успешного подписания контракта.",
      },
      {
        title:
          "Полезные советы владельцам: как подготовить квартиру или виллу к быстрой сдаче по максимальной цене",
        content:
          "Первое впечатление от просмотра фотографий объекта в интернете играет решающую роль. Мы настоятельно рекомендуем арендодателям провести генеральную уборку (Deep Cleaning) и устранить мелкие бытовые дефекты перед съемкой. Оформление интерьера в светлых нейтральных тонах и правильное использование естественного освещения визуально расширяют пространство. Комплектация жилья востребованной бытовой техникой, такой как кондиционер, стиральная машина, холодильник и микроволновая печь, мгновенно повышает ценность вашего предложения на рынке.",
      },
      {
        title:
          "Перечень обязательных документов для регистрации сделок аренды и купли-продажи жилья",
        content:
          "Для обеспечения юридической чистоты сделки и предотвращения задержек собственнику необходимо заблаговременно подготовить пакет документов. В стандартный список входят: четкая копия Чанота (Chanote — свидетельство о праве собственности на землю) с двух сторон, копия удостоверения личности или паспорта владельца, а также домовая книга (Tabien Baan), если применимо. Если объект оформлен на юридическое лицо (компанию), потребуется предоставить свежую выписку из департамента регистрации министерства торговли Таиланда. Наличие документов ускоряет оформление официальных договоров.",
      },
      {
        title:
          "Безопасность инвестиций: составление надежных договоров аренды и проверка профиля арендаторов",
        content:
          "Грамотно составленный договор — это основа защиты интересов арендодателя и залог стабильного пассивного дохода. Юридический отдел VC Connect Asset берет на себя подготовку контрактов в полном соответствии с действующим законодательством Таиланда. В договоре четко прописываются условия удержания и возврата страхового депозита, обязательства по оплате коммунальных услуг и штрафные санкции при нарушениях. Дополнительный аудит визового статуса и места работы будущих арендаторов позволяет минимизировать риски задолженностей и порчи имущества.",
      },
    ],
  },
};

export default function DepositPageClient() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  const copy = LOCALIZED_COPY[language] || LOCALIZED_COPY["th"];

  const MARKETING_CHANNELS = [
    {
      name: "Facebook Ads",
      icon: FaFacebook,
      color: "text-[#1877F2]",
      bg: "bg-[#1877F2]/10",
    },
    {
      name: "LINE Ads",
      icon: FaLine,
      color: "text-[#06C755]",
      bg: "bg-[#06C755]/10",
    },
    {
      name: "TikTok Ads",
      icon: FaTiktok,
      color: "text-black dark:text-white",
      bg: "bg-slate-100 dark:bg-slate-800",
    },
    {
      name: "LivingInsider",
      icon: Megaphone,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 relative overflow-hidden pt-16 pb-20">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-linear-to-b from-blue-50 via-indigo-50/30 to-slate-50 -z-10" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[100px] -z-10 translate-x-1/3" />
      <div className="absolute top-60 left-0 w-80 h-80 bg-purple-100/30 rounded-full blur-[100px] -z-10 -translate-x-1/3" />
      <div className="absolute bottom-40 right-1/4 w-64 h-64 bg-indigo-100/20 rounded-full blur-[80px] -z-10" />

        <div className="space-y-16 lg:space-y-20">
          {/* ─── Section 1: Full-Width Hero Banner (w-full for bg) ─── */}
          <div className="w-full bg-linear-to-b from-[#0B1120] via-[#0f172a] to-slate-900 relative overflow-hidden py-16 lg:py-24">
            {/* Dark section background effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px]" />

            {/* Inner Content Wrapper (Stays centered in max-w-2xl) */}
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center max-w-5xl mx-auto space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-500/10 text-blue-400 text-sm font-semibold border border-blue-500/20 shadow-sm backdrop-blur-sm">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  <span>
                    {t("common.free")} {t("common.no_cost")}
                  </span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
                  <span className="block">{copy.h1}</span>
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-indigo-400 to-purple-400">
                    {copy.h1Sub}
                  </span>
                </h1>
                <p className="text-slate-400 text-base sm:text-lg lg:text-xl leading-relaxed font-light max-w-7xl mx-auto">
                  {copy.leadDesc}
                </p>

                {/* Marketing Channels — Horizontal Inline Strip */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                  {MARKETING_CHANNELS.map((ch) => (
                    <div
                      key={ch.name}
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 shadow-xs hover:bg-white/10 hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
                    >
                      <div className={`p-2 rounded-xl ${ch.bg}`}>
                        <ch.icon className={`h-4 w-4 ${ch.color}`} />
                      </div>
                      <span className="text-sm font-semibold text-slate-300">
                        {ch.name}
                      </span>
                    </div>
                  ))}
                </div>
              </m.div>
            </div>
          </div>

          {/* Wrapper for Section 2 & Section 3 (Centered Layout) */}
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="space-y-16 lg:space-y-20">
              {/* ─── Section 2: Form + Benefits Side-by-Side ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                {/* Left: Benefits + Steps (Sidebar) */}
                <m.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="lg:col-span-4 space-y-8 order-2 lg:order-1"
                >
                  {/* Benefits */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8 space-y-5">
                    <h2 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <Award className="h-6 w-6 text-indigo-600 shrink-0" />
                      {copy.benefitTitle}
                    </h2>
                    <div className="space-y-3">
                      {copy.benefits.map((b, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100/80 hover:bg-blue-50/50 hover:border-blue-100 transition-all duration-200"
                        >
                          <Shield className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-slate-700 text-sm leading-relaxed font-medium">
                            {b}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 lg:p-8 space-y-5">
                    <h2 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <Clock className="h-6 w-6 text-purple-600 shrink-0" />
                      {copy.stepsTitle}
                    </h2>
                    <div className="space-y-1">
                      {[
                        { title: copy.step1Title, desc: copy.step1Desc },
                        { title: copy.step2Title, desc: copy.step2Desc },
                        { title: copy.step3Title, desc: copy.step3Desc },
                      ].map((step, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-9 h-9 rounded-full bg-linear-to-br from-indigo-50 to-blue-50 border border-indigo-200 text-indigo-600 flex items-center justify-center text-sm font-bold shadow-xs">
                              {idx + 1}
                            </div>
                            {idx < 2 && (
                              <div className="w-0.5 flex-1 bg-linear-to-b from-indigo-200 to-slate-200 my-1" />
                            )}
                          </div>
                          <div className="pb-5 space-y-1">
                            <h4 className="font-bold text-slate-800 text-sm lg:text-base">
                              {step.title}
                            </h4>
                            <p className="text-slate-500 text-sm leading-relaxed font-light">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </m.div>

                {/* Right: Deposit Form Card */}
                <div className="lg:col-span-8 order-1 lg:order-2 lg:sticky lg:top-24">
                  <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="relative shadow-2xl shadow-indigo-900/10 border-white/80 bg-linear-to-r from-blue-50 via-indigo-50 to-purple-50 bg-transparent backdrop-blur-xl overflow-hidden rounded-3xl p-1 md:p-2 border">
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80" />
                      <CardContent className="p-4 sm:p-6 md:p-8">
                        {isSuccess ? (
                          <div className="text-center py-12 px-4 space-y-6">
                            <div className="w-20 h-20 bg-linear-to-br from-green-50 to-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner mb-4">
                              <CheckCircle className="h-10 w-10" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-2xl font-bold text-slate-900 leading-tight">
                                {t("deposit.success.title") || "ส่งข้อมูลสำเร็จ!"}
                              </h3>
                              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                                {t("deposit.success.message") || "ข้อมูลทรัพย์สินของท่านถูกบันทึกเรียบร้อยแล้ว ทีมงานจะติดต่อกลับโดยเร็วที่สุด"}
                              </p>
                            </div>
                            <div className="flex justify-center gap-3 pt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsSuccess(false)}
                                className="border-slate-200 hover:bg-slate-50! text-blue-500! rounded-xl px-6"
                              >
                                {t("deposit.success.more_info_btn") || "ส่งข้อมูลเพิ่มเติม"}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => router.push("/")}
                                className="bg-blue-600 hover:bg-blue-700 text-white! rounded-xl px-6"
                              >
                                {t("breadcrumb.home") || "หน้าแรก"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="mb-6 space-y-2">
                              <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                                {t("deposit.dialog.title") || "ฝากข้อมูลทรัพย์สิน"}
                              </h2>
                              <p className="text-slate-500 text-xs md:text-sm font-light">
                                {t("deposit.dialog.subtitle") ||
                                  "บริการฝากขาย-เช่า บ้าน คอนโด และออฟฟิศ"}
                              </p>
                            </div>
                            <DepositWizard
                              onSuccessAction={() => setIsSuccess(true)}
                              onCancelAction={() => router.push("/")}
                              location="Landing Page"
                            />
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </m.div>
                </div>
              </div>

              {/* ─── Section 3: SEO Articles ─── */}
              {/* {copy.seoArticles && (
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="pt-16 border-t border-slate-200/60"
                >
                  <div className="space-y-10">
                    <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight text-center">
                      {copy.seoArticlesTitle}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {copy.seoArticles.map((art, idx) => (
                        <article
                          key={idx}
                          className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md hover:border-slate-200/80 transition-all duration-300 group"
                        >
                          <h3 className="text-lg font-bold text-slate-800 mb-3 tracking-tight group-hover:text-blue-700 transition-colors">
                            {art.title}
                          </h3>
                          <p className="text-slate-600 text-sm leading-relaxed font-light">
                            {art.content}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </m.div> */}
              {copy.seoArticles && (
                <m.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                  className="pt-20 border-t border-slate-200/70"
                >
                  <div className="space-y-12 max-w-6xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center space-y-3">
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {copy.seoArticlesTitle}
                      </h2>
                      <div className="w-12 h-1 bg-blue-600 rounded-full mx-auto" />
                    </div>

                    {/* 🌟 Featured Top Article (บทความภาพรวม ย้ายมาจัดแบบจอกว้างเพื่อความสมดุล) */}
                    {copy.seoArticles[0] && (
                      <div className="bg-linear-to-br from-indigo-950 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl border border-white/5">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[80px] -z-0 pointer-events-none" />
                        <div className="relative z-10 space-y-4 max-w-4xl">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider">
                            <Sparkles className="h-3.5 w-3.5 text-blue-400" />{" "}
                            Insight
                          </span>
                          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
                            {copy.seoArticles[0].title}
                          </h3>
                          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light">
                            {copy.seoArticles[0].content}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 🌟 Dynamic Layout: Remaining 4 Articles in Grid (เรียง 2x2 สวยงามไม่มีแหว่ง) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                      {copy.seoArticles.slice(1).map((art, idx) => {
                        // สุ่มสร้างสไตล์ไอคอนและสีการ์ดตัดความเบื่อให้แต่ละบล็อกดูเป็นเรื่องราวที่ต่างกัน
                        const styles = [
                          {
                            icon: Megaphone,
                            color: "text-blue-600",
                            bg: "bg-blue-50",
                          },
                          {
                            icon: Clock,
                            color: "text-purple-600",
                            bg: "bg-purple-50",
                          },
                          {
                            icon: Shield,
                            color: "text-emerald-600",
                            bg: "bg-emerald-50",
                          },
                          {
                            icon: Award,
                            color: "text-amber-600",
                            bg: "bg-amber-50",
                          },
                        ][idx % 4];

                        return (
                          <article
                            key={idx}
                            className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs hover:shadow-lg hover:border-slate-200/80 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                          >
                            <div className="space-y-4">
                              {/* Article Header with Icon Badge */}
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-2.5 rounded-2xl ${styles.bg} ${styles.color} shrink-0`}
                                >
                                  <styles.icon className="h-5 w-5" />
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors duration-200">
                                  {art.title}
                                </h3>
                              </div>

                              {/* Content text */}
                              <p className="text-slate-600 text-sm leading-relaxed font-light">
                                {art.content}
                              </p>
                            </div>

                            {/* Decorative side accent line */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-slate-100 group-hover:bg-blue-500 rounded-r-full transition-all duration-300" />
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </m.div>
              )}
            </div>
          </div>
        </div>
      </main>
  );
}
