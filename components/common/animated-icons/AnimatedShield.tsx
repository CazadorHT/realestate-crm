"use client";

import { motion, useAnimation } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export const AnimatedShield = ({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) => {
  const controls = useAnimation();

  return (
    <div
      onMouseEnter={() =>
        controls.start({ scale: [1, 1.1, 1], transition: { duration: 0.3 } })
      }
      className={className}
    >
      <motion.div animate={controls}>
        <ShieldCheck size={size} />
      </motion.div>
    </div>
  );
};
