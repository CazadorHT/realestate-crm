import { ReactNode } from "react";
import { CompareBar } from "@/components/public/CompareBar";
import { PublicNav } from "@/components/public/PublicNav";
import { FloatingActionMenu } from "@/components/public/FloatingActionMenu";
import { FloatingContactDial } from "@/components/public/FloatingContactDial";
import { PublicFooter } from "@/components/public/PublicFooter";
import { ChatWidget } from "@/components/chatbot/ChatWidget";

import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicNav />
      {children}
      <FloatingContactDial />
      <FloatingActionMenu />
      <CompareBar />

      <PublicFooter />
      <ChatWidget />
    </>
  );
}
