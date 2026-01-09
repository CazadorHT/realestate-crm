"use client";

import { Building2, Users2, Trophy, Headset, Sparkles } from "lucide-react";

export function StatsBand() {
  const stats = [
    {
      icon: <Building2 className="w-6 h-6" />,
      value: "500+",
      label: "อสังหาฯ คุณภาพคัดสรร",
      subLabel: "Verified Properties",
    },
    {
      icon: <Users2 className="w-6 h-6" />,
      value: "1,200+",
      label: "ครอบครัวที่ไว้วางใจ",
      subLabel: "Happy Families",
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      value: "98%",
      label: "อัตราความสำเร็จ",
      subLabel: "Success Rate",
    },
    {
      icon: <Headset className="w-6 h-6" />,
      value: "24/7",
      label: "ทีมงานดูแลใกล้ชิด",
      subLabel: "Premium Support",
    },
  ];

  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 ">
      {/* === BACKGROUND DESIGN === */}
      {/* ใช้สีเข้มเพื่อให้สถิติดูโดดเด่นและน่าเชื่อถือ */}
      <div className="absolute inset-0 bg-[#0F172A] -z-20" />

      {/* เพิ่ม Mesh Gradient จางๆ ให้ดูแพง */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 -z-10 blur-3xl opacity-50" />

      {/* ลายตารางทางสถาปัตยกรรม */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] -z-10" />

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="relative group flex flex-col items-center text-center space-y-4"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              {/* Icon Container with Glassmorphism */}
              <div className="w-14 h-14 rounded-2xl relative overflow-hidden backdrop-blur-md border border-white/10 flex items-center justify-center transition-all duration-500 shadow-xl shadow-blue-900/20 group-hover:scale-110">
                {/* Base Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 z-0" />

                {/* Hover Gradient (Fade In) */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />

                {/* Icon */}
                <div className="relative z-10 text-blue-200 group-hover:text-white transition-colors duration-500">
                  {stat.icon}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-4xl md:text-5xl font-extrabold text-white tracking-normal">
                  {stat.value}
                </div>
                <div className="flex flex-col">
                  <span className="text-blue-100 font-medium text-sm md:text-base">
                    {stat.label}
                  </span>
                  <span className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-semibold">
                    {stat.subLabel}
                  </span>
                </div>
              </div>

              {/* เส้นคั่นตกแต่งระหว่างรายการ (เฉพาะ Desktop) */}
              {index !== stats.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-[1px] h-12 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
