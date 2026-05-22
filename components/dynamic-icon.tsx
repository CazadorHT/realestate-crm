"use client";

import { LucideProps } from "lucide-react";
import { DynamicIcon as LucideDynamicIcon } from "lucide-react/dynamic";

interface DynamicIconProps extends LucideProps {
  name: string;
}

export const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
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
