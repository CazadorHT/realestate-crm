"use client";

import { motion, useAnimation } from "framer-motion";
import { Send } from "lucide-react";

export const AnimatedSend = ({
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
        controls.start({
          x: [0, 5, 0],
          y: [0, -5, 0],
          transition: { duration: 0.5 },
        })
      }
      className={className}
    >
      <motion.div animate={controls}>
        <Send size={size} />
      </motion.div>
    </div>
  );
};
