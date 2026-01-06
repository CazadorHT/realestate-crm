import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PendingApprovalCard() {
  return (
    <Card className="p-12 text-center border-dashed">
      <CardHeader>
        <CardTitle className="text-2xl">
          บัญชีของคุณอยู่ระหว่างการรออนุมัติ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground max-w-md mx-auto">
          ยินดีต้อนรับสู่ระบบ!
          เนื่องจากระบบนี้จำกัดการเข้าถึงเฉพาะเอเจนท์ที่ได้รับอนุญาตเท่านั้น
          รบกวนรอแอดมินปลดล็อคสิทธิ์ให้คุณ (AGENT) ก่อน
          จึงจะสามารถดูข้อมูลบ้านและลูกค้าได้ครับ
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <Button asChild>
            <Link href="/protected/profile">ไปที่หน้าโปรไฟล์ของคุณ</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
