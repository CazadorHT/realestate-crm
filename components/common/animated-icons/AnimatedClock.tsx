"use client";

import { m, useAnimation } from "framer-motion";
import { Clock } from "lucide-react";

interface AnimatedClockProps {
  size?: number;
  className?: string;
}

export function AnimatedClock({ size = 24, className }: AnimatedClockProps) {
  const controls = useAnimation();

  return (
    <div
      onMouseEnter={() =>
        controls.start({
          rotate: [0, 360],
          transition: { duration: 0.8, ease: "easeInOut" },
        })
      }
      className={className}
    >
      <m.div animate={controls}>
        <Clock size={size} />
      </m.div>
    </div>
  );
}
