import { LoginForm } from "@/components/login-form";
import { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `กู้คืนรหัสผ่าน | ${siteConfig.name}`,
  description: "กู้คืนการเข้าถึงบัญชีของคุณ",
};

export default function Page() {
  return <LoginForm defaultView="forgot-password" />;
}
