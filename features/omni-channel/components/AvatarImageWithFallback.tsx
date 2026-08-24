"use client";

import { useState, useEffect } from "react";
import { User } from "lucide-react";

interface AvatarImageWithFallbackProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackIconClassName?: string;
}

export function AvatarImageWithFallback({
  src,
  alt,
  className = "h-full w-full object-cover rounded-full",
  fallbackIconClassName = "h-6 w-6 text-slate-400",
}: AvatarImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state if image source changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return <User className={fallbackIconClassName} />;
  }

  // If the image is an external Facebook lookaside URL, route it through our server-side avatar proxy
  const finalSrc = src.includes("platform-lookaside.fbsbx.com") || src.includes("fbcdn.net")
    ? `/api/avatar-proxy?url=${encodeURIComponent(src)}`
    : src;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        setHasError(true);
      }}
    />
  );
}
