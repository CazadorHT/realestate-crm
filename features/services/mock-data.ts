/**
 * Mock data for Services module - FOR DEVELOPMENT ONLY
 * TODO: Remove this file when real data is available in the database
 */

import { ServiceRow } from "@/features/services/actions";

export const MOCK_SERVICES: ServiceRow[] = [
  {
    id: "mock-1",
    slug: "interior-design",
    title: "Interior Design",
    title_en: "Interior Design",
    title_cn: "室内设计",
    description:
      "บริการออกแบบตกแต่งภายในครบวงจร ทั้งบ้านพักอาศัย คอนโด และออฟฟิศ โดยทีมดีไซเนอร์มืออาชีพ",
    description_en:
      "Complete interior design services for homes, condos, and offices by professional designers.",
    description_cn: "由专业设计师为住宅、公寓和办公室提供完善的室内设计服务。",
    content: `
      <h2>บริการออกแบบตกแต่งภายใน</h2>
      <p>เราให้บริการออกแบบตกแต่งภายในครบวงจร ตั้งแต่การวางแผน ออกแบบ ไปจนถึงควบคุมงานก่อสร้าง</p>
      <h3>บริการของเรา</h3>
      <ul>
        <li>ออกแบบและตกแต่งภายในบ้านพักอาศัย</li>
        <li>ออกแบบคอนโดมิเนียม</li>
        <li>ออกแบบสำนักงาน</li>
        <li>ออกแบบร้านค้าและพื้นที่เชิงพาณิชย์</li>
      </ul>
    `,
    content_en: `
      <h2>Interior Design Services</h2>
      <p>We provide full-service interior design from planning and design to construction supervision.</p>
      <h3>Our Services</h3>
      <ul>
        <li>Residential Interior Design</li>
        <li>Condominium Design</li>
        <li>Office Design</li>
        <li>Retail and Commercial Space Design</li>
      </ul>
    `,
    content_cn: `
      <h2>室内设计服务</h2>
      <p>我们提供从规划、设计到施工监理的全方位室内设计服务。</p>
      <h3>我们的服务</h3>
      <ul>
        <li>住宅室内设计</li>
        <li>公寓设计</li>
        <li>办公室设计</li>
        <li>零售和商业空间设计</li>
      </ul>
    `,
    cover_image:
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80",
    gallery_images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
    ],
    price_range: "เริ่มต้น 1,500 บาท/ตร.ม.",
    contact_link: "https://line.me/ti/p/@omaasset",
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-2",
    slug: "cleaning-service",
    title: "Cleaning Service",
    title_en: "Cleaning Service",
    title_cn: "清洁服务",
    description:
      "บริการทำความสะอาดบ้าน คอนโด สำนักงาน ก่อนเข้าอยู่หรือหลังย้ายออก พร้อมอุปกรณ์และน้ำยาทำความสะอาดคุณภาพสูง",
    description_en:
      "Cleaning services for homes, condos, and offices. Move-in/move-out with high-quality supplies.",
    description_cn:
      "为住宅、公寓和办公室提供清洁服务。入住/搬出，配备高质量清洁用品。",
    content: `
      <h2>บริการทำความสะอาด</h2>
      <p>บริการทำความสะอาดมืออาชีพ ครบทุกพื้นที่ ทั้งบ้าน คอนโด และสำนักงาน</p>
      <h3>ประเภทบริการ</h3>
      <ul>
        <li>ทำความสะอาดก่อนเข้าอยู่ (Move-in Cleaning)</li>
        <li>ทำความสะอาดหลังย้ายออก (Move-out Cleaning)</li>
        <li>ทำความสะอาดประจำสัปดาห์/เดือน</li>
        <li>ทำความสะอาดแบบ Deep Clean</li>
      </ul>
    `,
    content_en: `
      <h2>Cleaning Services</h2>
      <p>Professional cleaning services for homes, condos, and offices.</p>
      <h3>Service Types</h3>
      <ul>
        <li>Move-in Cleaning</li>
        <li>Move-out Cleaning</li>
        <li>Weekly/Monthly Cleaning</li>
        <li>Deep Cleaning</li>
      </ul>
    `,
    content_cn: `
      <h2>清洁服务</h2>
      <p>为住宅、公寓和办公室提供专业的清洁服务。</p>
      <h3>服务类型</h3>
      <ul>
        <li>入住清洁</li>
        <li>搬出清洁</li>
        <li>每周/每月清洁</li>
        <li>深度清洁</li>
      </ul>
    `,
    cover_image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80",
    gallery_images: [
      "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&q=80",
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600&q=80",
    ],
    price_range: "เริ่มต้น 2,500 บาท",
    contact_link: "https://line.me/ti/p/@omaasset",
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-3",
    slug: "moving-service",
    title: "Moving Service",
    title_en: "Moving Service",
    title_cn: "搬家服务",
    description:
      "บริการขนย้ายบ้าน คอนโด สำนักงาน พร้อมทีมงานมืออาชีพ ดูแลทรัพย์สินของคุณอย่างปลอดภัย",
    description_en:
      "Moving services for homes, condos, and offices with professional staff ensure property safety.",
    description_cn:
      "由专业人员为住宅、公寓和办公室提供搬家服务，确保财产安全。",
    content: `
      <h2>บริการขนย้าย</h2>
      <p>บริการขนย้ายครบวงจร ตั้งแต่แพ็คของ ขนย้าย ไปจนถึงจัดวางของในที่พักใหม่</p>
      <h3>บริการของเรา</h3>
      <ul>
        <li>ขนย้ายบ้าน</li>
        <li>ขนย้ายคอนโดมิเนียม</li>
        <li>ขนย้ายสำนักงาน</li>
        <li>บริการแพ็คและห่อของ</li>
      </ul>
    `,
    content_en: `
      <h2>Moving Services</h2>
      <p>Full-service moving: from packing and transport to organization in your new location.</p>
      <h3>Our Services</h3>
      <ul>
        <li>Home Moving</li>
        <li>Condo Moving</li>
        <li>Office Moving</li>
        <li>Packing and Wrapping Services</li>
      </ul>
    `,
    content_cn: `
      <h2>搬家服务</h2>
      <p>全方位搬家服务：从打包、运输到新居布置。</p>
      <h3>我们的服务</h3>
      <ul>
        <li>居家搬迁</li>
        <li>公寓搬迁</li>
        <li>办公室搬迁</li>
        <li>打包和包装服务</li>
      </ul>
    `,
    cover_image:
      "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=800&q=80",
    gallery_images: [
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=600&q=80",
    ],
    price_range: "เริ่มต้น 3,000 บาท",
    contact_link: "https://line.me/ti/p/@omaasset",
    sort_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-4",
    slug: "aircon-maintenance",
    title: "Air Conditioning Maintenance",
    title_en: "Air Conditioning Maintenance",
    title_cn: "空调维护",
    description:
      "บริการล้างแอร์ ซ่อมแอร์ และติดตั้งแอร์ใหม่ โดยช่างผู้ชำนาญ รับประกันผลงาน",
    description_en:
      "Air conditioning cleaning, repair, and installation by skilled technicians with guaranteed work.",
    description_cn: "由专业技术人员提供空调清洗、维修和安装服务，质量保证。",
    content: `
      <h2>บริการดูแลเครื่องปรับอากาศ</h2>
      <p>บริการครบวงจรสำหรับเครื่องปรับอากาศของคุณ</p>
      <h3>บริการของเรา</h3>
      <ul>
        <li>ล้างแอร์บ้าน/คอนโด</li>
        <li>ซ่อมเครื่องปรับอากาศ</li>
        <li>ติดตั้งแอร์ใหม่</li>
        <li>เติมน้ำยาแอร์</li>
      </ul>
    `,
    content_en: `
      <h2>Air Conditioning Maintenance</h2>
      <p>Comprehensive service for your air conditioning satisfaction.</p>
      <h3>Our Services</h3>
      <ul>
        <li>Home/Condo AC Cleaning</li>
        <li>AC Repair</li>
        <li>New AC Installation</li>
        <li>Refrigerant Refill</li>
      </ul>
    `,
    content_cn: `
      <h2>空调维护</h2>
      <p>为您的空调提供全方位服务。</p>
      <h3>我们的服务</h3>
      <ul>
        <li>住宅/公寓空调清洗</li>
        <li>空调维修</li>
        <li>新空调安装</li>
        <li>制冷剂充填</li>
      </ul>
    `,
    cover_image:
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80",
    gallery_images: [],
    price_range: "เริ่มต้น 400 บาท/เครื่อง",
    contact_link: "https://line.me/ti/p/@omaasset",
    sort_order: 4,
    is_active: false, // Hidden for demo
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Use this to toggle between mock and real data
 * Set to true to use mock data, false to use real database
 */
export const USE_MOCK_SERVICES = true;
