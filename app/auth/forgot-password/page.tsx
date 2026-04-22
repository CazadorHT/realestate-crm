import { LoginForm } from "@/components/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "กู้คืนรหัสผ่าน | VC Connect Asset",
  description: "กู้คืนการเข้าถึงบัญชีของคุณ",
};

export default function Page() {
  return <LoginForm defaultView="forgot-password" />;
}
