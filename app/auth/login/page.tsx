import { LoginForm } from "@/components/login-form";
import { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `เข้าสู่ระบบ | ${siteConfig.name}`,
  description: siteConfig.description,
};

export default function Page() {
  return <LoginForm />;
}
