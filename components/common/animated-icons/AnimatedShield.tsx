"use client";

import { m, useAnimation } from "framer-motion";
import { Shield } from "lucide-react";

interface AnimatedShieldProps {
  size?: number;
  className?: string;
}

export function AnimatedShield({ size = 24, className }: AnimatedShieldProps) {
  const controls = useAnimation();

  return (
    <div
      onMouseEnter={() =>
        controls.start({
          scale: [1, 1.1, 1],
          y: [0, -2, 0],
          transition: { duration: 0.5 },
        })
      }
      className={className}
    >
      <m.div animate={controls}>
        <Shield size={size} />
      </m.div>
    </div>
  );
}
