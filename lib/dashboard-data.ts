// lib/dashboard-data.ts

// =========================================================================
// DASHBOARD MOCK DATA
// =========================================================================
// TODO: When connecting to Supabase, replace these constants with async functions
// that query tables: 'properties', 'leads', 'deals', 'tasks', 'activities'.

  export const KPIS_SUMMARY = {
    // TODO: COUNT(leads) where created_at >= start_of_month
    leadsThisMonth: 12,
    leadsChange: "+20%",
    leadsTotal: 45, // NEW: Context for leads
  
    // TODO: COUNT(deals) where created_at >= start_of_month
    dealsThisMonth: 5,
    dealsChange: "+1",
    dealsTotal: 12, // NEW: Context for deals
  
    // TODO: SUM(commission) where status = 'CLOSED' and date >= start_of_month
    revenueThisMonth: 1245000,
    revenueChange: "+12.5%",
  
    // TODO: (Closed Won / Total Closed) * 100
    conversionRate: 18.2,
    conversionChange: "+2.1%",
    conversionBase: "จาก 22 Leads" // NEW: Context string
  };
  
  export const SMART_SUMMARY_TEXT = "วันนี้คุณมี 3 นัดหมายสำคัญ, 2 ดีลที่กำลังต่อรองใกล้ปิดการขาย, และมี 1 Lead ใหม่ที่ยังไม่ได้ติดต่อ";
  
  export const REVENUE_CHART_DATA = [
    // TODO: Group by month of closed deals
    { name: "ม.ค.", total: 450000 },
    { name: "ก.พ.", total: 800000 },
    { name: "มี.ค.", total: 1200000 },
    { name: "เม.ย.", total: 950000 },
    { name: "พ.ค.", total: 1500000 },
    { name: "มิ.ย.", total: 1245000 },
  ];
  
  export const FUNNEL_STATS = [
    // TODO: Count deals in each funnel step
    { step: "Lead", count: 100, fill: "#94a3b8" },       // Slate-400
    { step: "Contacted", count: 65, fill: "#60a5fa" },    // Blue-400
    { step: "Viewed", count: 40, fill: "#818cf8" },       // Indigo-400
    { step: "Negotiating", count: 15, fill: "#f472b6" },  // Pink-400
    { step: "Closed Won", count: 8, fill: "#4ade80" },    // Green-400
  ];
  
  export const PIPELINE_COUNTS = [
    // TODO: Count deals by stage
    { stage: "NEW", count: 12, color: "bg-blue-500", label: "Lead ใหม่" },
    { stage: "CONTACTED", count: 8, color: "bg-indigo-500", label: "ติดต่อแล้ว" },
    { stage: "VIEWED", count: 5, color: "bg-purple-500", label: "เข้าชมทรัพย์" },
    { stage: "NEGOTIATING", count: 3, color: "bg-orange-500", label: "กำลังต่อรอง" },
    { stage: "CLOSED", count: 8, color: "bg-green-500", label: "ปิดการขาย" },
  ];
  
  export const TODAY_AGENDA = [
    // TODO: Select from 'events' where date = CURRENT_DATE
    { id: 1, time: "10:00", title: "พาลูกค้าชมห้อง (Viewing)", type: "meeting", priority: "high" },
    { id: 2, time: "13:00", title: "ประชุมทีมสรุปยอด", type: "meeting", priority: "medium" },
    { id: 3, time: "15:30", title: "โทร Follow-up คุณเดชา", type: "call", priority: "low" },
  ];
  
  export const NOTIFICATIONS = [
    // TODO: Select from 'notifications' where read = false
    { id: 1, message: "Lead ใหม่: คุณสมศรี สนใจคอนโด A", type: "info", time: "10m ago", read: false },
    { id: 2, message: "ดีล #4402 ใกล้กำหนดปิดการขาย", type: "warning", time: "2h ago", read: false },
    { id: 3, message: "Task 'โทรติดตาม' ครบกำหนด (Overdue)", type: "alert", time: "Now", read: false },
    { id: 4, message: "อัปเดตระบบเสร็จสิ้น", type: "info", time: "1d ago", read: true },
  ];
  
  export const FOLLOW_UP_LEADS = [
    // TODO: Leads where last_activity > 3 days and status != CLOSED
    { id: 1, name: "คุณวิชัย", daysQuiet: 5, stage: "CONTACTED" },
    { id: 2, name: "คุณแอนนา", daysQuiet: 4, stage: "VIEWED" },
  ];
  
  export const RISK_DEALS = [
    // TODO: Deals where time_in_stage > 7 days
    { id: 1, title: "ขายบ้านเดี่ยว บางนา", daysInStage: 14, stage: "NEGOTIATING" },
    { id: 2, title: "เช่าคอนโด สาทร", daysInStage: 10, stage: "VIEWED" },
  ];
  
  export const MISSING_DATA_STATS = {
    // TODO: Count rows with NULL columns
    noPhone: 3,
    noPhotos: 5,
    noBudget: 2,
  };
