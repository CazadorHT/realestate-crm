"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email"),
  subject: z.string().optional(),
  message: z.string().min(1, "Message is required"),
});

export type ContactFormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export async function submitContactFormAction(
  prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const validatedFields = contactSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Please fill in all required fields correctly.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, phone, email, subject, message } = validatedFields.data;

  try {
    const supabase = createAdminClient();

    // Insert into leads table
    const { error } = await supabase.from("leads").insert({
      full_name: name,
      phone: phone,
      email: email,
      source: "WEBSITE", // Generic website source
      stage: "NEW", // Initial stage
      note: `Contact Form Subject: ${subject || "N/A"}\nMessage: ${message}`,
      lead_type: "INDIVIDUAL",
    });

    if (error) {
      console.error("Database Error:", error);
      return {
        success: false,
        message: "ระบบเกิดข้อผิดพลาด กรุณาลองใหม่ภายหลัง",
      };
    }

    revalidatePath("/protected/leads");
    return {
      success: true,
      message: "ส่งข้อความเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Server Error:", error);
    return {
      success: false,
      message: "ระบบเกิดข้อผิดพลาด",
    };
  }
}
