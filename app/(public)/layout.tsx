import { ReactNode } from "react";
import { CompareBar } from "@/components/public/CompareBar";
import { PublicNav } from "@/components/public/PublicNav";
import { FloatingGroupWrapper } from "@/components/public/FloatingGroupWrapper";
import dynamic from "next/dynamic";

const PublicFooter = dynamic(() => import("@/components/public/PublicFooter").then(mod => mod.PublicFooter), {
  ssr: true,
  loading: () => <div className="h-[400px] bg-slate-900 w-full animate-pulse" />
});

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicNav />
      {children}
      <FloatingGroupWrapper />
      <CompareBar />
      <PublicFooter />
    </>
  );
}
