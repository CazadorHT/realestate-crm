import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "เปรียบเทียบทรัพย์ | Your Real Estate Company",
  description: "เปรียบเทียบราคา ทำเล และรายละเอียดของทรัพย์ที่คุณสนใจ",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
