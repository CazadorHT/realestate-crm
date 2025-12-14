"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createOwnerAction, updateOwnerAction } from "./actions";
import type { Owner } from "./types";

const FormSchema = z.object({
  full_name: z.string().min(1, "กรุณาระบุชื่อ"),
  phone: z.string().optional(),
  line_id: z.string().optional(),
  facebook_url: z.string().url("URL ไม่ถูกต้อง").optional().or(z.literal("")),
  other_contact: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

interface OwnerFormProps {
  mode: "create" | "edit";
  defaultValues?: Owner;
}

export function OwnerForm({ mode, defaultValues }: OwnerFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: defaultValues
      ? {
          full_name: defaultValues.full_name,
          phone: defaultValues.phone || "",
          line_id: defaultValues.line_id || "",
          facebook_url: defaultValues.facebook_url || "",
          other_contact: defaultValues.other_contact || "",
        }
      : {
          full_name: "",
          phone: "",
          line_id: "",
          facebook_url: "",
          other_contact: "",
        },
  });

  const onSubmit = async (values: FormValues) => {
    if (mode === "create") {
      await createOwnerAction(values);
    } else if (mode === "edit" && defaultValues?.id) {
      await updateOwnerAction(defaultValues.id, values);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-2xl"
      >
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ชื่อเจ้าของ *</FormLabel>
              <FormControl>
                <Input placeholder="ชื่อ-นามสกุล" {...field} />
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
              <FormLabel>เบอร์โทร</FormLabel>
              <FormControl>
                <Input placeholder="081-234-5678" {...field} />
              </FormControl>
              <FormDescription>เบอร์โทรศัพท์ติดต่อเจ้าของ</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="line_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LINE ID</FormLabel>
              <FormControl>
                <Input placeholder="@lineusername" {...field} />
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
              <FormLabel>Facebook URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://facebook.com/..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="other_contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ช่องทางติดต่ออื่นๆ</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="เช่น Email, Instagram, WeChat, ฯลฯ"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit">
            {mode === "create" ? "บันทึก" : "อัปเดต"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            ยกเลิก
          </Button>
        </div>
      </form>
    </Form>
  );
}
