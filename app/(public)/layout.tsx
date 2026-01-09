import { ReactNode } from "react";
import { CompareBar } from "@/components/public/CompareBar";
import { PublicNav } from "@/components/public/PublicNav";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicNav />
      {children}
      <CompareBar />
    </>
  );
}
