import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client directly here to avoid circular deps or context issues in simple route
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req) {
  const body = await req.json();

  // LINE จะส่งเหตุการณ์ (events) มาเป็น Array
  const events = body.events;

  for (const event of events) {
    const userId = event.source.userId;
    console.log("LINE Webhook Event:", event.type);
    
    // ตรวจสอบว่าเป็นเหตุการณ์ "เพิ่มเพื่อน" (follow) หรือไม่
    if (event.type === 'follow') {
      console.log("มีคนเพิ่มเพื่อนใหม่:", userId);
      
      try {
        // หา User คนแรก (หรือ Admin) เพื่อ update line_id
        // หมายเหตุ: วิธีนี้จะผูกกับ User คนแรกที่เจอ ถ้ามีหลาย User ควรมีวิธีระบุตัวตนที่ดีกว่านี้
        // เช่น ให้ User พิมพ์ Email มายืนยันตัวตน
        
        // 1. ลองหา Admin ก่อน
        let { data: admin } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'ADMIN')
            .limit(1)
            .single();

        // 2. ถ้าไม่มี Admin ให้หา User คนแรกสุด
        if (!admin) {
            const { data: firstUser } = await supabase
                .from('profiles')
                .select('id')
                .limit(1)
                .single();
            admin = firstUser;
        }

        if (admin) {
             console.log("Found admin/user:", admin.id); // Log found user
             const { error } = await supabase
                .from('profiles')
                .update({ line_id: userId })
                .eq('id', admin.id);
             
             if (!error) {
                 console.log(`✅ Updated Line ID ${userId} for User ${admin.id}`);
             } else {
                 console.error("❌ Error updating Line ID:", error);
             }
        } else {
            console.log("❌ No user profile found to link Line ID.");
            // Log all profiles count to see if table is empty
            const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            console.log("Total profiles in DB:", count);
        }

      } catch (err) {
        console.error("Error in webhook logic:", err);
      }
    }
  }

  return NextResponse.json({ status: 'ok' });
}