import { ProfileFormValues } from "./profile-schema";

export function calculateProfileScore(profile: any): number {
  let score = 0;
  
  // Basic Info (50%)
  if (profile.avatar_url) score += 25;
  if (profile.full_name) score += 25;
  
  // Contact Info (50%)
  if (profile.phone) score += 20;
  
  // Socials (Max 30% from these, capped at 100% total)
  if (profile.line_id) score += 10;
  if (profile.facebook_url) score += 10;
  
  // Others (WhatsApp / WeChat)
  if (profile.whatsapp_id || profile.wechat_id) score += 10;

  return Math.min(score, 100);
}
