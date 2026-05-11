"use client";

import { m, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface MotionSectionProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  delay?: number;
  duration?: number;
}

export function MotionSection({
  children,
  delay = 0,
  duration = 0.4,
  ...props
}: MotionSectionProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98], // Custom ease for premium feel
      }}
      {...props}
    >
      {children}
    </m.div>
  );
}

export function MotionStaggerContainer({
  children,
  staggerChildren = 0.05,
  delayChildren = 0,
  ...props
}: HTMLMotionProps<"div"> & {
  staggerChildren?: number;
  delayChildren?: number;
}) {
  return (
    <m.div
      initial="initial"
      animate="animate"
      variants={{
        initial: { opacity: 0 },
        animate: {
          opacity: 1,
          transition: {
            staggerChildren,
            delayChildren,
          },
        },
      }}
      {...props}
    >
      {children}
    </m.div>
  );
}

export function MotionStaggerItem({
  children,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <m.div
      variants={{
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
      }}
      transition={{
        duration: 0.4,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      {...props}
    >
      {children}
    </m.div>
  );
}
