"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ShieldAlert, QrCode, Key, Loader2, CheckCircle2 } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function MfaEnrollPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<"intro" | "qr" | "verify" | "success">("intro");
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");

  const startEnrollment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (error) throw error;

      setFactorId(data.id);
      setTotpSecret(data.totp.secret);
      setQrCodeUrl(data.totp.qr_code);
      setStep("qr");
    } catch (error: any) {
      toast.error(error.message || "Failed to start MFA enrollment");
    } finally {
      setLoading(false);
    }
  };

  const verifyEnrollment = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      setStep("success");
      toast.success("MFA Enrollment successful!");
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <m.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-max-w-md"
        >
          <Card className="border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl">
            <CardHeader className="text-center space-y-1">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {step === "intro" && <ShieldCheck className="h-8 w-8" />}
                {step === "qr" && <QrCode className="h-8 w-8" />}
                {step === "verify" && <Key className="h-8 w-8" />}
                {step === "success" && <CheckCircle2 className="h-8 w-8" />}
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                {step === "intro" && "ยกระดับความปลอดภัย"}
                {step === "qr" && "สแกน QR Code"}
                {step === "verify" && "ยืนยันรหัสผ่าน"}
                {step === "success" && "ตั้งค่าสำเร็จ!"}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {step === "intro" && "เนื่องจากคุณเป็นผู้ดูแลระบบ เราขอให้คุณตั้งค่าการยืนยันตัวตนแบบ 2 ขั้นตอน (MFA) เพื่อความปลอดภัยสูงสุด"}
                {step === "qr" && "ใช้แอป Authenticator (เช่น Google Authenticator) สแกนรหัสนี้"}
                {step === "verify" && "กรอกรหัส 6 หลักจากแอปของคุณเพื่อเสร็จสิ้นการตั้งค่า"}
                {step === "success" && "บัญชีของคุณได้รับการปกป้องด้วย MFA เรียบร้อยแล้ว"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pb-8">
              {step === "qr" && (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="rounded-xl bg-white p-4 shadow-inner ring-1 ring-black/5">
                    {/* Using an external QR service for simplicity as we don't have a local lib */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                      alt="MFA QR Code"
                      className="h-48 w-48"
                    />
                  </div>
                  <div className="w-full rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">หรือกรอกรหัสลับ (Secret Key)</p>
                    <code className="text-sm font-mono break-all">{totpSecret}</code>
                  </div>
                </div>
              )}

              {step === "verify" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Authentication Code</Label>
                    <Input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                      maxLength={6}
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              {step === "intro" && (
                <Button className="w-full h-12 text-lg font-semibold" onClick={startEnrollment} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "เริ่มตั้งค่าตอนนี้"}
                </Button>
              )}

              {step === "qr" && (
                <Button className="w-full h-12 text-lg font-semibold" onClick={() => setStep("verify")}>
                  สแกนแล้ว ดำเนินการต่อ
                </Button>
              )}

              {step === "verify" && (
                <div className="flex w-full gap-3">
                  <Button variant="outline" className="flex-1 h-12" onClick={() => setStep("qr")}>
                    กลับ
                  </Button>
                  <Button className="flex-2 h-12 text-lg font-semibold" onClick={verifyEnrollment} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "ตรวจสอบรหัส"}
                  </Button>
                </div>
              )}

              {step === "success" && (
                <Button className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20" onClick={() => router.push("/protected/dashboard")}>
                  ไปที่หน้า Dashboard
                </Button>
              )}

              {step !== "success" && (
                <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => router.back()}>
                  ยกเลิก
                </Button>
              )}
            </CardFooter>
          </Card>
        </m.div>
      </AnimatePresence>
    </div>
  );
}
