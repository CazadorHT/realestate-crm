"use client";

import { useState, useEffect } from "react";

const words = ["บ้าน", "คอนโด", "สำนักงานออฟฟิศ", "ที่พักกาย", "ที่พักใจ"];

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
    <h1 className="text-5xl  md:text-6xl font-bold leading-tight  ">
      <p className="inline-block">ค้นหา</p>
      
      <div className="inline-block ml-3 relative  min-w-[200px]    ">
        <span
          key={index}
          className="   bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-8 duration-700 flex items-center h-full  leading-normal"
        >
          {words[index]}
        </span>
      </div>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent py-4">
        ที่ใช่สำหรับคุณ
      </div>
    </h1>
    </div>
  );
}
