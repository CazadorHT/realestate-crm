"use client";

import { useEffect, useRef } from "react";
import { incrementBlogViewCount } from "@/features/blog/actions";

interface BlogViewCounterProps {
  id: string;
}

/**
 * Silent Client Component that triggers an atomic increment 
 * of the blog post's view count when visited.
 */
export function BlogViewCounter({ id }: BlogViewCounterProps) {
  const hasIncremented = useRef(false);

  useEffect(() => {
    // Only increment once per mount
    if (!hasIncremented.current && id) {
      hasIncremented.current = true;
      
      // We do this silently in the background
      incrementBlogViewCount(id).catch((err) => {
        console.error("View tracking error:", err);
      });
    }
  }, [id]);

  return null; // This component doesn't render anything visible
}
