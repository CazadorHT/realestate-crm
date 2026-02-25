"use client";

import { ThemeProvider } from "@/components/theme-provider";

export default function AuthLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      storageKey="admin-theme"
    >
      {children}
    </ThemeProvider>
  );
}
