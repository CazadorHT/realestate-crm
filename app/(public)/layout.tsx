import { ReactNode } from "react";
import { CompareBar } from "@/components/public/CompareBar";
import { PublicNav } from "@/components/public/PublicNav";
import { FloatingGroupWrapper } from "@/components/public/FloatingGroupWrapper";
import { PublicFooter } from "@/components/public/PublicFooter";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <PublicNav />
      <div className="flex-1 w-full min-h-[100dvh]">
        {children}
      </div>
      <FloatingGroupWrapper />
      <CompareBar />
      <PublicFooter />
    </div>
  );
}
