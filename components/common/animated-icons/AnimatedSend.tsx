"use client";

import { m, useAnimation } from "framer-motion";
import { Send } from "lucide-react";

interface AnimatedSendProps {
  size?: number;
  className?: string;
}

export function AnimatedSend({ size = 24, className }: AnimatedSendProps) {
  const controls = useAnimation();

  return (
    <div
      onMouseEnter={() =>
        controls.start({
          x: [0, 5, -2, 0],
          y: [0, -5, 2, 0],
          transition: { duration: 0.5 },
        })
      }
      className={className}
    >
      <m.div animate={controls}>
        <Send size={size} />
      </m.div>
    </div>
  );
}
