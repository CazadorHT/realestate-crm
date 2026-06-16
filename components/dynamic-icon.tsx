"use client";

import { LucideProps } from "lucide-react";
import { DynamicIcon as LucideDynamicIcon } from "lucide-react/dynamic";
import { FaAirbnb } from "react-icons/fa6";

interface DynamicIconProps extends Omit<LucideProps, "color"> {
  name: string;
}

export const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  if (name === "airbnb") {
    const size = props.size || 16;
    return (
      <span
        className="inline-flex items-center justify-center text-[#FF5A5F]"
        style={{ width: size, height: size }}
      >
        <FaAirbnb className={props.className} style={{ width: size, height: size }} />
      </span>
    );
  }

  // Safe cast for lucide name
  const iconName = name as any;

  return (
    <span
      className="inline-flex items-center justify-center"
      style={{ width: props.size || 24, height: props.size || 24 }}
    >
      <LucideDynamicIcon name={iconName} {...props} />
    </span>
  );
};
