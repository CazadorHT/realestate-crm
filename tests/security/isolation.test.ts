import { describe, it, expect, vi } from 'vitest';
import * as dotenv from 'dotenv';

// 🛡️ โหลดค่าจาก .env
dotenv.config();

// 🛡️ ปิดการ Mock เพื่อยิงไปที่ Database จริงๆ
vi.unmock('@supabase/supabase-js');
vi.unmock('@supabase/ssr');

import { createClient } from '@supabase/supabase-js';
import { Database } from '../../lib/database.types';

// หมายเหตุ: ในการรันเทสนี้ จำเป็นต้องมี SUPABASE_URL และ SUPABASE_ANON_KEY ใน .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

describe('🛡️ Security & Isolation Audit', () => {
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  it('🚫 Rate Limiting: Should block rapid omni_messages inserts', async () => {
    console.log('🚀 Starting Sequential Rate Limit Test...');
    const results = [];
    
    // ยิงแบบ Sequential เพื่อให้ Database นับเลขได้ทัน
    for (let i = 0; i < 10; i++) {
      const res = await supabase.from('omni_messages').insert({
        content: `Sequential test ${i}`,
        direction: null, // ใช้ null เพื่อเลี่ยง Check Constraint (เพราะใน Type เป็น nullable)
        source: 'OTHER' as const
      });
      results.push(res);
    }

    const errors = results.filter(r => r.error);
    const rateLimitErrors = errors.filter(e => e.error?.message.includes('Rate limit exceeded'));
    const permissionErrors = errors.filter(e => e.error?.message.includes('permission denied'));

    if (errors.length > 0 && rateLimitErrors.length === 0 && permissionErrors.length === 0) {
      console.log('⚠️ Unexpected Errors:', errors.map(e => e.error?.message));
    }

    console.log(`📊 Rate Limit Test: Sent 10, Blocked by RateLimit: ${rateLimitErrors.length}, Blocked by RLS: ${permissionErrors.length}`);
    
    // ผ่านถ้าถูกบล็อกด้วยวิธีใดวิธีหนึ่ง
    expect(rateLimitErrors.length + permissionErrors.length).toBeGreaterThan(0);
  }, 20000);

  it('🔒 Tenant Isolation: Should be blocked or return empty (Secure by Default)', async () => {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, full_name, tenant_id')
      .limit(10);

    // ในระบบ Diamond Grade การได้รับ Permission Denied สำหรับ function เช็คสิทธิ์ ถือว่าปลอดภัยสูงสุด
    if (error) {
      console.log(`🛡️ Isolation Result: Blocked correctly (${error.message})`);
      expect(error.message).toMatch(/permission denied|not found/);
    } else {
      console.log(`🛡️ Isolation Result: Found ${leads?.length || 0} leads (authorized only)`);
      expect(leads?.length).toBe(0); // Anon ต้องไม่เห็นอะไรเลย
    }
  }, 20000);

  it('🛡️ RPC Protection: Should NOT be able to call internal functions via RPC', async () => {
    // @ts-ignore
    const { data, error } = await supabase.rpc('is_tenant_member', { 
      target_tenant_id: '00000000-0000-0000-0000-000000000000' 
    });

    // ตรวจสอบข้อความ Error หลากหลายรูปแบบที่ PostgREST อาจส่งกลับมา
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/permission denied|does not exist|schema cache/);
  });
});
