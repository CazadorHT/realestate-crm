"use client";

import { motion, useAnimation } from "framer-motion";
import { User } from "lucide-react";

export const AnimatedUser = ({
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
        controls.start({ y: [0, -2, 0], transition: { duration: 0.5 } })
      }
      className={className}
    >
      <motion.div animate={controls}>
        <User size={size} />
      </motion.div>
    </div>
  );
};
