"use client";

import { m, useAnimation } from "framer-motion";
import { Phone } from "lucide-react";

interface AnimatedPhoneProps {
  size?: number;
  className?: string;
}

export function AnimatedPhone({ size = 24, className }: AnimatedPhoneProps) {
  const controls = useAnimation();

  return (
    <div
      onMouseEnter={() =>
        controls.start({
          rotate: [0, -10, 10, -10, 10, 0],
          transition: { duration: 0.5 },
        })
      }
      className={className}
    >
      <m.div animate={controls}>
        <Phone size={size} />
      </m.div>
    </div>
  );
}
