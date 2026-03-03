"use client";

import { motion, useAnimation } from "framer-motion";
import { Phone } from "lucide-react";

export const AnimatedPhone = ({
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
          rotate: [0, -10, 10, -10, 10, 0],
          transition: { duration: 0.5 },
        })
      }
      className={className}
    >
      <motion.div animate={controls}>
        <Phone size={size} />
      </motion.div>
    </div>
  );
};
