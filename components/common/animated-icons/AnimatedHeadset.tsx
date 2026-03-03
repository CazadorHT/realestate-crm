"use client";

import { motion, useAnimation } from "framer-motion";
import { Headset } from "lucide-react";

export const AnimatedHeadset = ({
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
          scale: [1, 1.05, 1],
          rotate: [0, -5, 5, 0],
          transition: { duration: 0.4 },
        })
      }
      className={className}
    >
      <motion.div animate={controls}>
        <Headset size={size} />
      </motion.div>
    </div>
  );
};
