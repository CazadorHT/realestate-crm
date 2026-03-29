export const metaConfig = {
  appId: process.env.META_APP_ID || "",
  appSecret: process.env.META_APP_SECRET || "",
  verifyToken: process.env.META_VERIFY_TOKEN || "",
  pageAccessToken: process.env.META_PAGE_ACCESS_TOKEN || "",
  instagramBusinessId: process.env.META_INSTAGRAM_BUSINESS_ID || "",
  graphApiUrl: "https://graph.facebook.com/v19.0",
  whatsappPhoneNumberId: process.env.META_WHATSAPP_PHONE_NUMBER_ID || "",
  whatsappAccessToken: process.env.META_WHATSAPP_ACCESS_TOKEN || "",
};
