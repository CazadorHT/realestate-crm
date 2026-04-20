"use client";

import { m, useAnimation } from "framer-motion";
import { Headset } from "lucide-react";

interface AnimatedHeadsetProps {
  size?: number;
  className?: string;
}

export function AnimatedHeadset({ size = 24, className }: AnimatedHeadsetProps) {
  const controls = useAnimation();

  return (
    <div
      onMouseEnter={() =>
        controls.start({
          scale: [1, 1.15, 1],
          y: [0, -3, 0],
          transition: { duration: 0.4 },
        })
      }
      className={className}
    >
      <m.div animate={controls}>
        <Headset size={size} />
      </m.div>
    </div>
  );
}
