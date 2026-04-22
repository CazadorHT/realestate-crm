import { LoginForm } from "@/components/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ | VC Connect Asset",
  description: "ระบบจัดการอสังหาริมทรัพย์และ CRM Solution",
};

export default function Page() {
  return <LoginForm />;
}
