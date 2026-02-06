"use client";

import { useState, useEffect } from "react";

const words = [
  "บ้านเดี่ยวทำเลดี",
  "คอนโดทำเลทอง",
  "สำนักงานออฟฟิศเพื่อธุรกิจ",
  "ทาวน์โฮมพร้อมอยู่",
  "การลงทุนที่คุ้มค่า",
  "ที่ดินศักยภาพสูง",
];

export function HeroTitle() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex">
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
        <p className="inline-block text-white">ค้นหา</p>

        <div className="inline-block ml-2 sm:ml-3 relative">
          <span
            key={index}
            className="bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-8 duration-700 flex items-center h-full leading-normal"
          >
            {words[index]}
          </span>
        </div>
        <div className="bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent leading-normal">
          ที่ใช่สำหรับคุณ
        </div>
      </h1>
    </div>
  );
}
