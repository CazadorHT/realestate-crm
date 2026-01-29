"use client";

import dynamic from "next/dynamic";
import { LucideProps } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { useMemo } from "react";

interface DynamicIconProps extends LucideProps {
  name: string;
}

export const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  const Icon = useMemo(() => {
    const iconName = name as keyof typeof dynamicIconImports;
    // Fallback if icon doesn't exist in registry
    if (!dynamicIconImports[iconName]) {
      // Return a default or null. Using 'box' as safe fallback or just null to avoid hydration errors if mismatch
      return null;
    }
    return dynamic(dynamicIconImports[iconName], {
      loading: () => (
        <div
          className="animate-pulse bg-slate-200 rounded-md"
          style={{ width: props.size || 24, height: props.size || 24 }}
        />
      ),
    });
  }, [name]);

  if (!Icon) {
    // Fallback UI or empty
    return (
      <div
        className={`bg-slate-100 ${props.className}`}
        style={{ width: props.size || 24, height: props.size || 24 }}
      />
    );
  }

  return <Icon {...props} />;
};
