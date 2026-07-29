import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/database.types.generated";
import { UserRole } from "@/lib/auth-shared";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type IdentityRow =
  Database["public"]["Tables"]["identities_v3"]["Row"] & {
    wechat_user_id?: string | null;
    whatsapp_user_id?: string | null;
  };

export type Profile = ProfileRow & {
  role: UserRole;
  email: string | null;
  display_name: string | null;
  nickname: string | null;
  signature_url: string | null;
  tenantId: string | null;
  avatar_url: string | null;
  wechat_user_id: string | null;
  whatsapp_user_id: string | null;
};

type IdentityWithProfile = IdentityRow & {
  profile: ProfileRow | null;
};

import { cache } from "react";

// ดึงข้อมูลโปรไฟล์ปัจจุบันจาก Supabase Auth และตาราง profiles (Memoized per request)
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();

  // 1. ดึงข้อมูล User จาก Supabase Auth (System Table)
  // ส่วนนี้เก็บข้อมูล Login พื้นฐาน เช่น ID, Email และ Metadata จาก Provider (Google, etc.)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    // Only log if it's a real error, not just a missing session
    if (userError && userError.name !== "AuthSessionMissingError") {
      console.error("auth.getUser error", userError);
    }
    return null;
  }

  // 2. ดึงข้อมูลแบบแยกกัน (ตาราง identities_v3 และ profiles) เพื่อเลี่ยงการใช้ Join query ที่ต้องการ constraint
  const { data: identityData, error: identityError } = await supabase
    .from("identities_v3")
    .select(
      "id, tenant_id, category, role, display_name, email, avatar_url, phone, line_id, is_active, created_at, updated_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  let profileData = null;
  if (identityData) {
    const { data: pData } = await supabase
      .from("profiles")
      .select(
        "id, full_name, display_name, email, avatar_url, phone, role, bio, line_id, line_user_id, telegram_id, facebook_url, whatsapp_id, wechat_id, tax_id, tax_address, bank_code, bank_account_no, bank_account_name, other_bank_name, notification_preferences, metadata, is_active, last_seen_at, created_at, updated_at, deleted_at, last_login_at, last_ip, nickname, signature_url, wechat_user_id, whatsapp_user_id",
      )
      .eq("id", user.id)
      .maybeSingle();
    profileData = pData;
  }

  const identity = identityData as unknown as IdentityRow;
  const profile = profileData as unknown as ProfileRow | null;

  if (identityError || !identity) {
    console.warn(
      "Identity not found in DB, using auth metadata",
      identityError,
    );

    return {
      id: user.id,
      display_name:
        user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      email: user.email ?? null,
      role: (user.user_metadata?.role as UserRole) ?? ("AGENT" as UserRole),
      nickname: user.user_metadata?.nickname ?? null,
      avatar_url:
        user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
      signature_url: null,
      tenantId: null,
      full_name:
        user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      phone: null,
      line_id: null,
      line_user_id: null,
      facebook_url: null,
      whatsapp_id: null,
      wechat_id: null,
      telegram_id: null,
      tax_id: null,
      tax_address: null,
      bank_code: null,
      bank_account_no: null,
      bank_account_name: null,
      other_bank_name: null,
      notification_preferences: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      bio: null,
      last_ip: null,
      last_login_at: null,
      last_seen_at: null,
      metadata: null,
      is_active: true,
      wechat_user_id: null,
      whatsapp_user_id: null,
    } as Profile;
  }

  // 3. Prepare default fields to ensure No-Any & No-Undefined crashes
  const defaultFields: Partial<ProfileRow> = {
    full_name: identity.display_name || null,
    nickname: identity.nickname || null,
    phone: identity.phone || null,
    line_id: identity.line_id || null,
    avatar_url: identity.avatar_url || null,
    display_name: identity.display_name || null,
    email: identity.email || null,
    role: (identity.role as string) || "AGENT",
    bio: null,
    tax_id: null,
    tax_address: null,
    bank_code: null,
    bank_account_no: null,
    bank_account_name: null,
    other_bank_name: null,
    notification_preferences: null,
    signature_url: null,
    line_user_id: null,
    facebook_url: null,
    whatsapp_id: null,
    wechat_id: null,
    telegram_id: null,
    last_ip: null,
    last_login_at: null,
    last_seen_at: null,
    metadata: null,
    is_active: true,
    created_at: identity.created_at || new Date().toISOString(),
    updated_at: identity.updated_at || new Date().toISOString(),
    deleted_at: null,
  };

  // Merge Identity & Profile (Identity is the master for communication & role)
  return {
    ...defaultFields,
    ...profile,
    id: identity.id,
    email: identity.email || user.email || null,
    role: (identity.role as UserRole) || "AGENT",
    category: identity.category ?? undefined,
    tenantId: identity.tenant_id || null,
    display_name: identity.display_name,
    nickname:
      identity.nickname || profile?.nickname || defaultFields.nickname || null,
    signature_url: profile?.signature_url || null,
    avatar_url:
      identity.avatar_url ||
      profile?.avatar_url ||
      defaultFields.avatar_url ||
      null,
    full_name:
      profile?.full_name ||
      identity.display_name ||
      defaultFields.full_name ||
      null,
    phone: identity.phone || profile?.phone || defaultFields.phone || null,
    line_id:
      identity.line_id || profile?.line_id || defaultFields.line_id || null,
    wechat_user_id: identity.wechat_user_id || profile?.wechat_user_id || null,
    whatsapp_user_id:
      identity.whatsapp_user_id || profile?.whatsapp_user_id || null,
  } as Profile;
});
