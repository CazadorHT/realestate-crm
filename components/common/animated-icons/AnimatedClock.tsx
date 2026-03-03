"use client";

import { motion, useAnimation } from "framer-motion";
import { Clock } from "lucide-react";

export const AnimatedClock = ({
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
          rotate: 360,
          transition: { duration: 2, ease: "linear", repeat: Infinity },
        })
      }
      onMouseLeave={() => controls.stop()}
      className={className}
    >
      <motion.div animate={controls}>
        <Clock size={size} />
      </motion.div>
    </div>
  );
};
