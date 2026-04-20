"use client";

import { m, useAnimation } from "framer-motion";
import { User } from "lucide-react";

interface AnimatedUserProps {
  size?: number;
  className?: string;
}

export function AnimatedUser({ size = 24, className }: AnimatedUserProps) {
  const controls = useAnimation();

  return (
    <div
      onMouseEnter={() =>
        controls.start({
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0],
          transition: { duration: 0.5 },
        })
      }
      className={className}
    >
      <m.div animate={controls}>
        <User size={size} />
      </m.div>
    </div>
  );
}
