import { LoginForm } from "@/components/login-form";
import { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "สมัครสมาชิก",
  description: `เข้าร่วมครอบครัว ${siteConfig.name}`,
};

export default function Page() {
  return <LoginForm defaultView="signup" />;
}
