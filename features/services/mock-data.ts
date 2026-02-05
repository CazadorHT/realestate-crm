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
    description:
      "บริการออกแบบตกแต่งภายในครบวงจร ทั้งบ้านพักอาศัย คอนโด และออฟฟิศ โดยทีมดีไซเนอร์มืออาชีพ",
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
    description:
      "บริการทำความสะอาดบ้าน คอนโด สำนักงาน ก่อนเข้าอยู่หรือหลังย้ายออก พร้อมอุปกรณ์และน้ำยาทำความสะอาดคุณภาพสูง",
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
    description:
      "บริการขนย้ายบ้าน คอนโด สำนักงาน พร้อมทีมงานมืออาชีพ ดูแลทรัพย์สินของคุณอย่างปลอดภัย",
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
    description:
      "บริการล้างแอร์ ซ่อมแอร์ และติดตั้งแอร์ใหม่ โดยช่างผู้ชำนาญ รับประกันผลงาน",
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
