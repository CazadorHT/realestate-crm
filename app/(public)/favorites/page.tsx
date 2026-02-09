import { Metadata } from "next";
import FavoritesPageClient from "./FavoritesPageClient";

export const metadata: Metadata = {
  title: "My Favorites (รายการโปรด)",
  description:
    "View and manage your saved properties. ดูและจัดการรายการอสังหาริมทรัพย์ที่คุณบันทึกไว้ เพื่อการเปรียบเทียบและตัดสินใจที่ดีที่สุด",
};

export default function FavoritesPage() {
  return <FavoritesPageClient />;
}
