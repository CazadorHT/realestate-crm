"use client";

import { useState } from "react";
import Image from "next/image";
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
  className = "h-full w-full object-cover",
  fallbackIconClassName = "h-6 w-6 text-slate-400",
}: AvatarImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return <User className={fallbackIconClassName} />;
  }

  return (
    <Image
      src={src}
      className={className}
      fill
      sizes="40px"
      unoptimized
      alt={alt}
      onError={() => setHasError(true)}
    />
  );
}
