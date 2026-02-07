import { Metadata } from "next";
import FavoritesPageClient from "./FavoritesPageClient";

export const metadata: Metadata = {
  title: "รายการโปรด",
  description:
    "รายการอสังหาริมทรัพย์ที่คุณบันทึกไว้ สะดวกในการเปรียบเทียบและติดตาม",
};

export default function FavoritesPage() {
  return <FavoritesPageClient />;
}
