import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "รายการโปรด",
  description: "รายการทรัพย์สินที่คุณบันทึกไว้ ดูบ้าน คอนโด สำนักงานออฟฟิศที่คุณสนใจ",
  robots: {
    index: false,
    follow: false,
  },
};

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
