"use client";

import dynamic from "next/dynamic";
import { LucideProps } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { useMemo } from "react";

interface DynamicIconProps extends LucideProps {
  name: string;
}

export const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  const iconName = name as keyof typeof dynamicIconImports;

  const Icon = useMemo(() => {
    if (!dynamicIconImports[iconName]) {
      return null;
    }

    return dynamic(dynamicIconImports[iconName], {
      loading: () => (
        <div
          className="animate-pulse bg-slate-200 rounded-md"
          style={{ width: props.size || 24, height: props.size || 24 }}
        />
      ),
      ssr: true, // Ensure it's handled correctly by SSR
    });
  }, [iconName, props.size]); // Use iconName instead of name for better stability

  if (!Icon) {
    return (
      <div
        className={`bg-slate-100 ${props.className || ""}`}
        style={{ width: props.size || 24, height: props.size || 24 }}
      />
    );
  }

  return <Icon {...props} />;
};
