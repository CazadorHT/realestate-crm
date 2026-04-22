import { LoginForm } from "@/components/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "สมัครสมาชิก | VC Connect Asset",
  description: "เข้าร่วมครอบครัว VC Connect Asset",
};

export default function Page() {
  return <LoginForm defaultView="signup" />;
}
