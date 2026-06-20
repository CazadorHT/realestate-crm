import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  lineId: z.string().optional(),
  wechatId: z.string().optional(),
  whatsapp: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  referral_url: z.string().optional(),
  ai_score: z.string().optional(),
  ai_status_label: z.string().optional(),
});

const getOptionalString = (val: any) => {
  if (val === null || val === undefined) return undefined;
  const str = val.toString().trim();
  return str === "" ? undefined : str;
};

const getRequiredString = (val: any) => {
  if (val === null || val === undefined) return "";
  return val.toString().trim();
};

// Simulate what FormData might have
const testData = {
  name: "Hunter Patarapol",
  phone: "094-880-0968".replace(/\D/g, ""), // "0948800968"
  email: "",
  lineId: "",
  wechatId: undefined,
  whatsapp: undefined,
  subject: "buy", // or "อยากซื้อ"
  message: "",
};

const validated = contactSchema.safeParse({
  name: getRequiredString(testData.name),
  phone: testData.phone,
  email: getOptionalString(testData.email),
  lineId: getOptionalString(testData.lineId),
  wechatId: getOptionalString(testData.wechatId),
  whatsapp: getOptionalString(testData.whatsapp),
  subject: getRequiredString(testData.subject),
  message: getOptionalString(testData.message),
});

console.log("Validation Result:", validated.success);
if (!validated.success) {
  console.log("Errors:", validated.error.flatten().fieldErrors);
} else {
  console.log("Parsed Data:", validated.data);
}
