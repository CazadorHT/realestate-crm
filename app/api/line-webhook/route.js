import { NextResponse } from 'next/server';

export async function POST(req) {
  const body = await req.json();

  // LINE จะส่งเหตุการณ์ (events) มาเป็น Array
  const events = body.events;

  for (const event of events) {
    // ตรวจสอบว่าเป็นเหตุการณ์ "เพิ่มเพื่อน" (follow) หรือไม่
    if (event.type === 'follow') {
      const userId = event.source.userId;
      
      console.log("ได้ User ID ใหม่แล้ว:", userId);

      // ตรงนี้คือจุดที่คุณต้องเอา userId ไปบันทึกลง Database
      // เช่น await supabase.from('profiles').update({ line_user_id: userId }).eq('...', '...')
    }
  }

  return NextResponse.json({ status: 'ok' });
}