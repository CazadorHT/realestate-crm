"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { updateProfileAction } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const profileSchema = z.object({
  full_name: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  phone: z.string().optional(),
  line_id: z.string().optional(),
  facebook_url: z.string().optional(),
  whatsapp_id: z.string().optional(),
  wechat_id: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileInfoFormProps {
  fullName: string | null;
  phone: string | null;
  line_id: string | null;
  facebook_url: string | null;
  whatsapp_id: string | null;
  wechat_id: string | null;
  email: string | null;
  role: string | null;
}

export function ProfileInfoForm({
  fullName,
  phone,
  line_id,
  facebook_url,
  whatsapp_id,
  wechat_id,
  email,
  role,
}: ProfileInfoFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: fullName || "",
      phone: phone || "",
      line_id: line_id || "",
      facebook_url: facebook_url || "",
      whatsapp_id: whatsapp_id || "",
      wechat_id: wechat_id || "",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("full_name", values.full_name);
      if (values.phone) {
        formData.append("phone", values.phone);
      }
      if (values.line_id) formData.append("line_id", values.line_id);
      if (values.facebook_url)
        formData.append("facebook_url", values.facebook_url);
      if (values.whatsapp_id)
        formData.append("whatsapp_id", values.whatsapp_id);
      if (values.wechat_id) formData.append("wechat_id", values.wechat_id);

      const result = await updateProfileAction(formData);

      if (result.success) {
        toast.success("บันทึกข้อมูลโปรไฟล์สำเร็จ");
        router.push("/protected");
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ชื่อ-นามสกุล</FormLabel>
              <FormControl>
                <Input placeholder="กรอกชื่อ-นามสกุล" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>เบอร์โทรศัพท์ (เริ่มต้นด้วย 0)</FormLabel>
              <FormControl>
                <Input placeholder="0xx-xxx-xxxx" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="line_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Line ID</FormLabel>
                <FormControl>
                  <Input placeholder="@yourlineid" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="facebook_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Facebook Link</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://facebook.com/username"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="whatsapp_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp (เบอร์โทร)</FormLabel>
                <FormControl>
                  <Input placeholder="66xxxxxxxxx" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="wechat_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WeChat ID</FormLabel>
                <FormControl>
                  <Input placeholder="WeChatID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-muted-foreground">
            อีเมล
          </Label>
          <Input
            id="email"
            value={email || ""}
            disabled
            className="bg-muted cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">
            ไม่สามารถแก้ไขอีเมลได้
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role" className="text-muted-foreground">
            บทบาท
          </Label>
          <Input
            id="role"
            value={role || "AGENT"}
            disabled
            className="bg-muted cursor-not-allowed uppercase"
          />
          <p className="text-xs text-muted-foreground">
            ติดต่อผู้ดูแลระบบเพื่อเปลี่ยนบทบาท
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            "บันทึกการเปลี่ยนแปลง"
          )}
        </Button>
      </form>
    </Form>
  );
}
