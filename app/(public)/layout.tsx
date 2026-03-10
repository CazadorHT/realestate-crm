import { ReactNode } from "react";
import { CompareBar } from "@/components/public/CompareBar";
import { PublicNav } from "@/components/public/PublicNav";
import { FloatingRightGroup } from "@/components/public/FloatingRightGroup";
import { PublicFooter } from "@/components/public/PublicFooter";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicNav />
      {children}
      <FloatingRightGroup />
      <CompareBar />
      <PublicFooter />
    </>
  );
}
