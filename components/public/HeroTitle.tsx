"use client";

import { useState, useEffect } from "react";

const words = ["บ้าน", "คอนโด", "ออฟฟิศ", "ที่พักกาย", "ที่พักใจ"];

export function HeroTitle() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <h1 className="text-5xl md:text-6xl font-bold leading-tight">
      ค้นหา
      <span className="inline-block ml-3 relative h-[2.2em]  overflow-hidden min-w-[300px] translate-y-[0.1em] ">
        <span
          key={index}
          className="absolute mt-10 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-8 duration-700 flex items-center h-full  leading-normal"
        >
          {words[index]}
        </span>
      </span>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent py-4">
        ที่ใช่สำหรับคุณ
      </div>
    </h1>
  );
}
