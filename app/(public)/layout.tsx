import { ReactNode } from "react";
import { CompareBar } from "@/components/public/CompareBar";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <CompareBar />
    </>
  );
}
