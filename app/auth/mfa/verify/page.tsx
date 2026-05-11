"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Key, Loader2, LogOut } from "lucide-react";
import { m } from "framer-motion";
import { toast } from "sonner";

export default function MfaVerifyPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [factorId, setFactorId] = useState("");

  useEffect(() => {
    const fetchFactor = async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        toast.error("Failed to list MFA factors");
        return;
      }
      
      const totpFactor = data.totp.find(f => f.status === "verified");
      if (totpFactor) {
        setFactorId(totpFactor.id);
      } else {
        router.push("/auth/mfa/enroll");
      }
    };

    fetchFactor();
  }, [supabase, router]);

  const onVerify = async () => {
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

      toast.success("Identity verified!");
      router.push("/protected/dashboard");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const onSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="text-center space-y-1">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">ยืนยันตัวตน 2 ขั้นตอน</CardTitle>
            <CardDescription className="text-muted-foreground">
              กรุณากรอกรหัส 6 หลักจากแอป Authenticator ของคุณเพื่อเข้าถึงข้อมูลที่สำคัญ
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="sr-only">Authentication Code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000 000"
                  className="text-center text-3xl tracking-[0.2em] font-mono h-20 bg-muted/30 border-dashed border-2 focus:border-primary transition-all"
                  maxLength={6}
                  autoFocus
                  value={verifyCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setVerifyCode(val);
                    if (val.length === 6) {
                      // Trigger verification automatically when 6 digits are reached
                      // (Optional UI enhancement)
                    }
                  }}
                  onKeyDown={(e) => e.key === "Enter" && onVerify()}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 bg-muted/10 p-6">
            <Button className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/10 group" onClick={onVerify} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>
                  ยืนยันรหัส
                  <Key className="ml-2 h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </Button>
            
            <div className="flex w-full items-center justify-between mt-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={onSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                ออกจากระบบ
              </Button>
              <Button variant="link" size="sm" className="text-primary h-auto p-0" onClick={() => router.push("/auth/mfa/enroll")}>
                พบปัญหา? ตั้งค่าใหม่
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <p className="text-center mt-6 text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Real Estate CRM. Secure Enterprise Access.
        </p>
      </m.div>
    </div>
  );
}
