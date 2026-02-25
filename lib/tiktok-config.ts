export const tiktokConfig = {
  clientKey: process.env.TIKTOK_CLIENT_KEY || "",
  clientSecret: process.env.TIKTOK_CLIENT_SECRET || "",
  redirectUri:
    process.env.TIKTOK_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/tiktok`,
  apiUrl: "https://open.tiktokapis.com/v2",
};
